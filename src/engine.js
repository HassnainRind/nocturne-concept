import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

export function initNocturne(){
const off=[],tk=f=>{gsap.ticker.add(f);off.push(()=>gsap.ticker.remove(f))},si=(f,d)=>{const id=setInterval(f,d);off.push(()=>clearInterval(id))},al=(n,f,o)=>{addEventListener(n,f,o);off.push(()=>removeEventListener(n,f,o))},dl=(n,f,o)=>{document.addEventListener(n,f,o);off.push(()=>document.removeEventListener(n,f,o))};

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;
const pad=n=>String(n).padStart(2,'0'),sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
let lenis;if(!RM){lenis=new Lenis({lerp:.085});lenis.on('scroll',ScrollTrigger.update);tk(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);lenis.stop()}
$$('a[href^="#"]').forEach(a=>a.onclick=e=>{e.preventDefault();const t=$(a.getAttribute('href'));lenis?lenis.scrollTo(t):t.scrollIntoView()});
const split=(el,w,mask)=>{const t=el.textContent.trim();el.setAttribute('aria-label',t);el.textContent='';return(w?t.split(' '):[...t]).map((s,i,a)=>{const c=document.createElement('span');c.className='c';c.setAttribute('aria-hidden','true');c.textContent=s;let n=c;if(mask){n=document.createElement('span');n.className='m';n.setAttribute('aria-hidden','true');n.appendChild(c)}el.appendChild(n);if(w&&i<a.length-1)el.append(' ');return c})};

/* pointer, cursor, magnetic */
const M={x:innerWidth/2,y:innerHeight/2,nx:0,ny:0},cur=$('.cur'),dot=$('.dot'),ring=$('.ring');let rx=M.x,ry=M.y,vx=0,vy=0;
const mg=$$('.mag').map(el=>({el,x:gsap.quickTo(el,'x',{duration:.6,ease:'power3.out'}),y:gsap.quickTo(el,'y',{duration:.6,ease:'power3.out'})}));
al('pointermove',e=>{M.x=e.clientX;M.y=e.clientY;M.nx=e.clientX/innerWidth*2-1;M.ny=1-e.clientY/innerHeight*2;if(FINE)mg.forEach(m=>{const r=m.el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,n=Math.hypot(e.clientX-cx,e.clientY-cy)<Math.max(r.width,90)*.55;m.x(n?(e.clientX-cx)*.06:0);m.y(n?(e.clientY-cy)*.06:0)})});
dl('pointerover',e=>cur.classList.toggle('h',!!e.target.closest('a,[data-cur]')));
const tch=e=>{const t=e.touches[0];if(!t)return;M.x=t.clientX;M.y=t.clientY;M.nx=t.clientX/innerWidth*2-1;M.ny=1-t.clientY/innerHeight*2;M.t=1;clearTimeout(M.tt);M.tt=setTimeout(()=>M.t=0,1800)};
al('touchstart',tch,{passive:true});al('touchmove',tch,{passive:true});

/* WebGL point cloud: fibonacci core + dust shell + orbit rings -> terrain; smoothed, velocity-aware mouse field */
let GL=null;
try{const cv=$('#gl'),r=new THREE.WebGLRenderer({canvas:cv,alpha:true,powerPreference:'high-performance'}),dpr=Math.min(devicePixelRatio,innerWidth<700?1.5:1.75);r.setPixelRatio(dpr);
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.1,100),N=innerWidth<700?6000:15000,A=new Float32Array(N*3),B=new Float32Array(N*3),K=new Float32Array(N),Z=new Float32Array(N),ga=Math.PI*(3-Math.sqrt(5)),core=Math.floor(N*.95);
for(let i=0;i<N;i++){let x,y,z,kind=0;
 if(i<core){const yy=1-2*(i+.5)/core,s=Math.sqrt(1-yy*yy),th=i*ga,R=2.1*(.98+Math.random()*.03);x=R*s*Math.cos(th);y=R*yy;z=R*s*Math.sin(th)}
 else{const R=2.7+Math.random()*.9,uu=Math.random()*2-1,t=Math.random()*6.2832,s=Math.sqrt(1-uu*uu);x=R*s*Math.cos(t);y=R*uu*.7;z=R*s*Math.sin(t);kind=1}
 A.set([x,y,z],i*3);B.set([(Math.random()-.5)*15,0,(Math.random()-.5)*11-1],i*3);K[i]=Math.random()<.004?1:0;Z[i]=kind}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(A,3));g.setAttribute('aB',new THREE.BufferAttribute(B,3));g.setAttribute('aK',new THREE.BufferAttribute(K,1));g.setAttribute('aT',new THREE.BufferAttribute(Z,1));
