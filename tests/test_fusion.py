import unittest
from fusion import fusion_data

class FusionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.data=fusion_data()
    def test_all_districts_joined(self):
        self.assertEqual(len(self.data['districts']),25)
        self.assertEqual(len(self.data['geo']['features']),25)
    def test_no_population_double_count(self):
        self.assertEqual(self.data['districts']['동대문구']['population'],358603)
        self.assertEqual(self.data['districts']['성북구']['population'],435037)
        self.assertEqual(self.data['districts']['중랑구']['population'],385349)
    def test_sexual_categories_not_all_violent_crime(self):
        self.assertEqual(self.data['districts']['동대문구']['sexual'],125)
        self.assertEqual(self.data['districts']['성북구']['sexual'],146)
        self.assertEqual(self.data['districts']['중랑구']['sexual'],142)
    def test_drugs_and_rate(self):
        d=self.data['districts']['동대문구']
        self.assertEqual(d['drug'],91)
        self.assertAlmostEqual(d['drug']/d['population']*100000,25.376,places=2)
    def test_rent_snapshot_and_period(self):
        self.assertEqual(self.data['rent']['version'],2)
        self.assertIn('33.06',self.data['rent']['note'])
        r=self.data['rent']['districts']['동대문구']['10평 이하']['오피스텔']
        self.assertEqual((r['avg'],r['median'],r['n']),(63.2,65.0,2336))
