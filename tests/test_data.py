import unittest
from datetime import date
from unittest.mock import patch
import build

class DataTests(unittest.TestCase):
    def test_months_cross_year(self):
        self.assertEqual(build.months_before(date(2026, 2, 1)), ['202511','202512','202601'])
    def test_months_exclude_current(self):
        self.assertEqual(build.months_before(date(2026, 10, 7)), ['202607','202608','202609'])
    def test_auth_error_does_not_echo_response(self):
        with self.assertRaisesRegex(ValueError, '인증') as ctx:
            build.parse_page(b'<response><header><resultCode>30</resultCode><resultMsg>secret-test</resultMsg></header></response>', '동대문구')
        self.assertNotIn('secret-test', str(ctx.exception))
    def test_empty_is_zero(self):
        self.assertEqual(build.parse_page(b'<response><header><resultCode>000</resultCode></header><body><items/><totalCount>0</totalCount></body></response>', '동대문구'), ([],0))
    def test_rent_units_and_contract(self):
        xml='<response><header><resultCode>000</resultCode></header><body><items><item><deposit> 5,000 </deposit><monthlyRent>60</monthlyRent><excluUseAr>25.3</excluUseAr><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>3</dealDay><contractType>신규</contractType></item></items><totalCount>1</totalCount></body></response>'
        rows,total=build.parse_page(xml,'성북구')
        self.assertEqual(total,1)
        self.assertEqual((rows[0]['deposit'],rows[0]['rent'],rows[0]['area'],rows[0]['date']), (5000,60,25.3,'2026-07-03'))
    def test_crime_aggregation_matches_official_rows(self):
        data=build.crime_data()
        self.assertEqual(data['동대문구']['절도범죄'],1618)
        self.assertEqual(data['성북구']['절도범죄'],884)
        self.assertEqual(data['중랑구']['절도범죄'],1439)
        self.assertEqual(data['동대문구']['강력범죄'],2+5+4+25+9+90+1+8)
    def test_missing_key_fails(self):
        with patch.dict(build.os.environ,{},clear=True), self.assertRaisesRegex(ValueError,'Secret'):
            build.main()

if __name__=='__main__':
    unittest.main()
