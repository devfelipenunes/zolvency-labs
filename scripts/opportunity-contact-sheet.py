from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import json, textwrap
root=Path('artifacts/opportunity-audition')
rows=json.loads((root/'manifest.json').read_text())
w,h=360,360
sheet=Image.new('RGB',(w*3,h*((len(rows)+2)//3)), '#10191f')
draw=ImageDraw.Draw(sheet)
for i,r in enumerate(rows):
 x,y=(i%3)*w,(i//3)*h
 p=r['downloads'].get('preview',{}).get('file')
 if p:
  with Image.open(root/p) as src:
   im=ImageOps.contain(src.convert('RGB'),(w-24,220))
   sheet.paste(im,(x+(w-im.width)//2,y+8))
 else: draw.text((x+12,y+90),'Preview unavailable',fill='#bdc8c9')
 draw.text((x+12,y+238),r['id'],fill='white')
 draw.text((x+12,y+255),r['zone']+' | '+r['status'],fill='#9acfb9')
 lod=r['downloads'].get('lod1',{})
 draw.text((x+12,y+272),str(lod.get('triangles','?'))+' tris / '+str(lod.get('bytes','?'))+' bytes',fill='#a4b8bc')
 for j,line in enumerate(textwrap.wrap(r['placement'],width=49)[:3]):
  draw.text((x+12,y+292+j*15),line,fill='#c4d4d6')
sheet.save(root/'contact-sheet.png')