const u={uT:{value:0},uMix:{value:0},uPx:{value:3*dpr},uAsp:{value:1},uPow:{value:0},uM:{value:new THREE.Vector2(9,9)}};
const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,
vertexShader:`attribute vec3 aB;attribute float aK,aT;uniform float uT,uMix,uPx,uAsp,uPow;uniform vec2 uM;varying float vK,vA;
void main(){vec3 p=mix(position,aB,uMix);
float br=sin(dot(position,vec3(1.7,2.3,1.1))+uT*.8)*.5+sin(dot(position,vec3(-2.1,1.3,2.9))+uT*.55)*.5;
p+=normalize(position+1e-4)*br*.03*(1.-uMix)*(aT<.5?1.:.4);
float w=sin(p.x*1.1+uT*.6)*cos(p.z*.9+uT*.4);p.y+=uMix*(w*.9-1.7);
vec4 mv=modelViewMatrix*vec4(p,1.);vec4 o=projectionMatrix*mv;
vec2 d=(o.xy/o.w-uM)*vec2(uAsp,1.);float l=length(d);float f=smoothstep(.5,0.,l);f*=f;vec2 dir=d/(l+1e-3);
mv.xy+=dir*f*(.12+.45*uPow)*(-mv.z*.1)+vec2(-dir.y,dir.x)*f*uPow*.12;mv.z+=f*(.2+.5*uPow);
gl_Position=projectionMatrix*mv;gl_PointSize=uPx*(1.+aK*1.2)*(aT<.5?1.:.75)*(1.+f*.8)*(4./-mv.z);
vK=aK;vA=(.3+.7*clamp(1.-(-mv.z-4.)/7.,0.,1.))*(aT>.5&&aT<1.5?.55:1.);}`,
fragmentShader:`varying float vK,vA;void main(){vec2 c=gl_PointCoord-.5;if(dot(c,c)>.25)discard;gl_FragColor=vec4(mix(vec3(.96,.96,.94),vec3(1.),vK),vA*(.42+.5*vK));}`});
const grp=new THREE.Group();grp.add(new THREE.Points(g,mat));sc.add(grp);
const rs=()=>{r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;u.uAsp.value=cam.aspect;cam.position.z=innerWidth<innerHeight?10.5:7;cam.updateProjectionMatrix()};rs();
const G={x:0,y:0,pow:0,spin:0,rot:0};
GL={rs,dispose(){r.dispose()},draw(t,mix,f){const fine=(FINE||M.t)&&!RM,tx=fine?M.nx:Math.sin(t*.35)*.5,ty=fine?M.ny:Math.cos(t*.27)*.35,k=1-Math.pow(.93,f),ox=G.x,oy=G.y;
 G.x+=(tx-G.x)*k;G.y+=(ty-G.y)*k;G.pow+=(Math.min(1,Math.hypot(G.x-ox,G.y-oy)/f*18)-G.pow)*(1-Math.pow(.94,f));
 G.spin=(G.spin+(G.x-ox)*.6)*Math.pow(.93,f);G.rot+=.003*f+G.spin;
 u.uT.value=RM?0:t;u.uMix.value=mix;u.uM.value.set(RM?9:G.x,RM?9:G.y);u.uPow.value=RM?0:G.pow;
 grp.rotation.y=(RM?0:G.rot)*(1-mix)+G.x*.08*mix;grp.rotation.x+=((mix*.32-G.y*.12)-grp.rotation.x)*k;grp.rotation.z=(1-mix)*.12;
 grp.scale.setScalar(.55+.45*sm(0,1,S.intro));r.render(sc,cam)}}}
catch(e){document.body.classList.add('nogl');$('#gl').style.display='none'}

/* hero title */
const T=$('#title'),tc=split(T,0,1),tw=tc.map(()=>300),S={intro:RM?1:0};
if(RM)tc.forEach(c=>c.style.fontWeight=800);else gsap.set(tc,{yPercent:110});

