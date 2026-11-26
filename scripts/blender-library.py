"""Rebuild an editable model library from the same versioned blueprints as Three.js."""
import bpy, json, sys, os
from mathutils import Vector
source,out=sys.argv[sys.argv.index('--')+1:][:2]
os.makedirs(out,exist_ok=True)
data=json.load(open(source))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def rgb(v):
    return tuple(((v>>shift)&255)/255 for shift in (16,8,0))
mats={}
for name,p in data['palette'].items():
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*rgb(p['color']),1)
    bs.inputs['Metallic'].default_value=p['metalness'];bs.inputs['Roughness'].default_value=p['roughness']
    if 'emissive' in p:
        socket=bs.inputs.get('Emission Color') or bs.inputs.get('Emission')
        socket.default_value=(*rgb(p['emissive']),1)
        bs.inputs['Emission Strength'].default_value=p.get('emissiveIntensity',1)
    mats[name]=m
def xyz(v):return (v[0],-v[2],v[1])
# Cache one unit mesh per shape, then share material-specific meshes across collections.
prototypes={}
def prototype(shape):
    if shape in prototypes:return prototypes[shape]
    if shape=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.5)
    elif shape in ('cylinder','hex'):bpy.ops.mesh.primitive_cylinder_add(vertices=6 if shape=='hex' else 20,radius=.5,depth=1)
    elif shape=='torus':bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=6,major_radius=.43,minor_radius=.07)
    else:bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object
    if shape in ('box','chamfer'):
        mod=o.modifiers.new('Machined edge','BEVEL');mod.width=.1 if shape=='chamfer' else .045;mod.segments=2 if shape=='chamfer' else 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    mesh=o.data.copy();bpy.data.objects.remove(o,do_unlink=True);prototypes[shape]=mesh
    return mesh
cache={}
def make(part,col):
    shape=part['shape'];size=part['size'];kind=part['kind'];key=(shape,kind)
    if key not in cache:
        mesh=prototype(shape).copy();mesh.materials.append(mats[kind]);cache[key]=mesh
    o=bpy.data.objects.new(shape+'_'+kind,cache[key]);col.objects.link(o)
    o.location=xyz(part['position']);o.scale=(size[0],size[2],size[1]/.14 if shape=='torus' else size[1]);o['layer']=part.get('part',0)
    return o
def collection(name,parts,offset=(0,0,0)):
    col=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(col)
    objs=[make(p,col) for p in parts]
    for o in objs:o.location+=Vector(offset)
    return objs
# Hero exports at origin with editable components.
for name,parts in data['heroes'].items():
    objs=collection('HERO_'+name,parts)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out,name+'.glb'),export_format='GLB',use_selection=True,export_apply=True)
    for o in objs:o.hide_set(True);o.hide_render=True
for i,entry in enumerate(data['entries']):
    collection(entry['id'],entry['parts'],((i%8)*9,(i//8)*9,0))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'zolvency-industrial-library.blend'))
print('BLENDER_LIBRARY_READY',len(data['entries']),len(data['heroes']))
