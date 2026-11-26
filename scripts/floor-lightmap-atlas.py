"""Isolated floor receiver atlas. Disjoint padded rectangles give a geometric
non-overlap guarantee for each projected triangle, independent of raster samples.
Per-face charts are a conservative proof, not a final seam-optimized unwrap."""
import math

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def length(a):return math.sqrt(dot(a,a))

def select_floor(data):
    rows=[]
    for row in data['meshes']:
        if any(term in row['node'].lower() for term in ('crane','trolley','hoist','door','fan')):continue
        pos=row['positions'];idx=row['indices']
        for i in range(0,len(idx),3):
            ids=idx[i:i+3];p=[tuple(pos[j*3:j*3+3]) for j in ids]
            n=cross(sub(p[1],p[0]),sub(p[2],p[0]));area=length(n)
            if area<=1e-8 or n[1]/area<.85 or max(abs(v[1]) for v in p)>.16:continue
            # Choose longest edge as chart x-axis; preserve triangle shape.
            j,k=max(((0,1),(1,2),(2,0)),key=lambda pair:length(sub(p[pair[1]],p[pair[0]])))
            x=sub(p[k],p[j]);x=tuple(v/length(x) for v in x)
            y=cross(tuple(v/area for v in n),x)
            xy=[(dot(sub(v,p[j]),x),dot(sub(v,p[j]),y)) for v in p]
            lo=[min(v[d] for v in xy) for d in (0,1)]
            xy=[(v[0]-lo[0],v[1]-lo[1]) for v in xy]
            w,h=[max(v[d] for v in xy) for d in (0,1)]
            rows.append({'node':row['node'],'material':row['material'],'triangle':i//3,'sourceVertices':ids,'positions':p,'xy':xy,'width':w,'height':h,'area':area/2})
    return rows

def pack(rows,size=2048,pad=10,min_altitude=5):
    if not rows or size<=2*pad:raise ValueError('invalid atlas inputs')
    def try_scale(scale):
        charts=[]
        for i,r in enumerate(rows):
            # Minimum chart altitude protects tiny faces from zero sample coverage.
            s=max(scale,min_altitude/min(r['width'],r['height']))
            w=math.ceil(r['width']*s)+2*pad+2;h=math.ceil(r['height']*s)+2*pad+2
            charts.append((i,s,w,h))
        charts.sort(key=lambda x:(-x[3],-x[2],x[0]))
        x=y=height=0;out={}
        for i,s,w,h in charts:
            if w>size or h>size:return None
            if x+w>size:y+=height;x=0;height=0
            if y+h>size:return None
            out[i]=(x,y,w,h,s);x+=w;height=max(height,h)
        return out
    lo,hi=0,1
    if try_scale(lo) is None:raise ValueError('minimum chart size does not fit')
    while try_scale(hi) is not None:hi*=2
    for _ in range(28):
        mid=(lo+hi)/2
        if try_scale(mid) is None:hi=mid
        else:lo=mid
    packed=try_scale(lo);faces=[];source=[];rects=[]
    for i,r in enumerate(rows):
        x,y,w,h,s=packed[i]
        uv=[((x+pad+1+u*s)/size,(y+pad+1+v*s)/size) for u,v in r['xy']]
        assert all((x+pad)/size<=u<=(x+w-pad)/size and (y+pad)/size<=v<=(y+h-pad)/size for u,v in uv)
        rects.append([x,y,w,h])
        proxy=[3*i+j for j in range(3)]
        faces.append([{'vertex':proxy[j],'uv':list(uv[j])} for j in range(3)])
        source.append({k:r[k] for k in ('node','material','triangle','sourceVertices')}|{'proxyVertices':proxy})
    for i,(x,y,w,h) in enumerate(rects):
        for xx,yy,ww,hh in rects[:i]:
            assert x+w<=xx or xx+ww<=x or y+h<=yy or yy+hh<=y,'atlas rectangle intersection'
    return {'resolution':size,'paddingTexels':pad,'minimumChartAltitudeTexels':min_altitude,'scaleTexelsPerMeter':lo,'faces':faces,'sourceFaces':source,'rectangles':rects,'sourceArea':sum(r['area'] for r in rows),'chartCount':len(rows),'geometricGuarantee':'Disjoint axis-aligned chart rectangles with inset triangles. No overlap or inter-chart padding breach at base resolution; mipmaps require separate policy.'}
