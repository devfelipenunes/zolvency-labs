"""Offline proof only, no production material changes."""
import bpy,sys,os,json,math,importlib.util
import numpy as np
from mathutils import Vector
src,out=sys.argv[sys.argv.index('--')+1:][:2]
os.makedirs(out,exist_ok=True)
spec=importlib.util.spec_from_file_location('floor_atlas',os.path.join(os.path.dirname(__file__),'floor-lightmap-atlas.py'))
atlas=importlib.util.module_from_spec(spec);spec.loader.exec_module(atlas)
data=json.load(open(src));assert data['file']=='hangar.glb' and len(data['sha256'])==64
rows=atlas.select_floor(data);mapping=atlas.pack(rows,2048,10,5)
mapping['sourceSHA256']=data['sha256'];mapping['bakePass']='INDIRECT'
json.dump(mapping,open(os.path.join(out,'uv-mapping.json'),'w'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def coord(p):return (p[0],-p[2],p[1])
def mesh_obj(name,verts,faces):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);return obj
receiver=mesh_obj('exact-floor-receiver',[coord(p) for r in rows for p in r['positions']],[tuple(range(i*3,i*3+3)) for i in range(len(rows))])
uv=receiver.data.uv_layers.new(name='LightmapUV');uv.active_render=True
for poly in receiver.data.polygons:
    for j,k in enumerate(poly.loop_indices):
        c=mapping['faces'][poly.index][j];assert receiver.data.loops[k].vertex_index==c['vertex'];uv.data[k].uv=c['uv']
selected={(r['node'],r['material'],r['triangle']) for r in rows}
occ_verts=[];occ_faces=[];excluded=[]
for row in data['meshes']:
    if any(term in row['node'].lower() for term in ('crane','trolley','hoist','door','fan')):
        excluded.append(row['node']);continue
    pos=row['positions'];idx=row['indices'];base=len(occ_verts)
    occ_verts.extend(coord(pos[i:i+3]) for i in range(0,len(pos),3))
    for i in range(0,len(idx),3):
        if (row['node'],row['material'],i//3) in selected:continue
        tri=idx[i:i+3]
        if len(set(tri))<3:continue
        occ_faces.append(tuple(base+j for j in tri))
occluder=mesh_obj('static-shell-occluder',occ_verts,occ_faces)
def diffuse(name):
    m=bpy.data.materials.new(name);m.use_nodes=True
    nodes=m.node_tree.nodes;bs=nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(.65,.65,.65,1);bs.inputs['Roughness'].default_value=.85
    return m
occluder.data.materials.append(diffuse('neutral-shell'))
m=diffuse('neutral-floor');receiver.data.materials.append(m)
size=mapping['resolution'];image=bpy.data.images.new('floor-indirect',width=size,height=size,alpha=False,float_buffer=True)
image.colorspace_settings.name='Non-Color'
nodes=m.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=image;nodes.active=tex;tex.select=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.max_bounces=4;scene.cycles.use_denoising=False
if hasattr(scene.cycles,'use_preview_denoising'):scene.cycles.use_preview_denoising=False
if hasattr(scene.cycles,'use_adaptive_sampling'):scene.cycles.use_adaptive_sampling=False
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.45,.55,.65,1);bg.inputs['Strength'].default_value=.22
def area(name,pos,aim,power,color,size):
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.color=color;light.shape='DISK';light.size=size
    o=bpy.data.objects.new(name,light);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler()
area('overhead',(0,-1,7.1),(0,-1,0),1800,(.78,.88,1),5)
area('rim',(-7,9,6),(0,5,2),900,(1,.82,.62),4)
bpy.ops.object.select_all(action='DESELECT');receiver.select_set(True);bpy.context.view_layer.objects.active=receiver
scene.render.bake.margin=8
result=bpy.ops.object.bake(type='DIFFUSE',pass_filter={'INDIRECT'},margin=8,margin_type='EXTEND')
pixels=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(pixels)
rgb=pixels.reshape(-1,image.channels)[:,:3];finite=np.isfinite(rgb)
report={'operator':sorted(result),'sourceSHA256':data['sha256'],'resolution':size,'receiverTriangles':len(rows),'occluderTriangles':len(occ_faces),'excluded':excluded,'chartCount':mapping['chartCount'],'paddingTexels':mapping['paddingTexels'],'sourceArea':mapping['sourceArea'],'scaleTexelsPerMeter':mapping['scaleTexelsPerMeter'],'finiteValues':int(finite.sum()),'rgbValues':int(rgb.size),'positiveValues':int((rgb>0).sum()),'rgbMax':float(np.nanmax(rgb)),'rgbMean':float(np.nanmean(rgb)),'pass':'INDIRECT','warning':'Neutral diffuse indirect-light proof; not yet integrated or calibrated to production PBR.'}
json.dump(report,open(os.path.join(out,'report.json'),'w'),indent=2);print('FLOOR_BAKE',json.dumps(report),flush=True)
assert 'FINISHED' in result and finite.all() and report['positiveValues']>0
image.filepath_raw=os.path.abspath(os.path.join(out,'floor-indirect.exr'));image.file_format='OPEN_EXR';image.save()
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';image.save_render(os.path.abspath(os.path.join(out,'floor-indirect.png')),scene=scene)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(out,'floor-indirect.blend')))
