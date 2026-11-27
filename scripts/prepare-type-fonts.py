"""Fetch OFL fonts at one recorded Google Fonts repository commit; instantiate static 600/400 weights for Blender. Do not redistribute font files as user artifacts."""
import hashlib,json,subprocess,urllib.request,urllib.parse
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
out=Path('artifacts/type-fonts');out.mkdir(parents=True,exist_ok=True)
revision=subprocess.check_output(['git','ls-remote','https://github.com/google/fonts.git','HEAD'],text=True).split()[0]
rows=[]
for name,rel in [('SpaceGrotesk','ofl/spacegrotesk/SpaceGrotesk[wght].ttf'),('Manrope','ofl/manrope/Manrope[wght].ttf'),('Inter','ofl/inter/Inter[opsz,wght].ttf')]:
    url='https://raw.githubusercontent.com/google/fonts/'+revision+'/'+urllib.parse.quote(rel,safe='/')
    raw=out/(name+'-variable.ttf');raw.write_bytes(urllib.request.urlopen(url,timeout=60).read())
    license_url='https://raw.githubusercontent.com/google/fonts/'+revision+'/'+rel.rsplit('/',1)[0]+'/OFL.txt'
    license_text=urllib.request.urlopen(license_url,timeout=60).read()
    assert b'SIL OPEN FONT LICENSE' in license_text
    for weight in [400,600]:
        font=TTFont(raw);axes={a.axisTag:(weight if a.axisTag=='wght' else a.defaultValue) for a in font['fvar'].axes};static=instantiateVariableFont(font,axes,inplace=True);path=out/(name+'-'+str(weight)+'.ttf');static.save(path);rows.append({'name':name,'weight':weight,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':url,'license':license_url})
(out/'manifest.json').write_text(json.dumps({'revision':revision,'fonts':rows},indent=2))
