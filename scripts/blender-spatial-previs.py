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
    for g in ([{'start':0,'count':len(idx),'materialIndex':0}] if len(row['materials'])==1 else row['groups']):
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
    facing=max(0,(camera.location-o.location).normalized().dot((o.matrix_world.to_3x3()@Vector((0,0,1))).normalized()))
    return {'inFrameFraction':sum(v.z>0 and 0<=v.x<=1 and 0<=v.y<=1 for v in projected)/total,'visibleBoxFraction':visible/total,'facingCosine':facing,'screenBox':[min(v.x for v in projected),min(v.y for v in projected),max(v.x for v in projected),max(v.y for v in projected)]}
def vertical(u,v,dd):
    a=at(u,v,dd);return a,Vector((C.x-a.x,C.y-a.y,0)).normalized()
# R38: composed camera tracks, not a small orbit compensating its own movement.
# Input coordinates are Three.js world units; the fixed text planes are never camera-parented.
tracks={
 'office':[
  ([-5.5,1.65,-13.96],[-5.5,1.55,-13.00],66),
  ([-6.38,1.78,-13.7],[-5.45,1.45,-12.1],60),
  ([-6.68,2.05,-12.65],[-5.1,1.3,-11.0],55),
  ([-6.05,2.15,-11.75],[-4.8,1.1,-10.9],54)],
 'quantum':[
  ([34.9,6.7,5.4],[30,8.8,0],65.8),
  ([33.8,6.1,4.5],[30,8.2,0],62),
  ([31.9,5.5,4.2],[30,7.8,0],61),
  ([30,4.8,4.8],[30,7.65,0],65)],
 'stellar':[
  ([7.14,1.85,4.66],[2.8,1.55,4.66],65),
  ([6.15,1.65,4.66],[3.7,1.5,4.55],60),
  ([4.85,1.55,4.66],[3.5,1.55,3.95],55),
  ([3.7,1.75,4.66],[3.2,1.55,3.93],54)]
}
track=[(B(pos),B(target),lens) for pos,target,lens in tracks[name]]
def anchored(words,xyz,normal,width,surface=False,source=None):
    return (words,B(xyz),B(normal),width,surface,source or {'note':'Authored fixed world plane within measured room geometry'})
options=[]
if name=='office':
    # Start close behind the real chair at z=-13.3, travel around its left side, then face console.
    options.append(('chair-reveal',*anchored('AUTONOMY',[-5.38,1.55,-11.15],[-.45,0,-1],1.35)))
    surface=nearest(.62,.73,lambda h:h['normal'][1]>.65 and .55<h['point'][1]<1.75)
    if surface:
        n=B(surface['normal']).normalized();a=B(surface['point'])+n*.035
        options.append(('desk-surface','EXPLICIT CONTROL',a,n,1.0,True,surface))
    else:
        options.append(('console-plane',*anchored('EXPLICIT CONTROL',[-4.8,1.45,-10.65],[-.8,0,-1],1.0)))
elif name=='quantum':
    options.append(('reactor-axis',*anchored('BEYOND CLASSICAL',[30,5.0,1.40],[0,0,1],3.2)))
    options.append(('reactor-side',*anchored('BEYOND CLASSICAL',[27.0,6.1,1.35],[.35,0,1],2.8)))
else:
    options.append(('rack-perspective',*anchored('VALUE IN MOTION',[3.40,1.52,4.05],[0,0,1],.85)))
    options.append(('aisle-plane',*anchored('VALUE IN MOTION',[3.05,1.55,4.48],[1,0,.45],.70)))
# Use a smoothly interpolated camera track. Validate every frame with BVH; if the
# curve overshoots, try the measured piecewise-linear track with eased segments.
def catmull(a,b,c,e,t):
    return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-e)*t*t+(-a+3*b-3*c+e)*t*t*t)
