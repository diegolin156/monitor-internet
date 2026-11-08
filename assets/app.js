const $=s=>document.querySelector(s);
const END={ping:"https://speed.cloudflare.com/__down?bytes=1",down:"https://speed.cloudflare.com/__down?bytes=",up:"https://speed.cloudflare.com/__up"};
const PROFILE={
 stream:{ping:1000,down:5000,up:8000,downBytes:350000,upBytes:220000},
 balanced:{ping:1000,down:8000,up:12000,downBytes:600000,upBytes:350000},
 light:{ping:2000,down:15000,up:20000,downBytes:500000,upBytes:250000}
};
let run=false,timers=[],lastPing=null,startAt=0,bytes=0,critical=0;
const D={ping:[],jit:[],loss:[],down:[],up:[]};

const push=(a,v,max=60)=>{if(Number.isFinite(v)){a.push({t:Date.now(),v});while(a.length>max)a.shift()}};
const v=a=>a.map(x=>x.v);
const avg=a=>v(a).length?v(a).reduce((s,x)=>s+x,0)/v(a).length:null;
const min=a=>v(a).length?Math.min(...v(a)):null;
const max=a=>v(a).length?Math.max(...v(a)):null;
const pct=(a,p)=>{let z=v(a).sort((a,b)=>a-b);if(!z.length)return null;let i=(z.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return l===h?z[l]:z[l]+(z[h]-z[l])*(i-l)};
const f=(x,d=0)=>Number.isFinite(x)?x.toFixed(d):"—";
const time=()=>new Date().toLocaleTimeString("es-AR",{hour12:false});

function quality(x,type){
 if(!Number.isFinite(x))return "";
 if(type==="ping")return x<35?"good":x<80?"warn":"bad";
 if(type==="jit")return x<8?"good":x<20?"warn":"bad";
 if(type==="loss")return x<1?"good":x<3?"warn":"bad";
 if(type==="speed")return x>=10?"good":x>=5?"warn":"bad";
 if(type==="head")return x>=Number($("#margin").value)?"good":x>=1.3?"warn":"bad";
}
function card(id,val,type,label,d=0){
 const e=$("#"+id),c=e.closest(".card"),s=$("#s"+id[0].toUpperCase()+id.slice(1));
 e.textContent=f(val,d);
 const q=quality(val,type);c.className="card "+q;s.className=q;s.textContent=label||"—";
}
function event(msg,k="good"){
 const e=document.createElement("div");e.className="event "+k;
 e.innerHTML=`<span class="time">${time()}</span>${msg}`;$("#log").prepend(e);
 if(k==="bad"){critical++;$("#critical").textContent=critical}
 while($("#log").children.length>100)$("#log").lastElementChild.remove();
}
function addBytes(n){bytes+=n;$("#traffic").textContent=(bytes/1e6).toFixed(2)+" MB";let m=(Date.now()-startAt)/60000;$("#trafficRate").textContent=(bytes/1e6/Math.max(m,.016)).toFixed(1)+" MB/min"}

async function latencyProbe(){
 const t=performance.now();
 try{
   const c=new AbortController(),to=setTimeout(()=>c.abort(),1800);
   const r=await fetch(END.ping+"&r="+Math.random(),{cache:"no-store",signal:c.signal});
   await r.arrayBuffer();clearTimeout(to);
   const ms=performance.now()-t;
   push(D.ping,ms);
   if(lastPing!==null)push(D.jit,Math.abs(ms-lastPing));
   lastPing=ms;push(D.loss,0);
   if(ms>150)event(`Latencia alta: <b>${ms.toFixed(0)} ms</b>`,"bad");
   else if(ms>80)event(`Latencia elevada: <b>${ms.toFixed(0)} ms</b>`,"warn");
 }catch(e){
   push(D.loss,1);lastPing=null;event("Sonda sin respuesta / timeout","bad");
 }
 render();
}
async function downloadProbe(){
 if(!run)return;
 const p=PROFILE[$("#profile").value],prev=avg(D.down);
 let n=prev?Math.max(200000,Math.min(2500000,Math.round(prev*1e6*.35/8))):p.downBytes;
 const t=performance.now();
 try{
   const c=new AbortController(),to=setTimeout(()=>c.abort(),4000);
   const r=await fetch(END.down+n+"&r="+Math.random(),{cache:"no-store",signal:c.signal});
   const b=await r.arrayBuffer();clearTimeout(to);
   const sec=(performance.now()-t)/1000,m=b.byteLength*8/sec/1e6;
   push(D.down,m);addBytes(b.byteLength);
   if(m<5)event(`Download bajo: <b>${m.toFixed(1)} Mbps</b>`,"warn");
 }catch(e){event("Microprueba de download falló","warn")}
 render();
}
async function uploadProbe(){
 if(!run)return;
 const p=PROFILE[$("#profile").value],n=p.upBytes,body=new Uint8Array(n),t=performance.now();
 try{
   const c=new AbortController(),to=setTimeout(()=>c.abort(),5000);
   await fetch(END.up+"?r="+Math.random(),{method:"POST",body,cache:"no-store",signal:c.signal});
   clearTimeout(to);
   const sec=(performance.now()-t)/1000,m=n*8/sec/1e6;
   push(D.up,m);addBytes(n);
   if(m<5)event(`Upload bajo: <b>${m.toFixed(1)} Mbps</b>`,"warn");
 }catch(e){event("Microprueba de upload falló","warn")}
 render();
}
function headroom(){let u=avg(D.up),br=Number($("#bitrate").value);return u&&br?(u*1000/br):null}
function score(){
 let s=100,l=avg(D.ping),j=avg(D.jit),lo=avg(D.loss)||0,u=avg(D.up);
 if(l)s-=Math.min(30,Math.max(0,(l-20)*.45));
 if(j)s-=Math.min(25,Math.max(0,(j-5)*.8));
 s-=Math.min(35,lo*10);
 if(u)s-=Math.min(20,Math.max(0,(8-u)*2));
 return Math.max(0,Math.min(100,s));
}
function render(){
 let l=avg(D.ping),j=avg(D.jit),lo=(avg(D.loss)||0)*100,d=avg(D.down),u=avg(D.up),h=headroom();
 card("latency",l,"ping",l<35?"OK":l<80?"ATENCIÓN":"ALTA",0);
 card("jitter",j,"jit",j<8?"ESTABLE":j<20?"VARIABLE":"ALTO",0);
 card("loss",lo,"loss",lo<1?"OK":lo<3?"ATENCIÓN":"ALTA",1);
 card("down",d,"speed",d>=10?"OK":d>=5?"BAJO":"MUY BAJO",1);
 card("up",u,"speed",u>=10?"OK":u>=5?"BAJO":"MUY BAJO",1);
 card("head",h,"head",h>=Number($("#margin").value)?"OK":h>=1.3?"JUSTO":"INSUF.",1);
 $("#latAvg").textContent=f(avg(D.ping),0)+" ms";$("#latP95").textContent=f(pct(D.ping,.95),0)+" ms";
 $("#jitAvg").textContent=f(avg(D.jit),0)+" ms";$("#jitMax").textContent=f(max(D.jit),0)+" ms";
 $("#ok").textContent=D.loss.filter(x=>x.v===0).length;$("#fail").textContent=D.loss.filter(x=>x.v===1).length;
 $("#downP50").textContent=f(pct(D.down,.5),1);$("#downLast").textContent=f(D.down.at(-1)?.v,1);
 $("#upP50").textContent=f(pct(D.up,.5),1);$("#upLast").textContent=f(D.up.at(-1)?.v,1);
 $("#latMin").textContent=f(min(D.ping),0)+" ms";$("#latMax").textContent=f(max(D.ping),0)+" ms";
 $("#jitMax2").textContent=f(max(D.jit),0)+" ms";$("#upP95").textContent=f(pct(D.up,.95),1)+" Mbps";
 $("#samples").textContent=D.ping.length;$("#brText").textContent=$("#bitrate").value;$("#marginText").textContent=$("#margin").value+"×";
 let sc=score();$("#score").textContent=Math.round(sc);$("#scoreText").textContent=sc>=85?"Excelente":sc>=70?"Buena":sc>=50?"Inestable":"Crítica";
 $("#score").style.color=sc>=85?"var(--green)":sc>=70?"var(--yellow)":"var(--red)";
 if(run){let q=sc>=85?"on":sc>=60?"warn":"bad";$("#dot").className=q}
 draw();
}
function draw(){
 const c=$("#chart"),ctx=c.getContext("2d"),r=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;
 c.width=w*r;c.height=h*r;ctx.setTransform(r,0,0,r,0,0);ctx.clearRect(0,0,w,h);
 ctx.strokeStyle="rgba(129,149,174,.12)";ctx.lineWidth=1;
 for(let i=0;i<5;i++){let y=15+i*(h-40)/4;ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(w-8,y);ctx.stroke()}
 let all=[...D.ping,...D.down,...D.up].map(x=>x.v);let top=Math.max(20,(Math.max(...all,1))*1.12);
 const series=[{a:D.ping,c:"#5da7ff"},{a:D.down,c:"#35d69d"},{a:D.up,c:"#f3c453"}];
 for(const s of series){if(!s.a.length)continue;ctx.strokeStyle=s.c;ctx.lineWidth=2;ctx.beginPath();s.a.forEach((p,i)=>{let x=40+i/59*(w-50),y=h-24-(p.v/top)*(h-40);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
 ctx.fillStyle="#7287a1";ctx.font="10px Segoe UI";ctx.fillText(top.toFixed(0),6,17);ctx.fillText("0",20,h-20);
}
function uptime(){if(!run)return;let s=Math.floor((Date.now()-startAt)/1000),m=Math.floor(s/60),r=s%60;$("#uptime").textContent=String(m).padStart(2,"0")+":"+String(r).padStart(2,"0")}
function schedule(){
 timers.forEach(clearInterval);timers=[];
 let p=PROFILE[$("#profile").value];
 timers.push(setInterval(latencyProbe,p.ping));
 timers.push(setInterval(downloadProbe,p.down));
 timers.push(setInterval(uploadProbe,p.up));
}
async function start(){
 if(run)return;run=true;startAt=Date.now();bytes=0;critical=0;lastPing=null;Object.values(D).forEach(a=>a.length=0);
 $("#toggle").textContent="DETENER";$("#toggle").classList.add("stop");$("#runState").textContent="MONITOREANDO";$("#runDetail").textContent="Sondas continuas · "+$("#profile").value;
 event("Monitoreo continuo iniciado","good");await latencyProbe();schedule();
}
function stop(){run=false;timers.forEach(clearInterval);timers=[];$("#toggle").textContent="INICIAR";$("#toggle").classList.remove("stop");$("#runState").textContent="DETENIDO";$("#runDetail").textContent="Sin sondas activas";$("#dot").className="";event("Monitoreo detenido","warn")}
$("#toggle").onclick=()=>run?stop():start();
$("#profile").onchange=()=>{if(run){schedule();event("Perfil cambiado a "+$("#profile").value,"warn")}};
$("#bitrate").oninput=render;$("#margin").oninput=render;$("#clear").onclick=()=>$("#log").innerHTML="";
setInterval(uptime,500);addEventListener("resize",draw);render();
