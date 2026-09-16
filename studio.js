'use strict';
const specializedTypes={};
function reportBaseType(type){return specializedTypes[type]?.base||type;}


const columnNames={bar:['항목','값','설명'],line:['기간','값','설명'],waterfall:['항목','값'],donut:['항목','값','설명'],flow:['순서','단계','설명'],org:['단계','회사명','지분·관계','상위회사'],timeline:['일자','사건','설명'],ceo:['이름','구분','기간','내용'],team:['단계','조직명','담당자·업무','상위조직'],management:['이름','직책','담당업무','학력','주요 이력'],product:['제품명','구분','항목명','설명'],overview:['항목','내용'],financial:['지표','기간','값','단위'],comparison:['회사명','비교항목','내용'],relations:['출발회사','도착회사','관계','금액·단위','설명'],causes:['순서','제목','설명'],multiline:['기간','계열명','값']};
const previousValidation=validateData;
validateData=function(type,r){
 const error=previousValidation(type,r);if(error)return error;
 if(!extendedTemplates.some(t=>t.id===type))return '';
 const seen=new Set(),units=new Map();
 for(let i=0;i<r.length;i++){
  const row=r[i],prefix=(i+1)+'번째 줄: ';
  if(!row[1])return prefix+'두 번째 항목을 입력해주세요.';
  if(['financial','multiline'].includes(type)){
   if(!Number.isFinite(parseNumber(row[2])))return prefix+'값은 숫자로 입력해주세요. 누락은 해당 행을 생략하세요.';
   const key=JSON.stringify(row.slice(0,2));if(seen.has(key))return prefix+'동일한 항목·기간이 중복됩니다.';seen.add(key);
   if(type==='financial'){
    if(!row[3])return prefix+'단위가 필요합니다.';
    if(units.has(row[0])&&units.get(row[0])!==row[3])return prefix+'같은 지표의 단위를 통일해주세요.';units.set(row[0],row[3]);
   }
  }
  if(type==='comparison'){
   const key=JSON.stringify(row.slice(0,2));if(seen.has(key))return prefix+'동일 회사·비교항목이 중복됩니다.';seen.add(key);
  }
  if(type==='relations'&&!row[2])return prefix+'관계명을 입력해주세요.';
 }
 return '';
};
const safePositive=(value,fallback,min)=>Number.isFinite(Number(value))&&Number(value)>=min?Number(value):fallback;
function extras(obj){
 return {displayMode:['native','table','cards'].includes(obj.displayMode)?obj.displayMode:'native',layoutWidth:safePositive(obj.layoutWidth,1000,600),fontSize:safePositive(obj.fontSize,24,10),spacing:safePositive(obj.spacing,1,.5),printWidth:safePositive(obj.printWidth,16,1),images:cleanImages(obj.images)};
}
function cleanImages(images){
 if(!Array.isArray(images))return [];
 return images.filter(i=>i&&typeof i.product==='string'&&typeof i.src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(i.src)).map(i=>({product:i.product,src:i.src,id:typeof i.id==='string'?i.id:'',width:safePositive(i.width,1,1),height:safePositive(i.height,1,1),annotations:Array.isArray(i.annotations)?i.annotations.filter(a=>a&&['mark','arrow'].includes(a.kind)&&typeof a.label==='string'&&[a.x,a.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&(a.kind!=='arrow'||[a.x2,a.y2].every(v=>Number.isFinite(v)&&v>=0&&v<=1))):[]}));
}
Object.assign(state,extras(state));
const priorNormalize=normalizeAnswer;
normalizeAnswer=function(obj,allowStyle=false){
 const result=priorNormalize(obj,allowStyle);
 // Imported source data never inherits a different product's photos.
 return {...result,...extras(allowStyle?obj:{...state,images:[]})};
};
const originalSync=syncControls;
syncControls=function(){
 originalSync();
 for(const key of ['displayMode','layoutWidth','fontSize','spacing','printWidth'])$('#'+key).value=state[key]??extras({})[key];
 $('#productImages').hidden=reportBaseType(state.type)!=='product';
 const selected=$('#photoProduct').value;$('#photoProduct').innerHTML='';
 if(reportBaseType(state.type)==='product')for(const name of new Set(rows().map(r=>r[0]))){const o=document.createElement('option');o.value=name;o.textContent=name;$('#photoProduct').appendChild(o);}
 if([...new Set(rows().map(r=>r[0]))].includes(selected))$('#photoProduct').value=selected;
};
let planCache=null,photoRegions=[],annotationMode=null,lastPhotoNames='',activeViewType='';
function pixelWrap(value,width,font){
 const output=[];for(const part of String(value??'').split('\n')){let line='';for(const ch of part){if(line&&labelWidth(line+ch,font)>width){output.push(line);line='';}line+=ch;}output.push(line);}
 return output;
}
function createPlan(){
 const visualType=reportBaseType(state.type),specialized=specializedTypes[state.type];
 const f=state.fontSize||16,g=(state.spacing||1)*16,p=palettes[state.theme],r=rows();
 let width=Math.max(state.layoutWidth||1200,100+10*g+f*12);
 const commands=[],photos=[];
 const draw=(tag,attrs,text)=>commands.push({tag,attrs,text});
 const text=(value,x,y,maxWidth=width-100,size=f,color=p.ink,weight=400)=>{
  const lines=pixelWrap(value,maxWidth,size),lineHeight=size*1.5;
  lines.forEach((line,i)=>draw('text',{x,y:y+size+i*lineHeight,'font-size':size,fill:color,'font-weight':weight},line));return lines.length*lineHeight;
 };
 const box=(x,y,w,h,fill='#f4f7fb')=>draw('rect',{x,y,width:w,height:h,rx:8,fill,stroke:'#dce2ea'});
 const arrow=(x1,y1,x2,y2,color=p.main)=>{
  draw('line',{x1,y1,x2,y2,stroke:color,'stroke-width':2});
  const angle=Math.atan2(y2-y1,x2-x1),s=8;
  draw('path',{d:`M${x2-s*Math.cos(angle-.5)} ${y2-s*Math.sin(angle-.5)} L${x2} ${y2} L${x2-s*Math.cos(angle+.5)} ${y2-s*Math.sin(angle+.5)}`,fill:'none',stroke:color,'stroke-width':2});
 };
 let y=0;
 const heading=(value)=>{y+=text(value,50,y,width-100,f*1.25,p.main,800)+g;};
 function table(headers,body){
  width=Math.max(width,100+headers.length*(f*8+4*g));
  const col=(width-100)/headers.length;
  for(const [index,row] of [headers,...body].entries()){
   const height=Math.max(...row.map(v=>pixelWrap(v,col-2*g,f).length))*f*1.5+2*g;
   row.forEach((v,i)=>{draw('rect',{x:50+i*col,y,width:col,height,fill:index===0?p.dark:index%2?'#f4f7fb':'#fff',stroke:'#dce2ea'});text(v,50+i*col+g,y+g,col-2*g,f,index===0?'#fff':p.ink,index===0?700:400);});y+=height;
  }y+=g;
 }
 function card(title,items){
  const x=50,w=width-100,start=y;const placeholder=commands.length;box(x,y,w,1);
  y+=g;y+=text(title,x+g,y,w-2*g,f*1.3,p.ink,800)+g;
  for(const [label,value] of items){
   y+=text(label,x+g,y,w-2*g,f,p.main,700)+g*.3;
   y+=text(value||'미기재',x+g,y,w-2*g,f)+g;
  }
  commands[placeholder].attrs.height=y-start;y+=g*1.5;
 }
 function steps(items){
  const x=50,w=width-100;
  const centers=[];
  items.forEach((row,i)=>{
   const title=row[1],body=row[2]||'',h=pixelWrap(title,w-5*g-f*2,f*1.1).length*f*1.65+(state.showValues?pixelWrap(body,w-5*g-f*2,f).length*f*1.5+g:0)+2*g;
   centers.push(y+h/2);box(x,y,w,h);draw('circle',{cx:x+g+f,cy:y+g+f,r:f,fill:p.dark});
   draw('text',{x:x+g+f,y:y+g+f*1.35,'text-anchor':'middle','font-size':f,fill:'#fff'},i+1);
   let ty=y+g;ty+=text(title,x+3*g+f*2,ty,w-5*g-f*2,f*1.1,p.ink,700);
   if(state.showValues)text(body,x+3*g+f*2,ty+g*.5,w-5*g-f*2,f);
   y+=h;if(i<items.length-1){arrow(x+w/2,y+4,x+w/2,y+g*2-4);y+=g*2;}
  });
  if(visualType==='cycle'&&centers.length>1){draw('path',{d:`M50 ${centers.at(-1)} H24 V${centers[0]} H42`,fill:'none',stroke:p.accent,'stroke-width':3});arrow(42,centers[0],50,centers[0],p.accent);}
  y+=g;
 }
 const pivot=(type)=>{
  if(type==='financial'){
   const periods=[...new Set(r.map(a=>a[1]))].sort((a,b)=>a.localeCompare(b,'ko',{numeric:true}));
   return {headers:['지표 · 단위',...periods],body:[...new Set(r.map(a=>a[0]))].map(name=>{
    const entries=r.filter(a=>a[0]===name);return [name+' ('+entries[0][3]+')',...periods.map((period,i)=>{
     const item=entries.find(a=>a[1]===period),prev=i?entries.find(a=>a[1]===periods[i-1]):null;if(!item)return '미기재';
     return fmt(num(item[2]))+(prev?'\n'+(num(prev[2])>0?'증감률 '+fmt((num(item[2])/num(prev[2])-1)*100)+'%':'증감률 — (직전값 0 이하)'):'');
    })];})};
  }
  const companies=[...new Set(r.map(a=>a[0]))],fields=[...new Set(r.map(a=>a[1]))];
  return {headers:['비교항목',...companies],body:fields.map(field=>[field,...companies.map(name=>r.find(a=>a[0]===name&&a[1]===field)?.[2]||'미기재')])};
 };
 if(state.displayMode==='table'){
  if(['financial','comparison'].includes(visualType)){const d=pivot(visualType);table(d.headers,d.body);}else table(columnNames[state.type],r.map(row=>columnNames[state.type].map((_,i)=>row[i]||'—')));
 }else if(state.displayMode==='cards'){
  r.forEach(row=>card(row[0],columnNames[state.type].slice(1).map((label,i)=>[label,row[i+1]])));
 }else if(specialized?.layout==='matrix'){
  table(specialized.columns,r);
 }else if(specialized?.layout==='chain'){
  // One causal chain per row: driver → mechanism → outcome, with its evidence below.
  width=Math.max(width,100+3*(f*12+2*g));
  for(const row of r){
   const cell=(width-100-4*g)/3;
   const h=Math.max(...row.slice(0,3).map(v=>pixelWrap(v,cell-2*g,f).length))*f*1.5+f*2+3*g;
   for(let i=0;i<3;i++){
    const x=50+i*(cell+2*g);box(x,y,cell,h,i===2?'#edf4fa':'#f4f7fb');
    text(specialized.columns[i],x+g,y+g,cell-2*g,f*.85,p.main,700);
    text(row[i],x+g,y+2*g+f,cell-2*g,f,p.ink,600);
    if(i<2)arrow(x+cell+3,y+h/2,x+cell+2*g-3,y+h/2);
   }
   y+=h+g;y+=text(specialized.columns[3]+' · '+row[3],50,y,width-100,f*.9,p.ink)+g*2;
  }
 }else if(specialized?.layout==='funnel'){
  r.forEach((row,i)=>{
   const w=(width-100)*(1-.45*i/Math.max(1,r.length-1)),x=(width-w)/2;
   const h=(pixelWrap(row[1],w-2*g,f*1.15).length*f*1.725)+(pixelWrap(row[2],w-2*g,f).length*f*1.5)+3*g;
   box(x,y,w,h);let yy=y+g;yy+=text(row[1],x+g,yy,w-2*g,f*1.15,p.main,700)+g;text(row[2],x+g,yy,w-2*g,f);
   y+=h;if(i<r.length-1){arrow(width/2,y+2,width/2,y+2*g-2);y+=2*g;}
  });y+=g;
 }else if(['financial','comparison'].includes(visualType)){
  const d=pivot(visualType);table(d.headers,d.body);
 }else if(visualType==='overview'){
  table(['기업 정보','내용'],r);
 }else if(visualType==='product'){
  for(const name of new Set(r.map(a=>a[0]))){
   heading(name);const img=(state.images||[]).find(a=>a.product===name);
   if(img){
    const w=width-100,h=Math.min(w*.6,w*img.height/img.width),actualW=Math.min(w,h*img.width/img.height),x=(width-actualW)/2;
    draw('image',{x,y,width:actualW,height:h,href:img.src,preserveAspectRatio:'xMidYMid meet'});
    photos.push({product:name,x,y,width:actualW,height:h});
    for(const a of img.annotations){const ax=x+a.x*actualW,ay=y+a.y*h;
     if(a.kind==='arrow')arrow(ax,ay,x+a.x2*actualW,y+a.y2*h,p.accent);else draw('circle',{cx:ax,cy:ay,r:6,fill:p.accent,stroke:p.dark});
     const labelX=Math.max(x,Math.min(ax+10,x+actualW-Math.min(actualW,labelWidth(a.label,f))));
     text(a.label,labelX,Math.max(y,ay-f*1.5),Math.max(f*3,x+actualW-labelX),f,p.dark,800);
    }y+=h+g*2;
   }
   const items=r.filter(a=>a[0]===name);
   for(const category of new Set(items.map(a=>a[1]))){
    const group=items.filter(a=>a[1]===category);
    heading(category);
    if(category==='작동원리')steps(group.map((a,i)=>[String(i+1),a[2].replace(/^\s*\d+[.、)\s]+/,''),a[3]]));
    else card(category==='개요'?'제품 소개':category,group.map(a=>[a[2],a[3]]));
   }
  }
 }else if(visualType==='ceo'){
  for(const name of new Set(r.map(a=>a[0]))){const entries=r.filter(a=>a[0]===name);card(name,entries.map(a=>[a[1]+(a[2]?' · '+a[2]:''),a[3]]));}
 }else if(visualType==='management'){
  r.forEach(a=>card(a[0]+' · '+a[1],[['담당업무',a[2]],['학력',a[3]],['주요 이력',a[4]]]));
 }else if(visualType==='timeline'){
  const cardWidth=Math.max(f*12,240),stepWidth=cardWidth+g*2;
  width=Math.max(width,100+r.length*stepWidth);const start=50+stepWidth/2,axisY=f*4;
  draw('line',{x1:start,y1:axisY,x2:start+(r.length-1)*stepWidth,y2:axisY,stroke:'#bac7d8','stroke-width':4});
  r.forEach((row,i)=>{const cx=start+i*stepWidth,left=cx-cardWidth/2;
   draw('circle',{cx,cy:axisY,r:7,fill:'#fff',stroke:p.main,'stroke-width':4});
   text(row[0],left,0,cardWidth,f,p.main,800);
   let end=axisY+g*2;end+=text(row[1],left,end,cardWidth,f*1.1,p.ink,800)+g;
   if(state.showValues)end+=text(row[2]||'',left,end,cardWidth,f);y=Math.max(y,end+g);
  });
 }else if(['flow','causes','cycle'].includes(visualType)){
  steps(r);
 }else if(['org','team'].includes(visualType)){
  const layout=organizationLayout(r),nodeW=Math.max(f*12,...r.map(a=>Math.max(labelWidth(a[1],f*1.1),labelWidth(a[2],f)) +4*g)),nodeH=f*4+g*2,gap=g*2;
  const nodes=layout.nodes;
  for(const n of [...nodes].sort((a,b)=>b.level-a.level))n.span=Math.max(nodeW,n.children.reduce((s,ch)=>s+ch.span,0)+Math.max(0,n.children.length-1)*gap);
  const roots=nodes.filter(a=>a.level===0);const total=roots.reduce((s,n)=>s+n.span,0)+Math.max(0,roots.length-1)*gap;width=Math.max(width,total+100);
  const queue=[];let left=(width-total)/2;for(const root of roots){queue.push({n:root,left});left+=root.span+gap;}
  for(let i=0;i<queue.length;i++){const {n,left}=queue[i];n.x=left+n.span/2-nodeW/2;n.y=n.level*(nodeH+g*4);let childLeft=left+(n.span-n.children.reduce((s,ch)=>s+ch.span,0)-Math.max(0,n.children.length-1)*gap)/2;for(const ch of n.children){queue.push({n:ch,left:childLeft});childLeft+=ch.span+gap;}}
  for(const n of nodes)if(n.parent){const pnode=n.parent,x1=pnode.x+nodeW/2,y1=pnode.y+nodeH,x2=n.x+nodeW/2,y2=n.y;draw('path',{d:`M${x1} ${y1} V${(y1+y2)/2} H${x2} V${y2}`,stroke:'#98a8bf','stroke-width':2,fill:'none'});}
  for(const n of nodes){box(n.x,n.y,nodeW,nodeH,n.level===0?p.light:'#f7f9fc');text(n.name,n.x+g,n.y+g,nodeW-2*g,f*1.1,p.ink,800);if(state.showValues)text(n.detail,n.x+g,n.y+g+f*2,nodeW-2*g,f,p.main);y=Math.max(y,n.y+nodeH+g);}
 }else if(visualType==='relations'){
  r.forEach(a=>{
   const cw=(width-100)/3,heights=[pixelWrap(a[0],cw-3*g,f).length,pixelWrap(a[1],cw-3*g,f).length,pixelWrap(a[2]+(a[3]?'\n'+a[3]:''),cw-2*g,f).length],h=Math.max(...heights)*f*1.5+2*g;
   box(50,y,cw-g,h,p.light);box(50+2*cw+g,y,cw-g,h,p.light);
   text(a[0],50+g,y+g,cw-3*g,f,p.ink,700);text(a[1],50+2*cw+2*g,y+g,cw-3*g,f,p.ink,700);
   text(a[2]+(a[3]?'\n'+a[3]:''),50+cw+g,y,cw-2*g,f,p.main,700);arrow(50+cw,y+h-5,50+2*cw,y+h-5);
   y+=h+g;if(a[4])y+=text(a[4],50,y,width-100,f)+g;y+=g;
  });
 }else if(['line','multiline'].includes(visualType)){
  const data=visualType==='line'?r.map(a=>[a[0],'값',a[1]]):r;
  const periods=[...new Set(data.map(a=>a[0]))].sort((a,b)=>a.localeCompare(b,'ko',{numeric:true})),series=[...new Set(data.map(a=>a[1]))];
  width=Math.max(width,180+periods.length*Math.max(f*5,...periods.map(a=>labelWidth(a,f)+g)));
  const vals=data.map(a=>num(a[2])),min=Math.min(0,...vals),max=Math.max(0,...vals),range=max-min||1,plotH=Math.max(300,f*20),x0=120,x1=width-70;
  const xp=i=>x0+(x1-x0)*i/Math.max(1,periods.length-1),yp=v=>plotH-(v-min)/range*plotH;
  for(let i=0;i<=4;i++){const value=min+range*i/4,yy=yp(value);draw('line',{x1:x0,y1:yy,x2:x1,y2:yy,stroke:'#dce2ea'});draw('text',{x:x0-g,y:yy+f/3,'text-anchor':'end','font-size':f,fill:p.ink},fmt(value));}
  const colors=series.map((_,i)=>i===0?p.main:i===1?p.accent:`hsl(${i*137.508} 58% 40%)`);
  series.forEach((name,s)=>{
   const color=colors[s%colors.length];let previous=null;
   periods.forEach((period,i)=>{const entry=data.find(a=>a[0]===period&&a[1]===name);if(!entry){previous=null;return;}const xx=xp(i),yy=yp(num(entry[2]));if(previous)draw('line',{x1:previous[0],y1:previous[1],x2:xx,y2:yy,stroke:color,'stroke-width':3,'stroke-dasharray':s>=colors.length?'8 5':'none'});draw('circle',{cx:xx,cy:yy,r:4,fill:color});if(state.showValues)draw('text',{x:xx,y:yy-f*.65-(s%3)*f*1.2,'text-anchor':'middle','font-size':f,fill:color},fmt(num(entry[2])));previous=[xx,yy];});
  });
  periods.forEach((period,i)=>draw('text',{x:xp(i),y:plotH+f*2,'text-anchor':'middle','font-size':f,fill:p.ink},period));y=plotH+f*4;
  series.forEach((name,i)=>{draw('line',{x1:50,y1:y+f/2,x2:84,y2:y+f/2,stroke:colors[i%colors.length],'stroke-width':3,'stroke-dasharray':i>=colors.length?'8 5':'none'});y+=text(name,100,y,width-160,f)+g*.5;});
  if(visualType==='line'&&state.showValues)for(const a of r)if(a[2])y+=text(a[0]+' · '+a[2],50,y,width-100,f)+g*.5;
  if(visualType==='multiline'&&data.length<periods.length*series.length)y+=text('미기재 기간은 선을 연결하지 않았습니다.',50,y,width-100,f,'#69758a');
 }else if(visualType==='bar'){
  const vals=r.map(a=>num(a[1])),min=Math.min(0,...vals),max=Math.max(0,...vals),range=max-min||1,labelArea=Math.max(f*8,...r.map(a=>labelWidth(a[0],f)))+g;
  width=Math.max(width,labelArea+600);const left=50+labelArea,right=width-220,xx=v=>left+(v-min)/range*(right-left),zero=xx(0);
  for(const a of r){const h=f*3+g;draw('text',{x:left-g,y:y+f*1.8,'text-anchor':'end','font-size':f,fill:p.ink},a[0]);draw('line',{x1:zero,y1:y,x2:zero,y2:y+h,stroke:'#9aa7b9'});draw('rect',{x:Math.min(zero,xx(num(a[1]))),y:y+g/2,width:Math.abs(xx(num(a[1]))-zero),height:f*2,fill:num(a[1])<0?'#b45066':p.main,rx:3});if(state.showValues)text(fmt(num(a[1]))+(a[2]?' · '+a[2]:''),right+g,y+g/2,200-g,f);y+=Math.max(h,pixelWrap(a[2],190,f).length*f*1.5+f*2);}
 }else if(visualType==='donut'){
  const total=r.reduce((s,a)=>s+num(a[1]),0),radius=Math.min(180,(width-100)/3),cx=width/2,cy=radius+20;let start=-Math.PI/2;
  for(const [i,a] of r.entries()){const frac=num(a[1])/total,end=start+frac*Math.PI*2,color=`hsl(${210+i*137.508} 50% 48%)`;if(frac>=.999999)draw('circle',{cx,cy,r:radius,fill:color});else if(frac>0)draw('path',{d:`M${cx} ${cy} L${cx+radius*Math.cos(start)} ${cy+radius*Math.sin(start)} A${radius} ${radius} 0 ${frac>.5?1:0} 1 ${cx+radius*Math.cos(end)} ${cy+radius*Math.sin(end)} Z`,fill:color});start=end;}
  draw('circle',{cx,cy,r:radius*.63,fill:'#fff'});draw('text',{x:cx,y:cy,'text-anchor':'middle','font-size':f*1.3,fill:p.ink},'합계 '+fmt(total));y=cy+radius+g*2;
  r.forEach((a,i)=>{draw('rect',{x:50,y:y+4,width:f,height:f,fill:`hsl(${210+i*137.508} 50% 48%)`});y+=text(a[0]+(state.showValues?' · '+fmt(num(a[1]))+' ('+fmt(num(a[1])/total*100)+'%)':'')+(a[2]?' · '+a[2]:''),50+f+g,y,width-100-f-g,f)+g;});
 }else if(visualType==='waterfall'){
  let running=0;const items=r.map((a,i)=>{const val=num(a[1]),isTotal=i===0||i===r.length-1,start=isTotal?0:running,end=isTotal?val:running+val;running=end;return {a,start,end,isTotal};});
  const min=Math.min(0,...items.flatMap(a=>[a.start,a.end])),max=Math.max(0,...items.flatMap(a=>[a.start,a.end])),range=max-min||1;
  width=Math.max(width,100+r.length*(f*8+g));const cw=(width-100)/r.length,h=f*20,yp=v=>h-(v-min)/range*h;
  items.forEach((d,i)=>{const x=50+i*cw;draw('rect',{x:x+g/2,y:Math.min(yp(d.start),yp(d.end)),width:cw-g,height:Math.abs(yp(d.end)-yp(d.start)),fill:d.isTotal?p.dark:d.end<d.start?'#b45066':p.main});if(state.showValues)text(fmt(num(d.a[1])),x+g/2,Math.min(yp(d.start),yp(d.end))-f*2,cw-g,f,p.ink,700);text(d.a[0],x+g/2,h+g,cw-g,f);if(i<items.length-1)draw('line',{x1:x+cw-g/2,y1:yp(d.end),x2:x+cw+g/2,y2:yp(d.end),stroke:'#9aa7b9','stroke-dasharray':'4 4'});});
  y=h+g+Math.max(...r.map(a=>pixelWrap(a[0],cw-g,f).length))*f*1.5;
 }
 // Body starts after a fully wrapped title/subtitle; data rows never consume the footer.
 const titleHeight=pixelWrap(state.title||'제목',width-100,f*1.75).length*f*2.625,subHeight=state.subtitle?pixelWrap(state.subtitle,width-100,f).length*f*1.5:0,top=50+titleHeight+subHeight+g*2+f*5;
 const footerHeight=pixelWrap('자료: '+(state.source||'미기재'),width-100,f*.85).length*f*1.275+f*2+g;
 const ratio={'16:9':9/16,'3:2':2/3,'4:3':3/4,'1:1':1}[state.ratio]||9/16;
 const height=Math.max(width*ratio,top+y+footerHeight+40);
 return {commands,photos,width:Math.ceil(width),height:Math.ceil(height),top,titleHeight,subHeight,footerHeight,font:f,gap:g};
}
function currentPlan(){const key=JSON.stringify(state);if(planCache?.key===key)return planCache.plan;const plan=createPlan();planCache={key,plan};return plan;}
adaptiveDimensions=function(){if(validateData(state.type,rows()))return [state.layoutWidth||1200,675];const p=currentPlan();return [p.width,p.height];};
render=function(){
 if(activeViewType!==state.type){fullSize=reportBaseType(state.type)==='timeline';activeViewType=state.type;$('#viewSizeBtn').textContent=fullSize?'전체 보기':'실제 크기';}
 if(reportBaseType(state.type)==='product'){
  const names=[...new Set(rows().map(a=>a[0]))],key=JSON.stringify(names);
  if(key!==lastPhotoNames){const selected=$('#photoProduct').value;$('#photoProduct').innerHTML='';for(const name of names){const option=document.createElement('option');option.value=name;option.textContent=name;$('#photoProduct').appendChild(option);}if(names.includes(selected))$('#photoProduct').value=selected;lastPhotoNames=key;}
 }
 const error=validateData(state.type,rows());$('#dataError').textContent=error;$('#rowCount').textContent=rows().length+'개 항목';['pngBtn','svgBtn','copyBtn'].forEach(id=>$('#'+id).disabled=!!error);
 svg.innerHTML='';photoRegions=[];
 if(error){svg.setAttribute('viewBox','0 0 1200 675');add('text',{x:80,y:160,'font-size':24,fill:'#a32a35'},'입력 내용을 확인해주세요');}
 else{
  const plan=currentPlan(),p=palettes[state.theme],f=plan.font;
  svg.setAttribute('viewBox',`0 0 ${plan.width} ${plan.height}`);
  if(!state.transparent)add('rect',{width:plan.width,height:plan.height,fill:'#fff'});
  const lines=(value,x,y,width,size,color,weight=400)=>{pixelWrap(value,width,size).forEach((line,i)=>add('text',{x,y:y+size+i*size*1.5,'font-size':size,fill:color,'font-weight':weight},line));};
  add('rect',{x:30,y:46,width:6,height:plan.titleHeight,fill:p.accent,rx:3});
  lines(state.title||'제목',50,40,plan.width-100,f*1.75,p.ink,800);
  if(state.subtitle)lines(state.subtitle,50,40+plan.titleHeight,plan.width-100,f,'#657187');
  add('line',{x1:50,y1:plan.top-f*5,x2:plan.width-50,y2:plan.top-f*5,stroke:'#dce2ea'});
  const group=add('g',{transform:`translate(0 ${plan.top})`});for(const command of plan.commands)add(command.tag,command.attrs,command.text,group);
  photoRegions=plan.photos.map(a=>({...a,y:a.y+plan.top}));
  lines('단위: '+(state.unit||'해당 없음'),50,plan.height-plan.footerHeight,plan.width-100,f*.85,'#657187');
  lines('자료: '+(state.source||'미기재'),50,plan.height-plan.footerHeight+f*1.7,plan.width-100,f*.85,'#657187');
  canvas.style.aspectRatio=plan.width+'/'+plan.height;canvas.style.width=fullSize?plan.width+'px':'max(100%, '+Math.min(plan.width,1000)+'px)';canvas.style.maxWidth='none';
  const pt=f*(state.printWidth||16)*72/(2.54*plan.width);
  $('#printHint').textContent='워드에서 가로 '+state.printWidth+'cm로 넣으면 본문 약 '+pt.toFixed(1)+'pt · 글자가 작으면 가로폭을 줄이거나 본문 글자를 키우세요. PNG·SVG에 지정한 삽입 폭을 반영합니다.';
 }
 try{localStorage.setItem('reportVisualStudio',JSON.stringify(state));$('#statusText').textContent=error?'입력 확인 필요':'초안 자동 저장됨';}catch{$('#statusText').textContent='초안 저장 공간 부족 · 보관함에 저장해주세요';}
};
for(const key of ['displayMode','layoutWidth','fontSize','spacing','printWidth'])$('#'+key).onchange=()=>{Object.assign(state,extras({...state,[key]:$('#'+key).value}));syncControls();render();};
const originalBuild=buildTemplates;
buildTemplates=function(){originalBuild();document.querySelectorAll('.template').forEach(button=>{const click=button.onclick;button.onclick=()=>{state.images=[];state.displayMode='native';annotationMode=null;click();if(state.type==='multiline')state.unit='원/kg';if(state.type==='financial')state.unit='지표별 표기';syncControls();render();};});};
const oldSVG=svgString;
svgString=function(){return oldSVG().replace(/(<svg\b[^>]*\bwidth=")[^"]*"/,'$1'+state.printWidth+'cm"').replace(/(<svg\b[^>]*\bheight=")[^"]*"/,'$1'+(state.printWidth*dims()[1]/dims()[0])+'cm"');};
const originalPNG=pngBlob;
pngBlob=async function(){
 const bytes=new Uint8Array(await (await originalPNG()).arrayBuffer()),view=new DataView(bytes.buffer),pixels=view.getUint32(16),ppm=Math.round(pixels/((state.printWidth||16)/100));
 const chunk=new Uint8Array(21),cv=new DataView(chunk.buffer);cv.setUint32(0,9);chunk.set([112,72,89,115],4);cv.setUint32(8,ppm);cv.setUint32(12,ppm);chunk[16]=1;
 let crc=0xffffffff;for(const b of chunk.slice(4,17)){crc^=b;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}cv.setUint32(17,(crc^0xffffffff)>>>0);
 const parts=[bytes.slice(0,33),chunk];let offset=33;while(offset<bytes.length){const length=view.getUint32(offset)+12;const tag=String.fromCharCode(...bytes.slice(offset+4,offset+8));if(tag!=='pHYs')parts.push(bytes.slice(offset,offset+length));offset+=length;}return new Blob(parts,{type:'image/png'});
};

// Photos remain embedded in downloadable work files and exports.
function fileData(file){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=()=>reject(Error('사진을 읽지 못했습니다.'));rd.readAsDataURL(file);});}
$('#photoInput').onchange=async event=>{
 const file=event.target.files[0],product=$('#photoProduct').value,photoState=state;if(!file||!product)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('PNG·JPG·WebP 사진을 선택해주세요.');return;}
 try{const src=await fileData(file),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});if(state!==photoState)return;state.images=(state.images||[]).filter(a=>a.product!==product);state.images.push({product,src,width:img.naturalWidth,height:img.naturalHeight,annotations:[]});state.displayMode='native';syncControls();render();toast('사진을 넣었습니다. 위치 표시나 화살표를 추가할 수 있습니다.');}catch{toast('사진을 읽지 못했습니다. 다른 이미지 파일을 선택해주세요.');}event.target.value='';
};
for(const [id,kind] of [['addAnnotation','mark'],['addArrow','arrow']])$('#'+id).onclick=()=>{const product=$('#photoProduct').value;if(!(state.images||[]).some(a=>a.product===product)){toast('먼저 제품 사진을 넣어주세요.');return;}annotationMode={product,kind,label:$('#annotationText').value.trim(),start:null};$('#photoHint').textContent=kind==='arrow'?'사진에서 시작점과 끝점을 차례로 클릭하세요.':'사진에서 표시할 위치를 클릭하세요.';state.displayMode='native';syncControls();render();};
svg.addEventListener('click',event=>{
 if(!annotationMode)return;const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const local=point.matrixTransform(svg.getScreenCTM().inverse());const region=photoRegions.find(a=>a.product===annotationMode.product&&local.x>=a.x&&local.x<=a.x+a.width&&local.y>=a.y&&local.y<=a.y+a.height);if(!region)return;
 const pos={x:(local.x-region.x)/region.width,y:(local.y-region.y)/region.height};
 if(annotationMode.kind==='arrow'&&!annotationMode.start){annotationMode.start=pos;$('#photoHint').textContent='이제 화살표의 끝점을 클릭하세요.';return;}
 const photo=state.images.find(a=>a.product===annotationMode.product);photo.annotations.push({kind:annotationMode.kind,label:annotationMode.label,...(annotationMode.start||pos),...(annotationMode.start?{x2:pos.x,y2:pos.y}:{})});annotationMode=null;$('#photoHint').textContent='주석을 넣었습니다. 추가하거나 마지막 주석을 취소할 수 있습니다.';render();
});
$('#undoAnnotation').onclick=()=>{state.images.find(a=>a.product===$('#photoProduct').value)?.annotations.pop();annotationMode=null;render();};
$('#removePhoto').onclick=()=>{state.images=state.images.filter(a=>a.product!==$('#photoProduct').value);annotationMode=null;render();};