def sample_track(u,smooth=True):
    z=min(3,max(0,u*3));i=min(2,int(z));t=z-i
    if smooth:
        vals=[catmull(track[max(0,i-1)][j],track[i][j],track[i+1][j],track[min(3,i+2)][j],t) for j in range(3)]
    else:
        h=t*t*(3-2*t);vals=[track[i][j]*(1-h)+track[i+1][j]*h for j in range(3)]
    return vals
def clearance(pos):
    hit=bvh.find_nearest(pos)
    return hit[3] if hit[0] is not None else 999
scene.frame_end=96
samples=[sample_track(i/95) for i in range(96)]
if min(clearance(p) for p,_,_ in samples)<.24:
    samples=[sample_track(i/95,False) for i in range(96)]
path_clearance=min(clearance(p) for p,_,_ in samples)
assert path_clearance>=.24,('Camera path too close to opaque geometry',name,path_clearance)
report={'scene':name,'meshCount':meshcount,'triangles':len(allfaces),'omittedGlassGroups':skipped,'materialMode':'simplified untextured materials, original decoded opaque geometry, local preview lighting','options':[]}
for option_index,(tag,words,a,n,w,surface,source) in enumerate(options):
    o=type_object(words,a,n,w,surface)
    camera.animation_data_clear()
    entry={'name':tag,'anchorThreeOrBlender':'Blender world coordinates','anchor':list(a),'sourceHit':source,'frames':[]}
    camera.data.animation_data_clear()
    camera.rotation_mode='QUATERNION'
    previous_quat=None
    for frame,(pos,target,lens) in enumerate(samples,1):
        q=(target-pos).to_track_quat('-Z','Y')
        if previous_quat is not None and q.dot(previous_quat)<0:q.negate()
        previous_quat=q.copy()
        camera.location=pos;camera.rotation_quaternion=q
        camera.data.lens=16/math.tan(math.radians(lens)/2)
        camera.keyframe_insert('location',frame=frame);camera.keyframe_insert('rotation_quaternion',frame=frame)
        camera.data.keyframe_insert('lens',frame=frame)
    for datablock in (camera,camera.data):
        for curve in datablock.animation_data.action.fcurves:
            for point in curve.keyframe_points:point.interpolation='LINEAR'
    entry['pathClearance']=path_clearance
    entry['cameraTravelMeters']=sum((samples[i][0]-samples[i-1][0]).length for i in range(1,len(samples)))
    entry['startEndMeters']=(samples[-1][0]-samples[0][0]).length
    entry['directionChangeDegrees']=math.degrees((samples[0][1]-samples[0][0]).angle(samples[-1][1]-samples[-1][0]))
    # Four independently composed shots, in sequence, with exact position/target/FOV.
    for frame in [1,33,64,96]:
        scene.frame_set(frame);bpy.context.view_layer.update();metrics=box_metrics(o)
        scene.render.filepath=str(out/(tag+'-'+str(frame).zfill(2)+'.png'))
        bpy.ops.render.render(write_still=True)
        entry['frames'].append({'frame':frame,'camera':list(camera.location),'fov':math.degrees(2*math.atan(16/camera.data.lens)),**metrics})
    # A lightweight actual animation sample, one per room, without screenshot compositing.
    if option_index==0:
        scene.render.resolution_x=384;scene.render.resolution_y=216;scene.cycles.samples=8
        for frame in range(1,97,4):
            scene.frame_set(frame);bpy.context.view_layer.update()
            scene.render.filepath=str(out/(tag+'-motion-'+str(frame).zfill(3)+'.png'))
            bpy.ops.render.render(write_still=True)
        scene.render.resolution_x=640;scene.render.resolution_y=360;scene.cycles.samples=24
    scene.frame_set(96)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/(tag+'.blend')),compress=True)
    report['options'].append(entry)
    bpy.data.objects.remove(o,do_unlink=True)
(out/'report.json').write_text(json.dumps(report,indent=2))
print('PREVIS COMPLETE',name,meshcount,len(allfaces),len(report['options']))
