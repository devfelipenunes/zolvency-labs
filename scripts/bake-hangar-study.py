"""Experimental lightmap only: source geometry, neutral material, no production integration."""
import bpy, json, sys, os, math
from mathutils import Vector
src,out=sys.argv[sys.argv.index('--')+1:][:2]
os.makedirs(out,exist_ok=True)
data=json.load(open(src))
assert data['file']=='hangar.glb' and len(data['sha256'])==64
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
vertices=[];faces=[];source_ranges=[]
for row in data['meshes']:
    pos=row['positions'];idx=row['indices'];base=len(vertices);face_base=len(faces)
    assert len(pos)%3==0 and len(idx)%3==0
    vertices.extend((pos[i],-pos[i+2],pos[i+1]) for i in range(0,len(pos),3))
    for i in range(0,len(idx),3):
        tri=idx[i:i+3]
        assert min(tri)>=0 and max(tri)<len(pos)//3
        if len(set(tri))!=3: continue
        a,b,c=(Vector(vertices[base+j]) for j in tri)
        if (b-a).cross(c-a).length_squared<1e-14: continue
        faces.append(tuple(base+j for j in tri))
    source_ranges.append({'node':row['node'],'material':row['material'],'vertexStart':base,'vertexCount':len(pos)//3,'faceStart':face_base,'faceCount':len(faces)-face_base})
assert faces and len(faces)<200000
mesh=bpy.data.meshes.new('source-hangar-static-shell')
mesh.from_pydata(vertices,[],faces);mesh.update()
assert len(mesh.polygons)==len(faces)
obj=bpy.data.objects.new('hangar-shell',mesh);bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
mesh.uv_layers.new(name='LightmapUV')
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.015)
bpy.ops.object.mode_set(mode='OBJECT')
uv=mesh.uv_layers.active
assert uv and len(uv.data)==len(mesh.loops)
mapping=[]
for poly in mesh.polygons:
    corners=[{'vertex':mesh.loops[i].vertex_index,'uv':list(uv.data[i].uv)} for i in poly.loop_indices]
    assert all(-.0001<=v<=1.0001 for c in corners for v in c['uv'])
    mapping.append(corners)
# Neutral diffuse receiver to measure light transport, not the source PBR material.
material=bpy.data.materials.new('neutral-diffuse-bake');material.use_nodes=True
nodes=material.node_tree.nodes;shader=nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.65,.65,.65,1);shader.inputs['Roughness'].default_value=.85
image=bpy.data.images.new('hangar-lightmap',width=512,height=512,alpha=False,float_buffer=True)
image.colorspace_settings.name='Non-Color'
tex=nodes.new('ShaderNodeTexImage');tex.image=image;nodes.active=tex;obj.data.materials.append(material)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.max_bounces=4
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.45,.55,.65,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.22
def area(name,pos,aim,power,color,size):
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.color=color;light.shape='DISK';light.size=size
    o=bpy.data.objects.new(name,light);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler()
area('overhead',(0,-1,7.1),(0,-1,0),1800,(.78,.88,1),5)
area('rim',(-7,9,6),(0,5,2),900,(1,.82,.62),4)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
scene.render.bake.margin=8
bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'},margin=8)
pixels=list(image.pixels);rgb=[pixels[i+j] for i in range(0,len(pixels),4) for j in range(3)]
assert rgb and all(math.isfinite(v) for v in rgb) and max(rgb)>0
image.filepath_raw=os.path.abspath(os.path.join(out,'hangar-lightmap.exr'));image.file_format='OPEN_EXR';image.save()
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
image.save_render(os.path.abspath(os.path.join(out,'hangar-lightmap.png')),scene=scene)
report={'source':data['file'],'sha256':data['sha256'],'vertices':len(vertices),'triangles':len(faces),'sourceRanges':source_ranges,'resolution':512,'samples':16,'rgbMin':min(rgb),'rgbMax':max(rgb),'rgbMean':sum(rgb)/len(rgb),'uvLayer':'LightmapUV','warning':'Neutral diffuse offline proof. Smart projection alone does not establish overlap/padding or runtime integration. No production material maps modified.'}
json.dump(report,open(os.path.join(out,'report.json'),'w'),indent=2)
json.dump({'sourceRanges':source_ranges,'faces':mapping},open(os.path.join(out,'uv-mapping.json'),'w'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(out,'hangar-bake-study.blend')))
print('BAKE_STUDY',json.dumps(report))