// Authoritative company collections live in the Site's database.
let savedItems=[],activeAsset=null;
async function api(path,options={}){const res=await fetch(path,{...options,headers:{...(options.body&&typeof options.body==='string'?{'content-type':'application/json'}:{}),...options.headers}});const data=await res.json();if(!res.ok)throw Error(data.error||'요청을 완료하지 못했습니다.');return data;}
async function refreshShelf(){try{$('#shelfStatus').textContent='보관함을 불러오는 중…';savedItems=(await api('/api/assets')).items;showShelf();$('#shelfStatus').textContent=savedItems.length+'개 결과물 · 회사명과 결과물 이름을 눌러 열 수 있습니다.';}catch(e){$('#shelfStatus').textContent=e.message;}}
function showShelf(){
 const list=$('#savedAssets');list.innerHTML='';const filter=$('#companyFilter').value.trim().toLowerCase();
 for(const item of savedItems.filter(a=>a.company.toLowerCase().includes(filter))){
  const row=document.createElement('div');row.className='saved-item';const title=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=item.company+' · '+item.name;small.textContent=new Date(item.updated).toLocaleString('ko-KR');title.appendChild(strong);title.appendChild(small);row.appendChild(title);
  const open=document.createElement('button');open.className='btn';open.textContent='열기';open.onclick=async()=>{try{$('#shelfStatus').textContent='결과물과 사진을 불러오는 중…';const data=await api('/api/assets/'+item.id),payload=data.payload;
   payload.images=await Promise.all((payload.images||[]).map(async photo=>{if(photo.id&&!photo.src){const res=await fetch('/api/photos/'+photo.id);if(!res.ok)throw Error('사진을 불러오지 못했습니다. 다시 시도해주세요.');photo.src=await fileData(await res.blob());}return photo;}));
   const candidate=normalizeAnswer(payload,true);state=candidate;activeAsset=item.id;$('#companyName').value=item.company;$('#assetName').value=item.name;$('#updateAsset').disabled=false;syncControls();render();$('#shelfDialog').close();toast('결과물을 열었습니다.');
  }catch(e){$('#shelfStatus').textContent=e.message;}};row.appendChild(open);
  const remove=document.createElement('button');remove.className='btn';remove.textContent='삭제';let armed=false;remove.onclick=async()=>{if(!armed){armed=true;remove.textContent='정말 삭제';return;}try{await api('/api/assets/'+item.id,{method:'DELETE'});if(activeAsset===item.id){activeAsset=null;$('#updateAsset').disabled=true;}await refreshShelf();}catch(e){$('#shelfStatus').textContent=e.message;}};row.appendChild(remove);list.appendChild(row);
 }if(!list.children.length){const empty=document.createElement('p');empty.textContent='저장된 결과물이 없습니다. 위에서 현재 결과물을 보관하세요.';list.appendChild(empty);}
}
async function saveAsset(update){
 const company=$('#companyName').value.trim(),name=$('#assetName').value.trim();if(!company||!name){$('#shelfStatus').textContent='회사명과 결과물 이름을 입력해주세요.';return;}
 const error=validateData(state.type,rows());if(error){$('#shelfStatus').textContent=error;return;}
 const payload=JSON.parse(JSON.stringify(state)),id=update&&activeAsset?activeAsset:crypto.randomUUID();
 $('#saveNewAsset').disabled=true;$('#updateAsset').disabled=true;
 try{$('#shelfStatus').textContent='결과물을 보관하는 중…';
  payload.images=await Promise.all((payload.images||[]).map(async photo=>{if(!photo.id){const blob=await (await fetch(photo.src)).blob();photo.id=(await api('/api/photos',{method:'POST',headers:{'content-type':blob.type},body:blob})).id;const current=state.images.find(a=>a.product===photo.product&&a.src===photo.src);if(current)current.id=photo.id;}delete photo.src;return photo;}));
  await api('/api/assets/'+id,{method:'PUT',body:JSON.stringify({company,name,payload})});activeAsset=id;await refreshShelf();$('#shelfStatus').textContent='보관했습니다. 편집 후에는 업데이트를 눌러 변경 내용을 저장하세요.';
 }catch(e){$('#shelfStatus').textContent=e.message;}finally{$('#saveNewAsset').disabled=false;$('#updateAsset').disabled=!activeAsset;}
}
$('#shelfBtn').onclick=()=>{if(!$('#assetName').value)$('#assetName').value=state.title;$('#shelfDialog').showModal();refreshShelf();};
$('#closeShelf').onclick=()=>$('#shelfDialog').close();$('#companyFilter').oninput=showShelf;$('#saveNewAsset').onclick=()=>saveAsset(false);$('#updateAsset').onclick=()=>saveAsset(true);
buildTemplates();syncControls();render();