/* timeline */
const P=[['The Hush','Traffic thins. Windows dim in sequence. Self-monitoring drops in six of ten subjects.'],['The Confessional','Messages grow longer and less edited. Strangers become the safest audience.'],['The Fracture','Peak anomaly. Subjects speak aloud to empty rooms. Our instruments cannot agree on what they hear.'],['The Thaw','Fear recedes into fatigue. Routines return like rumours.'],['First Light','The mask is restored. No one remembers what they said.']];
const wp=$('#wp'),wg=$('#wg'),hd=$('#hd'),sl=$('#sl'),sv=$('#wave'),ck=$('#clock');let L=1,TP=0,ph=-1;var ghosts=[0,1,2].map(function(i){return document.getElementById('g'+i)});var ghostPos=[{x:0,y:0},{x:0,y:0},{x:0,y:0}];var ghostOp=[.4,.25,.12];
const upd=p=>{TP=p;const pt=wp.getPointAtLength(L*p);wp.style.strokeDashoffset=L*(1-p);hd.setAttribute('cx',pt.x);hd.setAttribute('cy',pt.y);ghosts.forEach(function(g,gi){if(!g)return;var lag=.92+gi*.03;ghostPos[gi].x+=(pt.x-ghostPos[gi].x)*(1-lag);ghostPos[gi].y+=(pt.y-ghostPos[gi].y)*(1-lag);g.setAttribute('cx',ghostPos[gi].x);g.setAttribute('cy',ghostPos[gi].y);g.setAttribute('opacity',ghostOp[gi]*p)});var prEl=document.getElementById('pr0');if(prEl){prEl.setAttribute('cx',pt.x);prEl.setAttribute('cy',pt.y)};sl.setAttribute('x1',pt.x);sl.setAttribute('x2',pt.x);const m=Math.round(p*360);ck.textContent=pad(m/60|0)+':'+pad(m%60);ck.style.fontWeight=900-Math.round(p*700);$('#ptm').textContent=ck.textContent;
const i=Math.min(4,p*5|0);if(i!==ph){ph=i;if(!RM){var _ft=document.getElementById('ft'),_fd=document.getElementById('fd'),phEl=document.querySelector('.phase');if(_ft&&_fd&&phEl){phEl.style.filter='url(#tv)';gsap.fromTo(_fd,{attr:{scale:0}},{attr:{scale:25},duration:.05,repeat:3,yoyo:true,onUpdate:function(){_ft.setAttribute('baseFrequency',(Math.random()*.012).toFixed(3)+' '+(.1+Math.random()*.35).toFixed(2))},onComplete:function(){phEl.style.filter='none';_fd.setAttribute('scale',0)}})}}$('#pt').textContent=P[i][0];$('#pd').textContent=P[i][1];$('#pn2').textContent='Phase 0'+(i+1)+' / 05';if(!RM)gsap.fromTo('.phase',{opacity:0,y:24},{opacity:1,y:0,duration:.9,ease:'expo.out'})}};
const build=()=>{const w=sv.clientWidth,h=sv.clientHeight;sv.setAttribute('viewBox',`0 0 ${w} ${h}`);let d='';for(let i=0;i<=140;i++){const t=i/140,n=Math.sin(i*12.9898)*43758.5453,j=n-Math.floor(n)-.5,a=Math.min(1,Math.max(0,(.15+.85*Math.pow(Math.abs(t-.58)*1.7,1.6))*.8+.6*Math.exp(-Math.pow((t-.54)*26,2))+j*.08));d+=(i?'L':'M')+(t*w).toFixed(1)+' '+(h-8-a*(h-16)).toFixed(1)}
wp.setAttribute('d',d);wg.setAttribute('d',d);L=wp.getTotalLength();wp.style.strokeDasharray=L;sl.setAttribute('y2',h);upd(TP)};
const tlST=ScrollTrigger.create({trigger:'#tl',start:'top top',end:'+=400%',pin:true,onUpdate:s=>upd(s.progress)});build();
let lw=innerWidth;al('resize',()=>{if(innerWidth===lw&&!FINE)return;lw=innerWidth;build();GL&&GL.rs()});


