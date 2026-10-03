import * as THREE from 'three';

const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10)};

/** One reusable particle buffer; damped springs retain momentum around the pointer. */
export class WordmarkField {
  points?:THREE.Points;
  private target=new Float32Array();
  private position=new Float32Array();
  private origin=new Float32Array();
  private velocity=new Float32Array();
  private seed=new Float32Array();
  private heat=new Float32Array();
  private birth=Infinity;
  private instant=false;private formed=false;
  private width=0;private height=0;
  private material?:THREE.ShaderMaterial;private dotSize=2;
  constructor(private scene?:THREE.Scene,private reduced=false){}

  begin(now:number){this.birth=now;this.formed=false;if(this.reduced)this.finish()}
  finish(){this.instant=true;this.formed=true;this.position.set(this.target);this.velocity.fill(0);this.heat.fill(0)}
  resize(width:number,height:number,dpr:number){
    this.width=width;this.height=height;this.formed=false;
    const mask=document.createElement('canvas');mask.width=width;mask.height=height;
    const g=mask.getContext('2d',{willReadFrequently:true})!;
    g.font=`500 ${Math.min(width*.235,320)}px 'Spline Sans Mono'`;
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f1e8fc';
    g.fillText('velune',width*.5,height*.485);
    const pixels=g.getImageData(0,0,width,height).data;
    const coordinates:number[]=[];
    let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>80)ink++;
    const budget=this.scene?(width<700?18000:44000):30000;
    const step=Math.max(1.35,Math.sqrt(ink/budget));
    this.dotSize=step*1.18;
    for(let y=height*.2;y<height*.78;y+=step)for(let x=width*.035;x<width*.965;x+=step){
      if(pixels[(Math.floor(y)*width+Math.floor(x))*4+3]>80){const n=coordinates.length/3;coordinates.push(x+(((n*73)%997)/997-.5)*step*.25,y+(((n*137)%991)/991-.5)*step*.25,0);}
    }
    this.target=new Float32Array(coordinates);this.position=new Float32Array(coordinates.length);
    this.origin=new Float32Array(coordinates.length);this.velocity=new Float32Array(coordinates.length);
    this.seed=new Float32Array(coordinates.length/3);this.heat=new Float32Array(coordinates.length/3);
    for(let i=0;i<this.seed.length;i++){
      // Stable sampling prevents the wordmark from flickering when resized.
      const seed=((i*16807+13)%2147483647)/2147483647;
      const angle=i*2.399963229728653;const radius=(.34+((i*73)%1000)/1000*.45)*width;
      this.seed[i]=((i*97)%1000)/1000;
      this.origin[i*3]=width*.5+Math.cos(angle)*radius;
      this.origin[i*3+1]=height*.485+Math.sin(angle)*radius*.34+(seed-.5)*height*.12;
      this.position[i*3]=this.origin[i*3];this.position[i*3+1]=this.origin[i*3+1];
    }
    if(this.points){this.scene?.remove(this.points);this.points.geometry.dispose();this.material?.dispose()}
    if(this.instant||performance.now()-this.birth>2800){this.position.set(this.target)}
    if(!this.scene)return;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(this.position,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aSeed',new THREE.BufferAttribute(this.seed,1));
    geometry.setAttribute('aHeat',new THREE.BufferAttribute(this.heat,1).setUsage(THREE.DynamicDrawUsage));
    this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
      uniforms:{uTime:{value:0},uProgress:{value:0},uOpacity:{value:1},uSize:{value:Math.min(dpr,1.75)*Math.max(1.65,step*1.42)},uWidth:{value:width},uHeight:{value:height}},
      vertexShader:`attribute float aSeed,aHeat;uniform float uTime,uProgress,uSize,uWidth,uHeight;varying float vSeed,vHeat;void main(){vSeed=aSeed;vHeat=aHeat;vec3 p=position;float spread=smoothstep(.05,.8,uProgress);p.x+=(p.x-uWidth*.5)*spread*.8+sin(aSeed*141.)*spread*160.;p.y+=(p.y-uHeight*.485)*spread*.8+cos(aSeed*91.)*spread*110.;p.z+=spread*aSeed*100.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=uSize*(.86+aSeed*.22);}`,
      fragmentShader:`uniform float uOpacity;varying float vSeed,vHeat;void main(){float d=length(gl_PointCoord-.5);float alpha=1.-smoothstep(.15,.50,d);vec3 pearl=mix(vec3(.84,.77,.98),vec3(1.,.98,1.),vSeed);vec3 gold=vec3(1.,.73,.43);gl_FragColor=vec4(mix(pearl,gold,min(vHeat,1.)),alpha*uOpacity);}`});
    this.points=new THREE.Points(geometry,this.material);this.points.frustumCulled=false;this.scene.add(this.points);
  }

  update(now:number,dt:number,pointer:{x:number;y:number;active:number},scroll:number,ctx?:CanvasRenderingContext2D){
    const elapsed=(now-this.birth)/1000;
    const assembled=this.instant?1:smooth((elapsed-.45)/2.35);
    if(assembled===1&&!this.formed){this.position.set(this.target);this.velocity.fill(0);this.heat.fill(0);this.formed=true}
    const spread=smooth(scroll/.8);
    const opacity=1-Math.max(0,Math.min(1,(scroll-.05)/.7));
    let deviation=0;const spring=46,decay=Math.exp(-9.6*dt),radius=this.width<700?85:140;
    for(let i=0,j=0;i<this.seed.length;i++,j+=3){
      const bx=this.target[j],by=this.target[j+1],seed=this.seed[i];
      if(assembled<1){
        const swirl=(1-assembled)*.85;
        const ox=this.origin[j]-this.width*.5,oy=this.origin[j+1]-this.height*.485;
        const sx=this.width*.5+ox*Math.cos(swirl)-oy*Math.sin(swirl);
        const sy=this.height*.485+ox*Math.sin(swirl)*.25+oy*Math.cos(swirl);
        this.position[j]=sx+(bx-sx)*assembled;
        this.position[j+1]=sy+(by-sy)*assembled;this.heat[i]=(1-assembled)*.42;
        continue;
      }
      let x=this.position[j],y=this.position[j+1],vx=this.velocity[j],vy=this.velocity[j+1];
      if(this.instant&&this.birth===Infinity){x=bx;y=by}
      const dx=x-pointer.x,dy=y-pointer.y,dist=Math.sqrt(dx*dx+dy*dy);
      const pressure=smooth(1-dist/radius)*pointer.active;
      const inv=1/Math.max(dist,1);
      const force=pressure*4200;
      vx+=((bx-x)*spring+(dx*.8-dy*.6)*inv*force)*dt;
      vy+=((by-y)*spring+(dy*.8+dx*.6)*inv*force)*dt;
      vx*=decay;vy*=decay;x+=vx*dt;y+=vy*dt;
      this.velocity[j]=vx;this.velocity[j+1]=vy;this.position[j]=x;this.position[j+1]=y;
      const offset=Math.hypot(x-bx,y-by);deviation+=offset;const glow=Math.min(1,pressure+offset/75);
      this.heat[i]+=(glow-this.heat[i])*(1-Math.exp(-dt*9));
    }
    if(this.material&&this.points){
      (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
      (this.points.geometry.attributes.aHeat as THREE.BufferAttribute).needsUpdate=true;
      this.material.uniforms.uTime.value=elapsed;
      this.material.uniforms.uProgress.value=Math.max(0,Math.min(1,scroll/.8));
      this.material.uniforms.uOpacity.value=opacity;
    }else if(ctx&&opacity>.01){
      for(let bucket=0;bucket<3;bucket++){
        ctx.fillStyle=[`rgba(239,225,255,${opacity})`,`rgba(245,205,182,${opacity})`,`rgba(255,192,122,${opacity})`][bucket];ctx.beginPath();
        for(let i=0,j=0;i<this.seed.length;i++,j+=3){
          if(Math.min(2,Math.floor(this.heat[i]*3))!==bucket)continue;
          const x=this.position[j]+(this.position[j]-this.width*.5)*spread*.8+Math.sin(this.seed[i]*141)*spread*160;
          const y=this.position[j+1]+(this.position[j+1]-this.height*.485)*spread*.8+Math.cos(this.seed[i]*91)*spread*110;
          const size=this.dotSize*(1-this.heat[i]*.24);ctx.rect(x-size*.5,y-size*.5,size,size);
        }ctx.fill();
      }
    }
    return {progress:assembled,count:this.seed.length,deviation:deviation/Math.max(1,this.seed.length)};
  }
  dispose(){if(this.points){this.scene?.remove(this.points);this.points.geometry.dispose();this.material?.dispose()}}
}
