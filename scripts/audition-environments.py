"""Quarantine CC0 environment kits. Never deploy unreviewed meshes."""
import hashlib,io,json,pathlib,urllib.request,urllib.parse,zipfile
out=pathlib.Path("artifacts/environment-audition");out.mkdir(parents=True,exist_ok=True)
kits=[
("modular-space-kit",["https://kenney.nl/media/pages/assets/modular-space-kit/8261428a47-1771146076/kenney_modular-space-kit_1.0.zip","https://opengameart.org/sites/default/files/kenney_modular-space-kit_1.0.zip"],"https://kenney.nl/assets/modular-space-kit"),
("space-station-kit",["https://kenney.nl/media/pages/assets/space-station-kit/6475288f2e-1712749919/kenney_space-station-kit.zip","https://opengameart.org/sites/default/files/kenney_space-station-kit.zip"],"https://kenney.nl/assets/space-station-kit")]
report=[]
for name,urls,source in kits:
 failures=[]
 for url in urls:
  try:
   req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; ZolvencyLabsAssetAudition/1.0)","Accept":"application/zip, application/octet-stream, */*"})
   with urllib.request.urlopen(req,timeout=30) as response:
    parsed=urllib.parse.urlparse(response.geturl())
    if parsed.scheme!="https" or parsed.hostname not in ("kenney.nl","opengameart.org","www.opengameart.org"):raise ValueError("unexpected host")
    data=response.read(20_000_001)
   if len(data)>20_000_000:raise ValueError("zip exceeds budget")
   with zipfile.ZipFile(io.BytesIO(data)) as z:
    infos=z.infolist()
    if len(infos)>3000 or sum(i.file_size for i in infos)>150_000_000:raise ValueError("archive budget exceeded")
    for i in infos:
     p=pathlib.PurePosixPath(i.filename)
     if p.is_absolute() or ".." in p.parts:raise ValueError("unsafe archive path")
    licenses=[i for i in infos if "license" in i.filename.lower() and i.filename.lower().endswith(".txt")]
    license_text="\n".join(z.read(i).decode("utf-8",errors="replace") for i in licenses)
    if "cc0" not in license_text.lower() and "creative commons zero" not in license_text.lower():raise ValueError("CC0 not found in archive")
    models=[{"file":i.filename,"bytes":i.file_size} for i in infos if i.filename.lower().endswith((".glb",".gltf",".fbx",".obj"))]
    if not models:raise ValueError("no model files")
    report.append({"name":name,"source":source,"url":url,"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),"license":"CC0-1.0","models":models,"earlierFailures":failures})
    (out/(name+".zip")).write_bytes(data)
    break
  except Exception as e:failures.append({"url":url,"error":str(e)})
 else:report.append({"name":name,"source":source,"error":"no verified archive","attempts":failures})
(out/"manifest.json").write_text(json.dumps(report,indent=2))
print(json.dumps([{k:v for k,v in row.items() if k!="models"}|{"modelFiles":len(row.get("models",[]))} for row in report]))
if any("error" in row for row in report):raise SystemExit(1)
