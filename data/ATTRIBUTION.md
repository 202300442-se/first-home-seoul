# 통합 데이터 출처 (2026-10-07 스냅샷)

- crime-2024.csv: 경찰청 범죄 발생 지역별 통계 2024. https://www.data.go.kr/data/3074462/fileData.do
- population-2024.json: 사용자가 제공한 서울시 `주민등록 세대 및 인구 (성별_연도별_동별) 통계.csv`에서 2024년, 동명=계, 구명≠계인 25개 행의 인구수만 추출. https://data.seoul.go.kr/bsp/wgs/dataView/data300View/108.do . 분모 범위는 이 제공 파일의 총인구이며, 동료 사이트의 행안부 주민등록인구와 동일하지 않습니다.
- rent-summary-2024.json: 동료 Soeun1223의 공개 집계 파일 https://soeun1223.github.io/seoul-crime-map/data/seoul-rent-2024.json . 원본: 서울시 부동산 전월세가 정보 OA-21276. 2024년 계약 중 월세>0, ‘10평 이하’=0<임대면적≤33.06㎡. 집계 코드는 동료 저장소 scripts/build_rent.py에서 확인. 원자료 전체를 재집계하거나 원자료와 전수 대조하지는 않았습니다.
- seoul-gu.geojson: 동료의 지도 데이터 https://soeun1223.github.io/seoul-crime-map/data/seoul-gu.geojson . 원 출처 southkorea/seoul-maps https://github.com/southkorea/seoul-maps . Contributor Lucy Park; Apache License 2.0 (LICENSE-map.txt). 해당 저장소는 통계청 2013 및 JUSO 2015 경계를 제공합니다. 이 스냅샷의 정확한 원본 버전은 미확인으로, 현재 지적 경계·주소 판정에 사용하지 않습니다. 도형은 변형 없이 저장하고 화면에서만 투영합니다.

동료 사이트의 HTML/CSS/JavaScript는 복사하지 않고, 사용자의 통합 요청에 따라 공개된 집계 데이터와 지도 경계를 출처와 함께 연결하여 새 UI를 구현했습니다. 원 데이터/지도에 소프트웨어 전체의 이용 조건을 임의로 부여하지 않습니다.
