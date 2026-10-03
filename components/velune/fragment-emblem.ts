import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const clamp=(t:number)=>Math.min(1,Math.max(0,t));
const ease=(t:number)=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
export function emblemPhase(scroll:number,reduced=false){
  const assembly=reduced?1:ease((scroll-.52)/.48);
  const breakup=reduced?0:ease((scroll-1.20)/.40);
  const opacity=ease((scroll-.49)/.12)*(1-ease((scroll-1.36)/.32));
  return {assembly,breakup,opacity};
}
type Shard={mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshPhysicalMaterial>;center:THREE.Vector3;direction:THREE.Vector3;spin:THREE.Vector3;seed:number;mvp:THREE.Matrix4;normal:THREE.Matrix3};
type Face={part:Shard;offset:number;normal:THREE.Vector3;xy:Float32Array;depth:number;color:number};

/** The same fractured model and choreography drive WebGL and the canvas renderer. */
export class FragmentEmblem {
  readonly root=new THREE.Group();
  private shards:Shard[]=[];private faces:Face[]=[];
  private disposed=false;private opacity=0;private idleAngle=0;private previousTime:number|undefined;
  private projection=new THREE.Matrix4();
  private a=new THREE.Vector3();private b=new THREE.Vector3();private c=new THREE.Vector3();private normal=new THREE.Vector3();
  private light=new THREE.Vector3(.35,.7,1).normalize();
  private palette=Array.from({length:96},(_,i)=>{const t=i/95;return `rgb(${Math.round(70+t*150)},${Math.round(43+t*148)},${Math.round(108+t*135)})`});
  constructor(private scene:THREE.Scene,private camera:THREE.PerspectiveCamera){
    scene.add(this.root);
    new GLTFLoader().load('/assets/velune-folded-fragments.glb',gltf=>{
      if(this.disposed){this.releaseSource(gltf.scene);return;}
      this.partition(gltf.scene);this.releaseSource(gltf.scene);
    });
  }
  private releaseSource(root:THREE.Object3D){root.traverse((o:any)=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}})}
  private partition(source:THREE.Object3D){
    source.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(source),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const unit=1/Math.max(size.x,size.y,size.z),triangles:number[][]=[];
    source.traverse((object:any)=>{
      if(!object.isMesh)return;
      const geometry=object.geometry as THREE.BufferGeometry,position=geometry.attributes.position,index=geometry.index;
      const count=index?index.count:position.count;
      for(let i=0;i<count;i+=3){
        const triangle:number[]=[];
        for(let j=0;j<3;j++){
          this.a.fromBufferAttribute(position,index?index.getX(i+j):i+j).applyMatrix4(object.matrixWorld).sub(center).multiplyScalar(unit);
          triangle.push(this.a.x,this.a.y,this.a.z);
        }triangles.push(triangle);
      }
    });
    if(!triangles.length)return;
    const centers=triangles.map(t=>new THREE.Vector3((t[0]+t[3]+t[6])/3,(t[1]+t[4]+t[7])/3,(t[2]+t[5]+t[8])/3));
    const seeds=Array.from({length:28},(_,i)=>centers[Math.floor(((i*.61803398875+.137)%1)*centers.length)]);
    const clusters:number[][]=seeds.map(()=>[]);
    centers.forEach((center,i)=>{let nearest=0,distance=Infinity;for(let j=0;j<seeds.length;j++){const d=center.distanceToSquared(seeds[j]);if(d<distance){distance=d;nearest=j}}clusters[nearest].push(i)});
    clusters.forEach((indices,i)=>{
      if(!indices.length)return;
      const center=new THREE.Vector3();for(const j of indices)center.add(centers[j]);center.divideScalar(indices.length);
      const vertices:number[]=[];for(const j of indices){const t=triangles[j];for(let k=0;k<9;k+=3)vertices.push(t[k]-center.x,t[k+1]-center.y,t[k+2]-center.z)}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
      const material=new THREE.MeshPhysicalMaterial({color:new THREE.Color().setHSL(.745,.3,.52+(i%4)*.04),metalness:.55,roughness:.3,clearcoat:.85,clearcoatRoughness:.2,iridescence:.12,envMapIntensity:1.2,side:THREE.DoubleSide});
      const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;this.root.add(mesh);
      const seed=((i*97)%101)/101;
      const direction=center.clone().normalize().multiplyScalar(.5).add(new THREE.Vector3(Math.sin(i*2.4)*.2,Math.cos(i*2.4)*.22,Math.sin(i*1.7)*.36));
      const part:Shard={mesh,center,direction,spin:new THREE.Vector3(Math.sin(i*1.3)*1.1,Math.cos(i*2.1)*1.4,Math.sin(i*2.7)*.9),seed,mvp:new THREE.Matrix4(),normal:new THREE.Matrix3()};this.shards.push(part);
      for(let offset=0;offset<vertices.length;offset+=9){
        this.a.fromArray(vertices,offset);this.b.fromArray(vertices,offset+3);this.c.fromArray(vertices,offset+6);
        const normal=this.b.sub(this.a).cross(this.c.sub(this.a)).normalize().clone();
        this.faces.push({part,offset,normal,xy:new Float32Array(6),depth:0,color:0});
      }
    });
  }
  update(scroll:number,time:number,width:number,height:number,reduced=false){
    const phase=emblemPhase(scroll,reduced);this.opacity=phase.opacity;
    const dt=this.previousTime===undefined?0:Math.min(.05,Math.max(0,time-this.previousTime));this.previousTime=time;
    if(reduced||phase.opacity<.002)this.idleAngle=0;
    else this.idleAngle+=dt*.32*phase.assembly*(1-phase.breakup);
    this.root.visible=this.opacity>.002;
    // The center and size stay fixed; individual shards perform the reveal.
    this.root.position.set(width<700?.2:.73,width<700?-.27:0,0);
    this.root.scale.setScalar(width<700?1.18:1.8);
    this.root.rotation.set(reduced?-.06:-.06+Math.sin(this.idleAngle*.7)*.12,-.2+this.idleAngle,reduced?.025:.025+Math.sin(this.idleAngle*.5)*.045);
    for(const part of this.shards){
      const assembled=ease((phase.assembly-part.seed*.13)/(1-part.seed*.13));
      const released=ease((phase.breakup-(1-part.seed)*.12)/(1-(1-part.seed)*.12));
      const separation=1-assembled+released;
      part.mesh.position.copy(part.center).addScaledVector(part.direction,separation);
      part.mesh.rotation.set(part.spin.x*separation,part.spin.y*separation,part.spin.z*separation);
      part.mesh.material.transparent=this.opacity<.999;part.mesh.material.opacity=this.opacity;
    }
    this.root.updateMatrixWorld(true);
    return {...phase,fragments:this.shards.length,triangles:this.faces.length,loaded:this.shards.length>0};
  }
  drawCanvas(ctx:CanvasRenderingContext2D,width:number,height:number){
    if(!this.root.visible||!this.faces.length)return;
    this.camera.updateMatrixWorld(true);this.projection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);
    for(const part of this.shards){part.mvp.multiplyMatrices(this.projection,part.mesh.matrixWorld);part.normal.getNormalMatrix(part.mesh.matrixWorld)}
    for(const face of this.faces){
      const vertices=face.part.mesh.geometry.attributes.position.array;
      this.a.fromArray(vertices,face.offset).applyMatrix4(face.part.mvp);this.b.fromArray(vertices,face.offset+3).applyMatrix4(face.part.mvp);this.c.fromArray(vertices,face.offset+6).applyMatrix4(face.part.mvp);
      const p=face.xy;p[0]=(this.a.x*.5+.5)*width;p[1]=(-this.a.y*.5+.5)*height;p[2]=(this.b.x*.5+.5)*width;p[3]=(-this.b.y*.5+.5)*height;p[4]=(this.c.x*.5+.5)*width;p[5]=(-this.c.y*.5+.5)*height;
      face.depth=(this.a.z+this.b.z+this.c.z)/3;
      this.normal.copy(face.normal).applyMatrix3(face.part.normal).normalize();
      const lighting=.25+Math.max(0,this.normal.dot(this.light))*.58+Math.pow(Math.max(0,this.normal.z),12)*.16;
      face.color=Math.min(95,Math.round(lighting*95));
    }
    this.faces.sort((a,b)=>b.depth-a.depth);
    ctx.save();ctx.globalAlpha=this.opacity;
    for(const face of this.faces){const p=face.xy;ctx.fillStyle=this.palette[face.color];ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.lineTo(p[4],p[5]);ctx.closePath();ctx.fill();ctx.strokeStyle=this.palette[face.color];ctx.lineWidth=.4;ctx.stroke()}
    ctx.restore();
  }
  dispose(){this.disposed=true;this.scene.remove(this.root);for(const part of this.shards){part.mesh.geometry.dispose();part.mesh.material.dispose()}this.shards=[];this.faces=[]}
}
