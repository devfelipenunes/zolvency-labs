"""Raster estimates, not an exact continuous polygon intersection proof."""
import argparse,json,math
from array import array

def audit(faces,size,padding=8):
    parent=list(range(len(faces)))
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=parent[i]
        return i
    def union(a,b):
        a,b=root(a),root(b)
        if a!=b: parent[b]=a
    edges={};tris=[];degenerate=0;invalid=0
    for i,face in enumerate(faces):
        if len(face)!=3: raise ValueError('nontriangle UV mapping')
        uv=[tuple(c['uv']) for c in face]
        if any(not math.isfinite(v) or v<-.0001 or v>1.0001 for xy in uv for v in xy): invalid+=1;continue
        a,b,c=uv
        cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        if abs(cross)<1e-12: degenerate+=1;continue
        tris.append((i,uv))
        for j in range(3):
            k=(j+1)%3
            edge=tuple(sorted(( (face[j]['vertex'],*map(lambda x:round(x,7),uv[j])),(face[k]['vertex'],*map(lambda x:round(x,7),uv[k])) )))
            if edge in edges: union(i,edges[edge])
            else: edges[edge]=i
    owner=array('i',[-1])*(size*size);overlap=bytearray(size*size);sampled=0;subpixel=0
    for i,uv in tris:
        (ax,ay),(bx,by),(cx,cy)=[(u*size,v*size) for u,v in uv]
        den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        count=0;island=root(i)
        for y in range(max(0,math.floor(min(ay,by,cy))),min(size,math.ceil(max(ay,by,cy)))):
            for x in range(max(0,math.floor(min(ax,bx,cx))),min(size,math.ceil(max(ax,bx,cx)))):
                u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den
                v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den
                # Strict interior excludes shared triangle edges.
                if min(u,v,1-u-v)<=1e-8:continue
                k=y*size+x;count+=1
                if owner[k]!=-1: overlap[k]=1
                else: owner[k]=island;sampled+=1
        if not count:subpixel+=1
    islands=len(set(root(i) for i,_ in tris))
    # Find distinct islands within padding texels of occupied samples using
    # iterative 8-neighbour expansion. Counts are raster estimates.
    expanded=array('i',owner);front=[i for i,v in enumerate(owner) if v>=0];conflicts=set()
    # Boundary only; prevents repeatedly examining the interior of large islands.
    def neighbours(k):
        y,x=divmod(k,size)
        for yy in range(max(0,y-1),min(size,y+2)):
            for xx in range(max(0,x-1),min(size,x+2)):
                q=yy*size+xx
                if q!=k:yield q
    front=[k for k in front if any(owner[q]!=owner[k] for q in neighbours(k))]
    for _ in range(padding):
        nxt=[]
        for k in front:
            for q in neighbours(k):
                if expanded[q]==-1:expanded[q]=expanded[k];nxt.append(q)
                elif expanded[q]!=expanded[k]:conflicts.add(tuple(sorted((expanded[q],expanded[k]))))
        front=nxt
        if not front:break
    return {'resolution':size,'faces':len(faces),'validTriangles':len(tris),'islands':islands,'invalidTriangles':invalid,'degenerateUVTriangles':degenerate,'subpixelTriangles':subpixel,'occupiedTexels':sampled,'coverage':sampled/(size*size),'overlapTexels':sum(overlap),'overlapFractionOccupied':sum(overlap)/max(1,sampled),'paddingExpansionTexels':padding,'islandPairsWithinExpandedPadding':len(conflicts),'method':'Strict pixel-centre raster; Chebyshev dilation; estimates not exact intersection certification.'}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mapping');parser.add_argument('output');parser.add_argument('--sizes',nargs='+',type=int,default=[512,1024]);args=parser.parse_args()
    mapping=json.load(open(args.mapping))
    result=[audit(mapping['faces'],s) for s in args.sizes]
    with open(args.output,'w') as f:json.dump(result,f,indent=2)
    print(json.dumps(result))
