"""Real Blender previs from decoded site geometry. No replacement props.
Run: blender -b -t 4 --python-exit-code 1 --python scripts/blender-spatial-previs.py -- INPUT OUTPUT SCENE
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

inp,out,name=sys.argv[sys.argv.index('--')+1:]
out=Path(out);out.mkdir(parents=True,exist_ok=True)
d=json.loads((Path(inp)/(name+'.json')).read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
def B(v): return Vector((v[0],-v[2],v[1]))
def color(v): return tuple(max(0,min(1,float(x))) for x in v)
def make_mat(m):
    mat=bpy.data.materials.new(m['name'] or 'asset material');mat.use_nodes=True
    c=color(m['color'])
    mat.diffuse_color=(*c,1)
    p=mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Metallic'].default_value=max(0,min(1,m['metalness']))
    p.inputs['Roughness'].default_value=max(.14,min(1,m['roughness']))
    p.inputs['Emission Color'].default_value=(*color(m['emissive']),1)
    p.inputs['Emission Strength'].default_value=min(3,m['emissiveIntensity'])
    return mat
cache={};allverts=[];allfaces=[];meshcount=0;skipped=0
for row in d['meshes']:
    verts=[B(row['positions'][j:j+3]) for j in range(0,len(row['positions']),3)]
    idx=row['indices'];faces=[];mi=[]
    for g in row['groups']:
        m=row['materials'][g['materialIndex']]
        if m['transmission']>.2 or m['opacity']<.4:
            skipped+=1;continue
        end=min(len(idx),g['start']+g['count'])
        for j in range(g['start'],end-2,3):
            tri=tuple(idx[j:j+3])
            if len(set(tri))==3:faces.append(tri);mi.append(g['materialIndex'])
    if not faces:continue
    mesh=bpy.data.meshes.new(row['name']);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(row['name'],mesh);scene.collection.objects.link(obj)
    for m in row['materials']:
        key=json.dumps(m,sort_keys=True)
        if key not in cache:cache[key]=make_mat(m)
        mesh.materials.append(cache[key])
    for poly,i in zip(mesh.polygons,mi):poly.material_index=i
    start=len(allverts);allverts.extend(verts);allfaces.extend(tuple(start+j for j in t) for t in faces);meshcount+=1
assert meshcount and allfaces
bvh=BVHTree.FromPolygons(allverts,allfaces,all_triangles=True)
C=B(d['camera']['position']);F=B(d['camera']['direction']).normalized();Z=Vector((0,0,1))
R=F.cross(Z).normalized();U=R.cross(F).normalized()
fov=math.radians(d['camera']['fov'])
camera=bpy.data.objects.new('PREVIS Camera',bpy.data.cameras.new('Vertical FoV matched to web'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=16/math.tan(fov/2);camera.data.clip_start=.075;camera.data.clip_end=65
def cam_at(pos,direction):
    camera.location=pos;camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update()
cam_at(C,F)
def nearest(u,v,filter=None):
    hits=[h for h in d['hits'] if filter is None or filter(h)]
    if not hits:return None
    return min(hits,key=lambda h:(h['uv'][0]-u)**2+(h['uv'][1]-v)**2)
def at(u,v,depth):
    return C+(F+R*((u*2-1)*math.tan(fov/2)*d['camera']['aspect'])+U*((1-v*2)*math.tan(fov/2)))*depth
def depth(p): return (p-C).dot(F)
def clear_move(pos):
    dv=pos-C
    if dv.length<1e-5:return pos
    hit=bvh.ray_cast(C,dv.normalized(),dv.length+.12)
    if hit[0] is not None and hit[3]<dv.length+.12:
        return C+dv.normalized()*max(0,hit[3]-.18)
    return pos
def light(n,pos,target,power,col,size):
    data=bpy.data.lights.new(n,'AREA');data.energy=power;data.color=col;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(n,data);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler()
world=bpy.data.worlds.new('Previs ambient');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.19,.22,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5
subject=nearest(.42,.51) if name=='office' else nearest(.5,.56) if name=='quantum' else nearest(.62,.50)
assert subject
pivot=B(subject['point']);dep=max(.5,depth(pivot))
light('soft camera fill',C+Z*.55,pivot,220 if name!='quantum' else 1800,(.8,.92,1),3 if name!='quantum' else 6)
light('side rim',C+R*1.0+Z*.3,pivot,100 if name!='quantum' else 550,(.36,.75,.66),2.0)
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=False
scene.render.resolution_x=640;scene.render.resolution_y=360;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.fps=24;scene.frame_start=1;scene.frame_end=72
scene.view_settings.view_transform='AgX'
textmat=bpy.data.materials.new('Previs typography');textmat.use_nodes=True
shader=textmat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.7,.95,.88,1);shader.inputs['Emission Color'].default_value=(.7,.95,.88,1);shader.inputs['Emission Strength'].default_value=1.0
textmat.diffuse_color=(.7,.95,.88,1)
def type_object(words,anchor,normal,width,surface=False):
    curve=bpy.data.curves.new(words,'FONT');curve.body=words;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=1;curve.extrude=.0005;curve.materials.append(textmat)
    o=bpy.data.objects.new(words,curve);scene.collection.objects.link(o);o.location=anchor
    normal=normal.normalized()
    if surface:
        # projected camera-right onto the actual support plane
        right=(R-normal*R.dot(normal)).normalized()
        up=normal.cross(right).normalized()
        if up.dot(F)<0:up=-up;right=-right
    else:
        right=Z.cross(normal).normalized();up=normal.cross(right).normalized()
    o.rotation_euler=Matrix((right,up,normal)).transposed().to_euler()
    bpy.context.view_layer.update()
    corners=[Vector(v) for v in o.bound_box];w=max(v.x for v in corners)-min(v.x for v in corners)
    o.scale=(width/max(w,.001),)*3;bpy.context.view_layer.update()
    return o
def box_metrics(o):
    # A bounding-box sampling proxy, not per-glyph readability.
    bb=[Vector(v) for v in o.bound_box];xs=[v.x for v in bb];ys=[v.y for v in bb]
    projected=[];visible=0;total=0
    for i in range(9):
        for j in range(5):
            q=o.matrix_world@Vector((min(xs)+(max(xs)-min(xs))*i/8,min(ys)+(max(ys)-min(ys))*j/4,0))
            ndc=world_to_camera_view(scene,camera,q);projected.append(ndc);total+=1
            if not (ndc.z>0 and .03<=ndc.x<=.97 and .04<=ndc.y<=.96):continue
            dv=q-camera.location;hit=bvh.ray_cast(camera.location,dv.normalized(),max(.001,dv.length-.015))
            if hit[0] is None:visible+=1
    facing=max(0,(camera.location-o.location).normalized().dot(o.matrix_world.to_3x3()@Vector((0,0,1)).normalized())/o.scale.x)
    return {'inFrameFraction':sum(v.z>0 and 0<=v.x<=1 and 0<=v.y<=1 for v in projected)/total,'visibleBoxFraction':visible/total,'facingCosine':facing,'screenBox':[min(v.x for v in projected),min(v.y for v in projected),max(v.x for v in projected),max(v.y for v in projected)]}
def vertical(u,v,dd):
    a=at(u,v,dd);return a,Vector((C.x-a.x,C.y-a.y,0)).normalized()
options=[]
if name=='office':
    # Anchor behind the actual chair hit, not to the camera. Orbit reveals around foreground.
    a=pivot+F*.45+R*.18
    options.append(('chair-reveal','AUTONOMY',a,Vector((C.x-a.x,C.y-a.y,0)).normalized(),min(1.3,dep*.56),False,[-10,0,12],subject))
    surface=nearest(.62,.73,lambda h:h['normal'][1]>.65 and .55<h['point'][1]<1.75)
    if surface:
        n=B(surface['normal']).normalized();a=B(surface['point'])+n*.022
        options.append(('desk-surface','EXPLICIT CONTROL',a,n,min(.85,dep*.42),True,[-8,0,8],surface))
    else:
        a,n=vertical(.64,.51,dep+.25)
        options.append(('console-plane','EXPLICIT CONTROL',a,n,min(1.1,dep*.5),False,[-8,0,8],{'note':'No measured upward desk surface at target height; testing vertical plane instead'}))
elif name=='quantum':
    a,n=vertical(.5,.72,dep+.7)
    options.append(('reactor-axis','BEYOND CLASSICAL',a,n,min(5.0,dep*.75),False,[-7,0,7],subject))
    a,n=vertical(.27,.61,dep*.80)
    options.append(('reactor-side','BEYOND CLASSICAL',a,n,min(3.4,dep*.46),False,[-9,0,9],subject))
else:
    a,n=vertical(.63,.56,dep+.12)
    # True wall/rack normal from ray hit; compare to fixed frontal plane.
    normal=B(subject['normal']);normal.z=0
    if normal.length>.1:
        normal.normalize()
        if normal.dot(C-pivot)<0:normal=-normal
        a=pivot+normal*.045
    else:normal=n
    options.append(('rack-perspective','VALUE IN MOTION',a,normal,min(1.6,dep*.85),False,[-8,0,10],subject))
    a,n=vertical(.34,.52,dep*.82)
    options.append(('aisle-plane','VALUE IN MOTION',a,n,min(1.25,dep*.65),False,[-8,0,8],subject))
report={'scene':name,'meshCount':meshcount,'triangles':len(allfaces),'omittedGlassGroups':skipped,'materialMode':'simplified untextured materials, original decoded opaque geometry, local preview lighting','options':[]}
for tag,words,a,n,w,surface,angles,source in options:
    o=type_object(words,a,n,w,surface)
    camera.animation_data_clear()
    entry={'name':tag,'anchorThreeOrBlender':'Blender world coordinates','anchor':list(a),'sourceHit':source,'frames':[]}
    for angle,frame in zip(angles,[1,36,72]):
        rot=Matrix.Rotation(math.radians(angle),3,'Z');pos=clear_move(pivot+rot@(C-pivot));direction=rot@F
        if (pos-(pivot+rot@(C-pivot))).length>.001:direction=F
        cam_at(pos,direction);camera.keyframe_insert('location',frame=frame);camera.keyframe_insert('rotation_euler',frame=frame)
    # Native Blender camera keyframes with Bezier interpolation, text remains world-anchored.
    for frame in [1,36,72]:
        scene.frame_set(frame);bpy.context.view_layer.update();metrics=box_metrics(o)
        scene.render.filepath=str(out/(tag+'-'+str(frame).zfill(2)+'.png'))
        bpy.ops.render.render(write_still=True)
        entry['frames'].append({'frame':frame,'camera':list(camera.location),**metrics})
    scene.frame_set(36)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/(tag+'.blend')),compress=True)
    report['options'].append(entry)
    bpy.data.objects.remove(o,do_unlink=True)
(out/'report.json').write_text(json.dumps(report,indent=2))
print('PREVIS COMPLETE',name,meshcount,len(allfaces),len(report['options']))
