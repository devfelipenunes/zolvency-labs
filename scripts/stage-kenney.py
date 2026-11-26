"""Copy a small, pinned CC0 selection, not the entire low-poly kit."""
import io,hashlib,pathlib,urllib.request,zipfile
kits=[
 ('space-station-kit','https://opengameart.org/sites/default/files/kenney_space-station-kit.zip','215e79bd5415cff93665183390f0343ed9acf87780306331013b78520170c6d8',['balcony-floor','balcony-rail','wall-detail','floor-panel','structure-panel']),
 ('modular-space-kit','https://opengameart.org/sites/default/files/kenney_modular-space-kit_1.0.zip','f394f7fd9eaf29c9de7e090e55b69926f699841af33b0b116f5cc0088de8a4dc',['gate','cables','stairs-wide'])]
for name,url,digest,parts in kits:
 req=urllib.request.Request(url,headers={'User-Agent':'ZolvencyLabsAssetAudition/1.0'})
 with urllib.request.urlopen(req,timeout=30) as response:
  if not response.geturl().startswith('https://opengameart.org/'):raise ValueError('unexpected host')
  data=response.read(10_000_001)
 if hashlib.sha256(data).hexdigest()!=digest:raise ValueError('archive hash mismatch '+name)
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  dest=pathlib.Path('public/models/composition/kenney')/name
  (dest/'Textures').mkdir(parents=True,exist_ok=True)
  prefix='Models/GLB format/'
  for part in parts:(dest/(part+'.glb')).write_bytes(z.read(prefix+part+'.glb'))
  (dest/'Textures/colormap.png').write_bytes(z.read(prefix+'Textures/colormap.png'))
 print(name, len(parts),'reviewed models staged')
