"""Pinned OFL font conversion to Three.js FontLoader format, endpoint-first quadratic/cubic commands."""
import hashlib,json,urllib.request,urllib.parse
from io import BytesIO
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen
REV='5026800714d07231937d92eb4cceabf06e05d74e'
ROOT='https://raw.githubusercontent.com/google/fonts/'+REV+'/ofl/spacegrotesk/'
def fetch(path):return urllib.request.urlopen(ROOT+urllib.parse.quote(path,safe='/'),timeout=60).read()
raw=fetch('SpaceGrotesk[wght].ttf');license=fetch('OFL.txt');assert b'SIL OPEN FONT LICENSE' in license
out=Path('artifacts/r67-font');out.mkdir(parents=True,exist_ok=True);(out/'OFL.txt').write_bytes(license)
class Pen(BasePen):
 def __init__(self,gs):super().__init__(gs);self.ops=[]
 def p(self,*pts):return ' '.join(str(round(v,3)) for pt in pts for v in pt)
 def _moveTo(self,p):self.ops.append('m '+self.p(p))
 def _lineTo(self,p):self.ops.append('l '+self.p(p))
 def _qCurveToOne(self,p1,p2):self.ops.append('q '+self.p(p2,p1))
 def _curveToOne(self,p1,p2,p3):self.ops.append('b '+self.p(p3,p1,p2))
 def _closePath(self):pass
 def _endPath(self):pass
for weight in [400,600]:
 f=instantiateVariableFont(TTFont(BytesIO(raw)),{'wght':weight},inplace=True);gs=f.getGlyphSet();cmap=f.getBestCmap();h=f['head'];glyphs={}
 for code in range(32,127):
  name=cmap[code];pen=Pen(gs);gs[name].draw(pen);advance,_=f['hmtx'][name];g=f['glyf'][name];g.recalcBounds(f['glyf'])
  glyphs[chr(code)]={'ha':advance,'x_min':getattr(g,'xMin',0),'x_max':getattr(g,'xMax',0),'o':' '.join(pen.ops)}
 pairs={};names={c:cmap[ord(c)] for c in glyphs}
 if 'GPOS' in f:
  table=f['GPOS'].table;indices={i for rec in table.FeatureList.FeatureRecord if rec.FeatureTag=='kern' for i in rec.Feature.LookupListIndex}
  for i in sorted(indices):
   lk=table.LookupList.Lookup[i]
   for sub in lk.SubTable:
    if lk.LookupType==9:
     if sub.ExtensionLookupType!=2:continue
     sub=sub.ExtSubTable
    elif lk.LookupType!=2:continue
    cov=sub.Coverage.glyphs
    for a,ga in names.items():
     if ga not in cov:continue
     for b,gb in names.items():
      val=None
      if sub.Format==1:
       rec=next((r for r in sub.PairSet[cov.index(ga)].PairValueRecord if r.SecondGlyph==gb),None);val=rec.Value1 if rec else None
      elif sub.Format==2:val=sub.Class1Record[sub.ClassDef1.classDefs.get(ga,0)].Class2Record[sub.ClassDef2.classDefs.get(gb,0)].Value1
      delta=getattr(val,'XAdvance',0) or 0
      if delta:pairs[a+b]=pairs.get(a+b,0)+delta
 elif 'kern' in f:
  for sub in f['kern'].kernTables:
   for a,ga in names.items():
    for b,gb in names.items():
     if (ga,gb) in sub.kernTable:pairs[a+b]=sub.kernTable[ga,gb]
 d={'familyName':'Space Grotesk','resolution':h.unitsPerEm,'boundingBox':{'xMin':h.xMin,'xMax':h.xMax,'yMin':h.yMin,'yMax':h.yMax},'underlinePosition':f['post'].underlinePosition,'underlineThickness':f['post'].underlineThickness,'glyphs':glyphs,'kerning':pairs,'weight':weight,'sourceRevision':REV,'sourceSha256':hashlib.sha256(raw).hexdigest()}
 (out/('space-grotesk-'+str(weight)+'.typeface.json')).write_text(json.dumps(d,separators=(',',':')))
 print(weight,len(glyphs),len(pairs),h.unitsPerEm)
