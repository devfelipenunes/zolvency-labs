import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('atlas',pathlib.Path(__file__).with_name('floor-lightmap-atlas.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class Tests(unittest.TestCase):
    def test_floor_selection(self):
        row={'node':'shell','material':'atlas','positions':[0,0,0,0,0,1,1,0,0,0,1,0,0,1,1,1,1,0],'indices':[0,1,2,3,4,5,2,1,0]}
        rows=a.select_floor({'meshes':[row,dict(row,node='crane_trolley')]})
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['triangle'],0);self.assertEqual(rows[0]['sourceVertices'],[0,1,2]);self.assertAlmostEqual(rows[0]['area'],.5)
        m=a.pack(rows,128,10,5)
        self.assertEqual(m,a.pack(rows,128,10,5));self.assertEqual(m['chartCount'],1)
    def test_disjoint_rectangles_and_gutter(self):
        rows=[{'node':'shell','material':'atlas','triangle':i,'sourceVertices':[0,1,2],'xy':[(0,0),(1,0),(.25,.2)],'width':1,'height':.2,'area':.1} for i in range(18)]
        m=a.pack(rows,512,10,5)
        for i,(x,y,w,h) in enumerate(m['rectangles']):
            for j,(xx,yy,ww,hh) in enumerate(m['rectangles'][:i]):
                self.assertTrue(x+w<=xx or xx+ww<=x or y+h<=yy or yy+hh<=y)
            for c in m['faces'][i]:
                u,v=c['uv'];self.assertTrue(x+10<=u*512<=x+w-10);self.assertTrue(y+10<=v*512<=y+h-10)
    def test_insufficient_atlas(self):
        with self.assertRaises(ValueError):a.pack([{'width':1,'height':1}],16,10,5)
if __name__=='__main__':unittest.main()