/* instruments: pinned horizontal gallery + generated visuals */
const mk=(el,n,f)=>{for(let i=0;i<n;i++){const e=document.createElement('i');f(e,i);el.appendChild(e)}};
mk($('.v1'),6,(e,i)=>e.style.animationDelay=-i*.9+'s');mk($('.v2'),3,()=>0);mk($('.v3'),60,()=>0);mk($('.v4'),30,e=>{e.style.animationDuration=(.8+Math.random()*1.6)+'s';e.style.animationDelay=-Math.random()*2+'s'});
if(!RM)si(()=>$$('.v3 i').forEach(e=>e.classList.toggle('on',Math.random()<.3)),900);
const hst=$('#hst'),hsd=()=>Math.max(0,hst.scrollWidth-innerWidth);
if(!RM)gsap.to(hst,{x:()=>-hsd(),ease:'none',scrollTrigger:{trigger:'#ins',start:'top top',end:()=>'+='+hsd(),pin:true,scrub:true,invalidateOnRefresh:true}});
else{$('#ins').style.cssText='height:auto;overflow-x:auto;padding-top:7rem';hst.style.position='relative'}
/* iris reveal */
if(!RM)gsap.fromTo('.ir-in',{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)',ease:'none',scrollTrigger:{trigger:'#iris',start:'top top',end:'bottom bottom',scrub:true}});
/* halftone moon (phase follows scroll) + ridgeline field */
(function(){const mc=$('#moonC'),mx=mc.getContext('2d'),rc=$('#ridgeC'),rx=rc.getContext('2d'),pc=$('#moonPct');let ph=.5,mOn=false,rOn=false,sx=0,sy=0;
const fit=(c,x)=>{const d=Math.min(devicePixelRatio,2);c.width=c.clientWidth*d;c.height=c.clientHeight*d;x.setTransform(d,0,0,d,0,0)},rs=()=>{fit(mc,mx);fit(rc,rx)};rs();al('resize',rs);
ScrollTrigger.create({trigger:'#moon',start:'top bottom',end:'bottom top',onUpdate:s=>{mOn=s.isActive;ph=Math.min(1,Math.max(0,(s.progress-.25)/.5))}});
ScrollTrigger.create({trigger:'#ridge',start:'top bottom',end:'bottom top',onToggle:s=>rOn=s.isActive});
tk(t=>{
 if(mOn){const w=mc.clientWidth,h=mc.clientHeight,R=Math.min(w,h)*.34,g=w<700?8:11,a=ph*6.2832,Lx=Math.sin(a),Lz=-Math.cos(a),cx=w/2,cy=h/2;mx.clearRect(0,0,w,h);
  for(let y=-R;y<=R;y+=g)for(let x=-R;x<=R;x+=g){const nx=x/R,ny=y/R,q=nx*nx+ny*ny;if(q>1)continue;const nz=Math.sqrt(1-q),tx=.62+.2*Math.sin(nx*6+1)*Math.cos(ny*5)+.18*Math.sin(nx*13)*Math.sin(ny*11+2);let v=Math.max(Math.max(0,nx*Lx+nz*Lz)*tx,.035);mx.fillStyle='rgba(245,245,240,'+(.3+.7*Math.min(1,v*1.3)).toFixed(2)+')';mx.beginPath();mx.arc(cx+x,cy+y,g*.52*Math.sqrt(Math.min(1,v*1.25)),0,6.2832);mx.fill()}
  pc.textContent=Math.round((1-Math.cos(a))/2*100)+'%'}
 if(rOn){const w=rc.clientWidth,h=rc.clientHeight,r=rc.getBoundingClientRect(),n=w<700?22:36,m=w<700?60:100,tt=RM?0:t,tx=(FINE||M.t)?M.x-r.left:w*(.5+.38*Math.sin(tt*.4)),ty=(FINE||M.t)?M.y-r.top:h*.6;sx+=(tx-sx)*.1;sy+=(ty-sy)*.1;rx.clearRect(0,0,w,h);rx.lineWidth=1;rx.fillStyle='#080808';
  for(let i=0;i<n;i++){const y0=h*.22+i/(n-1)*h*.7,P=[];for(let j=0;j<=m;j++){const x=j/m*w,u=x/w-.5,env=Math.exp(-u*u*14),nz=Math.sin(u*22+tt*.9+i*.55)*.5+Math.sin(u*47-tt*1.3+i*1.3)*.5,dx=(x-sx)/(w*(M.t?.17:.1)),dy=(y0-sy)/(h*.22);P.push(x,y0-(env*nz*h*.1+Math.exp(-dx*dx-dy*dy)*h*.07)*(.5+i/n))}
   rx.beginPath();rx.moveTo(P[0],P[1]);for(let k=2;k<P.length;k+=2)rx.lineTo(P[k],P[k+1]);rx.lineTo(w,h+4);rx.lineTo(0,h+4);rx.closePath();rx.fill();
   rx.beginPath();rx.moveTo(P[0],P[1]);for(let k=2;k<P.length;k+=2)rx.lineTo(P[k],P[k+1]);rx.strokeStyle='rgba(245,245,240,'+(.3+.7*i/n).toFixed(2)+')';rx.stroke()}}
});})();
/* velocity skew on marquees + font-load refresh */
if(lenis){const sk=gsap.quickSetter('.mq,.mq2','skewX','deg');lenis.on('scroll',e=>sk(gsap.utils.clamp(-8,8,-e.velocity*.4)))}
document.fonts&&document.fonts.ready.then(()=>ScrollTrigger.refresh());
/* reveals, fills, marquee */
if(!RM){
 $$('.sp').forEach(el=>{const c=split(el,1,1);gsap.from(c,{yPercent:110,duration:1.3,stagger:.08,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%'}})});
 $$('.rv').forEach(el=>gsap.from(el,{y:30,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 90%'}}));
 gsap.fromTo(split($('#man'),1,0),{color:'#8A8A84'},{color:'#F5F5F0',stagger:.1,ease:'none',scrollTrigger:{trigger:'#man',start:'top 80%',end:'bottom 50%',scrub:true}});
 gsap.fromTo('#qt',{color:'rgba(245,245,240,0)',xPercent:6},{color:'#F5F5F0',xPercent:-10,ease:'none',scrollTrigger:{trigger:'#qt',start:'top 90%',end:'bottom 10%',scrub:true}});
 gsap.to('#title',{yPercent:-18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
 gsap.to('#mq',{xPercent:-50,ease:'none',scrollTrigger:{trigger:'.end',start:'top bottom',end:'bottom top',scrub:true}});
}
$$('[data-n]').forEach(el=>{const n=+el.dataset.n,d=+(el.dataset.d||0),o={v:0},f=v=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});if(RM){el.textContent=f(n);return}gsap.to(o,{v:n,duration:2.2,ease:'expo.out',onUpdate:()=>el.textContent=f(o.v),scrollTrigger:{trigger:el,start:'top 90%',once:true}})});
/* SVG TV glitch on index rows */
const ft=$('#ft'),fd=$('#fd');
if(!RM)$$('.rows li').forEach(li=>{const b=li.querySelector('b');li.addEventListener('pointerenter',()=>{b.style.filter='url(#tv)';gsap.fromTo(fd,{attr:{scale:0}},{attr:{scale:40},duration:.07,repeat:5,yoyo:true,onUpdate:()=>ft.setAttribute('baseFrequency',(Math.random()*.02).toFixed(3)+' '+(.2+Math.random()*.5).toFixed(2)),onComplete:()=>{b.style.filter='none';fd.setAttribute('scale',0)}})})});

const nav=$('#nav'),menu=$('#menu'),mb=$('#mb');let ly=0,menuOpen=false,curS=null;
const ind=$('#ind'),links=$$('.nl a[data-s]'),mo=$('#mo'),act=()=>links.find(a=>a.classList.contains('on')),go=a=>a?gsap.to(ind,{x:a.offsetLeft,width:a.offsetWidth,opacity:1,duration:.55,ease:'expo.out',overwrite:true}):gsap.to(ind,{opacity:0,duration:.3,overwrite:true});
links.forEach(a=>{a.addEventListener('mouseenter',()=>go(a));a.addEventListener('mouseleave',()=>go(act()))});
const od=()=>$('#clk').classList.toggle('open',new Date().getHours()<6);od();si(od,60000);
const setA=id=>{links.forEach(a=>a.classList.toggle('on',a.dataset.s===id));go(act())};
['tl','ins','fnd','idx'].forEach(id=>ScrollTrigger.create({trigger:id==='tl'?$('#tl').parentElement:'#'+id,start:'top 50%',end:'bottom 50%',onToggle:t=>{if(t.isActive){curS=id;setA(id)}else if(curS===id){curS=null;setA(null)}}}));
const setMenu=o=>{menuOpen=o;menu.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Menu';nav.classList.remove('hid');lenis&&(o?lenis.stop():lenis.start())};
mb.onclick=()=>{setMenu(!menuOpen);if(!RM){mb.style.filter='url(#tv)';gsap.fromTo(fd,{attr:{scale:0}},{attr:{scale:40},duration:.07,repeat:5,yoyo:true,onUpdate:()=>ft.setAttribute('baseFrequency',(Math.random()*.02).toFixed(3)+' '+(.2+Math.random()*.5).toFixed(2)),onComplete:()=>{mb.style.filter='none';fd.setAttribute('scale',0)}})}};menu.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)},true);al('keydown',e=>e.key==='Escape'&&setMenu(false));
/* live data */
let subj=4812093;const clk=()=>{const d=new Date(),h=d.getHours();$('#clk').textContent=[h,d.getMinutes(),d.getSeconds()].map(pad).join(':');$('#st').textContent=h<6?'Window open, observing':'Window closed, daylight'};clk();si(clk,1000);
si(()=>{subj+=Math.random()*40|0;$('#sj').textContent=subj.toLocaleString('en-US');$('#db').textContent=(18+Math.random()*7).toFixed(1)},700);

const utc=()=>{const d=new Date();$('#utc').textContent=[d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()].map(pad).join(':');$('#utcs').textContent=d.getUTCHours()<6?'Window open':'Window closed'};utc();si(utc,1000);
if(!RM)gsap.fromTo('#wm',{color:'rgba(245,245,240,0)'},{color:'#F5F5F0',ease:'none',scrollTrigger:{trigger:'#wm',start:'top bottom',end:'bottom bottom',scrub:true}});
/* master loop (gsap.ticker = requestAnimationFrame, frame-rate independent) */
const bar=$('#bar');
tk((t,dms)=>{const y=lenis?lenis.scroll:scrollY,H=innerHeight,f=Math.min(dms||16.7,50)/16.67;
 if(FINE){const dk=Math.pow(.78,f);vx=(vx+(M.x-rx)*.11*f)*dk;vy=(vy+(M.y-ry)*.11*f)*dk;rx+=vx*f;ry+=vy*f;dot.style.transform=`translate3d(${M.x}px,${M.y}px,0)`;ring.style.transform=`translate3d(${rx}px,${ry}px,0)`}
 if(!RM&&y<H){const k=1-Math.pow(.88,f);tc.forEach((c,i)=>{const r=c.getBoundingClientRect(),d=Math.hypot(M.x-(r.left+r.width/2),(M.y-(r.top+r.height/2))*.5)/innerWidth,w=(FINE||M.t)?300+600*Math.exp(-d*d*40):500+250*Math.sin(t*.8+i*.7);tw[i]+=(w-tw[i])*k;c.style.fontWeight=tw[i]|0})}
 if(GL){const mix=sm(tlST.start-H,tlST.end,y)*(1-sm(tlST.end,tlST.end+H,y));$('#gl').style.opacity=S.intro*(.2+.5*(1-sm(0,H*.9,y)));GL.draw(t,mix,f)}
 if(!menuOpen){const dy=y-ly;if(y<H*.4||dy<-4)nav.classList.remove("hid");else if(dy>4)nav.classList.add("hid")}ly=y;nav.classList.toggle("sc",y>40);{const sp=Math.min(1,y/Math.max(1,document.documentElement.scrollHeight-H));nav.style.setProperty("--p",sp.toFixed(4));mo.setAttribute("cx",(24-14*sp).toFixed(2))}
 bar.style.transform=`scaleY(${Math.min(1,y/Math.max(1,document.documentElement.scrollHeight-H))})`});

/* preloader / intro */
if(RM){$('#pre').remove()}else{const C={v:0};gsap.to(C,{v:100,duration:1.8,ease:'power2.inOut',onUpdate:()=>$('#pn').textContent=String(Math.round(C.v)).padStart(3,'0'),onComplete:()=>{
 gsap.timeline({defaults:{ease:'expo.out'}}).to('#pre',{yPercent:-100,duration:1.1,ease:'expo.inOut'}).to(tc,{yPercent:0,duration:1.6,stagger:.06},'-=.5').from('.hero .row,.hero .q,.hero .mono',{opacity:0,y:20,stagger:.1,duration:1},'-=1.1').to(S,{intro:1,duration:2.5,ease:'none'},'<').from('.ret',{opacity:0,scale:.82,duration:2.2,ease:'expo.out'},'<');
 lenis&&lenis.start()}})}

/* ===== V3: CONSTELLATION CANVAS ===== */
(function(){
var cv=document.getElementById('constellationCanvas');if(!cv)return;
var ctx=cv.getContext('2d'),pts=[],NP=innerWidth<700?90:180,connections=[];
function resize(){cv.width=cv.offsetWidth*devicePixelRatio;cv.height=cv.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio)}
resize();al('resize',resize);
for(var i=0;i<NP;i++){pts.push({x:Math.random()*cv.offsetWidth,y:Math.random()*cv.offsetHeight,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*1.5+.5,phase:Math.random()*6.28,bright:Math.random()*.4+.1})}
var conProgress=0;
ScrollTrigger.create({trigger:'#viz1',start:'top bottom',end:'bottom top',onUpdate:function(s){conProgress=s.isActive?Math.pow(Math.sin(Math.PI*s.progress),.6):0}});
tk(function(t){
 if(conProgress<=0)return;
 var w=cv.offsetWidth,h=cv.offsetHeight;
 ctx.clearRect(0,0,w,h);
 pts.forEach(function(p){
  p.x+=p.vx;p.y+=p.vy;
  if(p.x<0||p.x>w)p.vx*=-1;
  if(p.y<0||p.y>h)p.vy*=-1;
  var pulse=.5+.5*Math.sin(t*1.2+p.phase);
  var alpha=p.bright*pulse*conProgress;
  ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);
  ctx.fillStyle='rgba(245,245,240,'+alpha.toFixed(3)+')';ctx.fill();
 });
 if(FINE||M.t){var rc=cv.getBoundingClientRect(),mx=M.x-rc.left,my=M.y-rc.top;pts.forEach(function(p){var dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);if(d<170){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mx,my);ctx.lineWidth=.6;ctx.strokeStyle='rgba(245,245,240,'+((1-d/170)*.5*conProgress).toFixed(3)+')';ctx.stroke();p.x+=dx/(d+1)*.6;p.y+=dy/(d+1)*.6}})}
 var maxDist=120;
 for(var i=0;i<NP;i++){for(var j=i+1;j<NP;j++){
  var dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
  if(d<maxDist){
   var a=(1-d/maxDist)*.06*conProgress;
   ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
   ctx.strokeStyle='rgba(245,245,240,'+a.toFixed(3)+')';ctx.lineWidth=.5;ctx.stroke();
  }
 }}
});
})();

/* ===== V3: GRID/FREQUENCY CANVAS ===== */
(function(){
var cv=document.getElementById('gridCanvas');if(!cv)return;
var ctx=cv.getContext('2d'),gridProgress=0;
function resize(){cv.width=cv.offsetWidth*devicePixelRatio;cv.height=cv.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio)}
resize();al('resize',resize);
ScrollTrigger.create({trigger:'#gridSec',start:'top bottom',end:'bottom top',onUpdate:function(s){gridProgress=s.isActive?Math.pow(Math.sin(Math.PI*s.progress),.6):0}});
if(!RM)gsap.fromTo('#gridSec .grid-label h2',{color:'rgba(245,245,240,0)'},{color:'rgba(245,245,240,.9)',ease:'none',scrollTrigger:{trigger:'#gridSec',start:'top 40%',end:'center top',scrub:true}});
tk(function(t){
 if(gridProgress<=0)return;
 var w=cv.offsetWidth,h=cv.offsetHeight;
 ctx.clearRect(0,0,w,h);
 var cols=Math.floor(w/24),rows=Math.floor(h/24);
 for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){
  var cx=c*24+12,cy=r*24+12;
  var wave=Math.sin(c*.15+t*.8+gridProgress*8)*Math.cos(r*.12+t*.6);
  var dist=Math.hypot(cx-w/2,cy-h/2)/Math.max(w,h);
  var size=(.5+wave*1.5)*(1-dist*.8)*gridProgress;
  if(size<.2)continue;
  var alpha=(.08+wave*.12)*(1-dist)*gridProgress;
  var isAccent=Math.abs(wave)>.85&&gridProgress>.3;
  ctx.beginPath();ctx.arc(cx,cy,Math.max(.3,size),0,6.28);
  ctx.fillStyle=isAccent?'rgba(245,245,240,'+alpha.toFixed(3)+')':'rgba(245,245,240,'+alpha.toFixed(3)+')';
  ctx.fill();
 }}
});
})();

