"""Verified, fixed-year city comparison, separate from recent individual contracts."""
import csv
import io
import json
from pathlib import Path

ROOT=Path(__file__).parent
SEX_ROWS={'강간','유사강간','강제추행','기타 강간/강제추행등'}

def fusion_data():
    folder=ROOT/'data'
    population=json.loads((folder/'population-2024.json').read_text(encoding='utf-8'))
    rent=json.loads((folder/'rent-summary-2024.json').read_text(encoding='utf-8'))
    geo=json.loads((folder/'seoul-gu.geojson').read_text(encoding='utf-8'))
    raw=(folder/'crime-2024.csv').read_bytes()
    try:text=raw.decode('utf-8-sig')
    except UnicodeDecodeError:text=raw.decode('cp949')
    rows=list(csv.DictReader(io.StringIO(text)))
    names=set(population['districts'])
    if len(names)!=25 or names!=set(rent['districts']) or names!={f['properties']['name'] for f in geo['features']}:
        raise ValueError('25개 자치구의 지도·월세·인구 연결이 일치하지 않습니다.')
    if not SEX_ROWS.issubset({r['범죄중분류'].strip() for r in rows}):
        raise ValueError('성범죄 관련 중분류가 누락되었습니다.')
    districts={}
    for name in sorted(names):
        pop=population['districts'][name]
        if pop<=0:raise ValueError('인구가 없거나 0입니다.')
        values={'drug':0,'sexual':0}
        for row in rows:
            count=int(row['서울 '+name].replace(',',''))
            if count<0:raise ValueError('음수 범죄 건수')
            if row['범죄중분류'].strip() in SEX_ROWS:values['sexual']+=count
            if row['범죄중분류'].strip()=='마약범죄':values['drug']+=count
        districts[name]={'population':pop,**values}
    return {'year':2024,'districts':districts,'rent':rent,'geo':geo,'population':population}
