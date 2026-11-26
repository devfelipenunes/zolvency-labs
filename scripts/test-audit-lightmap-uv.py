import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('audit',pathlib.Path(__file__).with_name('audit-lightmap-uv.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
def tri(ids,uv):return [{'vertex':i,'uv':p} for i,p in zip(ids,uv)]
class Tests(unittest.TestCase):
    def test_shared_edge(self):
        a=tri([0,1,2],[(.1,.1),(.8,.1),(.8,.8)])
        b=tri([0,2,3],[(.1,.1),(.8,.8),(.1,.8)])
        x=module.audit([a,b],32,2)
        self.assertEqual(x['islands'],1);self.assertEqual(x['overlapTexels'],0);self.assertGreater(x['occupiedTexels'],0)
    def test_overlap(self):
        a=tri([0,1,2],[(.1,.1),(.8,.1),(.8,.8)])
        b=tri([3,4,5],[(.1,.1),(.8,.1),(.8,.8)])
        x=module.audit([a,b],32,2)
        self.assertEqual(x['islands'],2);self.assertEqual(x['overlapFractionOccupied'],1)
    def test_padding(self):
        a=tri([0,1,2],[(.1,.1),(.35,.1),(.35,.35)])
        b=tri([3,4,5],[(.40,.1),(.65,.1),(.65,.35)])
        x=module.audit([a,b],32,2)
        self.assertEqual(x['overlapTexels'],0);self.assertEqual(x['islandPairsWithinExpandedPadding'],1)
    def test_invalid(self):
        x=module.audit([tri([0,1,2],[(0,0),(0,0),(0,0)]),tri([3,4,5],[(0,0),(2,0),(0,1)])],16)
        self.assertEqual(x['degenerateUVTriangles'],1);self.assertEqual(x['invalidTriangles'],1)
if __name__=='__main__':unittest.main()
