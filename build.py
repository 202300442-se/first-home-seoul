"""Collect public rent records; never publish the service key or request URL."""
import csv
import io
import json
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, unquote
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
import xml.etree.ElementTree as ET
import time
from fusion import fusion_data

ROOT = Path(__file__).parent
DISTRICTS = {'11230': '동대문구', '11290': '성북구', '11260': '중랑구'}
ENDPOINT = 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent'
KST = timezone(timedelta(hours=9))

def months_before(today, count=3):
    index = today.year * 12 + today.month - 1
    return [f'{(index - i) // 12:04d}{(index - i) % 12 + 1:02d}' for i in range(count, 0, -1)]

def number(value):
    return float(value.strip().replace(',', ''))

def parse_page(raw, district):
    try:
        tree = ET.fromstring(raw)
    except ET.ParseError:
        raise ValueError('API 응답이 XML 형식이 아닙니다.') from None
    code = tree.findtext('.//resultCode')
    if code not in ('000', '00', '0000'):
        raise ValueError('API 인증 또는 응답 오류. 활용신청 승인과 Secret을 확인하세요.')
    records = []
    for item in tree.findall('.//item'):
        def field(name):
            return (item.findtext(name) or '').strip()
        try:
            deposit, rent, area = number(field('deposit')), number(field('monthlyRent')), number(field('excluUseAr'))
            day = datetime(int(field('dealYear')), int(field('dealMonth')), int(field('dealDay'))).date().isoformat()
            if deposit < 0 or rent < 0 or area <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise ValueError('계약 금액·면적·날짜에 누락 또는 잘못된 값이 있습니다.') from None
        records.append({'district': district, 'dong': field('umdNm'), 'building': field('offiNm'), 'area': area, 'deposit': deposit, 'rent': rent, 'date': day, 'floor': field('floor'), 'contract': field('contractType') or '미제공'})
    total = int(tree.findtext('.//totalCount') or '0')
    if total < len(records):
        raise ValueError('API 전체 건수와 응답 건수가 맞지 않습니다.')
    return records, total

def fetch_records(key, months):
    all_records = []
    for district_code, district in DISTRICTS.items():
        for month in months:
            page, collected, expected = 1, [], None
            while True:
                url = ENDPOINT + '?' + urlencode({'serviceKey': unquote(key), 'LAWD_CD': district_code, 'DEAL_YMD': month, 'pageNo': page, 'numOfRows': 1000})
                raw = None
                for attempt in range(3):
                    try:
                        with urlopen(url, timeout=40) as response:
                            raw = response.read()
                        break
                    except (HTTPError, URLError, TimeoutError):
                        if attempt == 2:
                            raise ValueError('국토교통부 API 연결 실패. 인증·승인 상태를 확인하고 다시 실행하세요.') from None
                        time.sleep(2 * (attempt + 1))
                records, total = parse_page(raw, district)
                if expected is None:
                    expected = total
                if total != expected:
                    raise ValueError('조회 도중 자료 건수가 변경되었습니다. 다시 실행하세요.')
                collected.extend(records)
                if len(collected) == total:
                    break
                if not records or len(collected) > total or page >= 100:
                    raise ValueError('페이지별 조회가 불완전합니다. 이전 배포를 유지합니다.')
                page += 1
            all_records.extend(collected)
            print(f'{district_code} / {month}: {len(collected)} records')
    return sorted(all_records, key=lambda row: row['date'], reverse=True)

def crime_data():
    raw = (ROOT / 'data/crime-2024.csv').read_bytes()
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('cp949')
    rows = list(csv.DictReader(io.StringIO(text)))
    result = {}
    for district in DISTRICTS.values():
        result[district] = {}
        for row in rows:
            group = row['범죄대분류'].strip()
            value = int(row['서울 ' + district].replace(',', '').strip())
            if value < 0:
                raise ValueError('잘못된 범죄 통계 값')
            result[district][group] = result[district].get(group, 0) + value
    return result

def main():
    key = os.environ.get('DATA_GO_KR_KEY', '').strip()
    if not key:
        raise ValueError('DATA_GO_KR_KEY Secret이 없습니다. 예시 데이터로 대체하지 않습니다.')
    now = datetime.now(KST)
    months = months_before(now)
    data = {'generated': now.isoformat(timespec='seconds'), 'months': months, 'districts': list(DISTRICTS.values()), 'rent': fetch_records(key, months), 'crime': crime_data(), 'crimeYear': 2024}
    data['fusion'] = fusion_data()
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    html = (ROOT / 'index.template.html').read_text(encoding='utf-8').replace('__PUBLIC_DATA__', payload)
    if key in html:
        raise ValueError('인증키 노출 검사 실패')
    out = ROOT / '_site'
    out.mkdir(exist_ok=True)
    (out / 'index.html').write_text(html, encoding='utf-8')
    for name in ('style.css', 'app.js', 'map.js'):
        (out / name).write_bytes((ROOT / name).read_bytes())
    (out / '.nojekyll').touch()
    (out / 'data.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    print(f'Build complete: {len(data["rent"])} real contracts; crime year 2024.')

if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        raise SystemExit(str(error)) from None