/* ===== V3: GAUGE ANIMATIONS ===== */
(function(){
var gauges=[
 {id:'g-nights',target:14200,circumf:339.3,format:function(v){return Math.round(v).toLocaleString('en-US')}},
 {id:'g-cities',target:212,circumf:339.3,format:function(v){return Math.round(v)}},
 {id:'g-candour',target:90,circumf:339.3,format:function(v){return Math.round(v)+'%'}}
];
gauges.forEach(function(g){
 var el=document.getElementById(g.id);if(!el)return;
 var circle=el.querySelector('.fill'),valEl=el.querySelector('b');
 var o={v:0};
 if(RM){
  o.v=g.target;valEl.textContent=g.format(g.target);
  circle.style.strokeDashoffset=(g.circumf*(1-Math.min(1,g.target/(g.id==='g-candour'?100:15000)))).toFixed(1);
  return;
 }
 gsap.to(o,{v:g.target,duration:2.5,ease:'expo.out',
  scrollTrigger:{trigger:'#dashSec',start:'top 70%',once:true},
  onUpdate:function(){
   valEl.textContent=g.format(o.v);
   var ratio=Math.min(1,o.v/(g.id==='g-candour'?100:g.id==='g-cities'?300:15000));
   circle.style.strokeDashoffset=(g.circumf*(1-ratio)).toFixed(1);
  }
 });
});
})();

/* ===== V3: ENHANCEMENT TICKER ===== */
var figAngle=0,figEl=document.querySelector('.fig');
var trails=[0,1,2,3].map(function(i){return document.getElementById('t'+i)});
var trailPos=[{x:innerWidth/2,y:innerHeight/2},{x:innerWidth/2,y:innerHeight/2},{x:innerWidth/2,y:innerHeight/2},{x:innerWidth/2,y:innerHeight/2}];
var trailOp=[.5,.35,.2,.1];
var grainEl=document.querySelector('.grain'),auroraEl=document.querySelector('.aurora');
var btnEl=document.querySelector('.btn'),btnMag={x:0,y:0};
tk(function(t,dms){
var y=lenis?lenis.scroll:scrollY,H=innerHeight,f=Math.min(dms||16.7,50)/16.67;
var sp=Math.min(1,y/Math.max(1,document.documentElement.scrollHeight-H));
if(FINE){for(var i=0;i<4;i++){if(!trails[i])continue;var decay=Math.pow(.84-i*.03,f);trailPos[i].x+=(M.x-trailPos[i].x)*(1-decay);trailPos[i].y+=(M.y-trailPos[i].y)*(1-decay);trails[i].style.transform='translate3d('+trailPos[i].x+'px,'+trailPos[i].y+'px,0)';trails[i].style.opacity=trailOp[i]}}
if(grainEl){grainEl.style.transform='translate('+(Math.random()-.5)*3+'px,'+(Math.random()-.5)*3+'px)';grainEl.style.opacity=(.035+sp*.025).toFixed(3)}
if(auroraEl)auroraEl.style.opacity=Math.max(0,1-sp*2).toFixed(3);
if(figEl&&!RM){figAngle+=.05*f;figEl.style.transform='rotate('+figAngle.toFixed(2)+'deg)'}
if(FINE&&btnEl){var br=btnEl.getBoundingClientRect(),bcx=br.left+br.width/2,bcy=br.top+br.height/2,dist=Math.hypot(M.x-bcx,M.y-bcy);if(dist<100){var pull=Math.pow(1-dist/100,2)*.25;btnMag.x+=((M.x-bcx)*pull-btnMag.x)*.1;btnMag.y+=((M.y-bcy)*pull-btnMag.y)*.1}else{btnMag.x*=.92;btnMag.y*=.92}if(Math.abs(btnMag.x)>.1||Math.abs(btnMag.y)>.1)btnEl.style.transform='translate('+btnMag.x.toFixed(1)+'px,'+btnMag.y.toFixed(1)+'px)'}
});
if(!RM){gsap.fromTo('#mq2',{xPercent:-50},{xPercent:0,ease:'none',scrollTrigger:{trigger:'.end',start:'top bottom',end:'bottom top',scrub:true}})}

return()=>{off.forEach(f=>f());lenis&&lenis.destroy();GL&&GL.dispose&&GL.dispose();ScrollTrigger.getAll().forEach(t=>t.kill(true));$$('.vz').forEach(v=>v.textContent='')}
}
