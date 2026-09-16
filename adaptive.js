'use strict';

// Canvas grows with the data. No row, sibling or depth maximum.
function labelWidth(value,size=16){
  return Array.from(String(value||'')).reduce((sum,ch)=>sum+(/[ -~]/.test(ch)?size*.62:size),0);
}
function maxWidth(values,size=16){return values.reduce((w,v)=>Math.max(w,labelWidth(v,size)),0);}
function organizationLayout(r){
  const nodes=r.map((row,i)=>({id:i,level:parseNumber(row[0]),name:row[1],detail:row[2]||'',parentName:row[3]||'',children:[],span:0,x:0,y:0}));
  const byName=new Map(nodes.map(n=>[n.name,n])),byLevel=new Map();
  for(const n of nodes){if(!byLevel.has(n.level))byLevel.set(n.level,[]);byLevel.get(n.level).push(n);}
  for(const n of nodes){
    if(n.level===0)continue;
    const candidates=byLevel.get(n.level-1)||[];
    n.parent=n.parentName?byName.get(n.parentName):candidates[0];
    if(n.parent)n.parent.children.push(n);
  }
  const nodeWidth=Math.max(220,maxWidth(nodes.map(n=>n.name),16)+44,maxWidth(nodes.map(n=>n.detail),12)+40),gap=36;
  const sorted=[...nodes].sort((a,b)=>b.level-a.level);
  for(const n of sorted)n.span=Math.max(nodeWidth,n.children.reduce((sum,ch)=>sum+ch.span,0)+Math.max(0,n.children.length-1)*gap);
  const roots=nodes.filter(n=>n.level===0),width=roots.reduce((sum,n)=>sum+n.span,0)+Math.max(0,roots.length-1)*gap;
  const queue=[];let left=0;
  for(const root of roots){queue.push({node:root,left});left+=root.span+gap;}
  for(let i=0;i<queue.length;i++){
    const {node,left}=queue[i];
    node.x=left+node.span/2-nodeWidth/2;node.y=node.level*154;
    let childLeft=left+(node.span-(node.children.reduce((sum,ch)=>sum+ch.span,0)+Math.max(0,node.children.length-1)*gap))/2;
    for(const child of node.children){queue.push({node:child,left:childLeft});childLeft+=child.span+gap;}
  }
  const depth=nodes.reduce((m,n)=>Math.max(m,n.level),0);
  return {nodes,nodeWidth,width,height:depth*154+86};
}
let sizeCache=null;
function adaptiveDimensions(){
  const key=state.type+'\0'+state.ratio+'\0'+state.data;
  if(sizeCache?.key===key)return sizeCache.dims;
  const presets={'16:9':[1200,675],'3:2':[1200,800],'4:3':[1200,900],'1:1':[900,900]};
  let [w,h]=presets[state.ratio]||presets['16:9'];const r=parseRows(state.data),n=r.length;
  if(!validateData(state.type,r)){
    switch(state.type){
      case 'org':{const layout=organizationLayout(r);w=Math.max(w,layout.width+132);h=Math.max(h,layout.height+240);break;}
      case 'bar':w=Math.max(w,600+maxWidth(r.map(x=>x[0]),14)+maxWidth(r.map(x=>x[2]),11));h=Math.max(h,230+n*58);break;
      case 'line':w=Math.max(w,180+n*Math.max(84,maxWidth(r.map(x=>x[0]),13)+28,maxWidth(r.map(x=>x[2]),10)+20));break;
      case 'waterfall':w=Math.max(w,132+n*Math.max(140,maxWidth(r.map(x=>x[0]),12)+28));break;
      case 'donut':w=Math.max(w,700+maxWidth(r.map(x=>x[0]),15)+100,maxWidth(r.map(x=>x[2]),12)+850);h=Math.max(h,225+n*58);break;
      case 'flow':w=Math.max(w,132+n*236+(n-1)*24);h=Math.max(h,300+maxLines(r.map(x=>x[1]),10)*25+maxLines(r.map(x=>x[2]),16)*19);break;
      case 'timeline':w=Math.max(w,312+Math.max(0,n-1)*Math.max(190,maxWidth(r.map(x=>x[1]),15)+28));h=Math.max(h,440+maxLines(r.map(x=>x[2]),13)*17);break;
      case 'matrix':{
        const counts=new Map();r.forEach(row=>{const k=row[1]+','+row[2];counts.set(k,(counts.get(k)||0)+1);});
        const crowd=Array.from(counts.values()).reduce((a,b)=>Math.max(a,b),0);
        const side=Math.max(385,Math.ceil(Math.sqrt(crowd*42*18))*5);
        w=Math.max(w,side+maxWidth(r.map(x=>x[0]),12)+280);
        h=Math.max(h,250+n*58,side+290);break;
      }
    }
  }
  sizeCache={key,dims:[Math.ceil(w),Math.ceil(h)]};return sizeCache.dims;
}
function maxLines(values,count){return values.reduce((m,v)=>Math.max(m,wrap(v,count).length),1);}

renderers.org=function(c,r){
  const layout=organizationLayout(r),offset=(c.w-layout.width)/2,top=c.top+20;
  for(const n of layout.nodes){
    if(!n.parent)continue;
    const p=n.parent,x1=offset+p.x+layout.nodeWidth/2,y1=top+p.y+86,x2=offset+n.x+layout.nodeWidth/2,y2=top+n.y,mid=(y1+y2)/2;
    add('path',{d:'M'+x1+' '+y1+' V'+mid+' H'+x2+' V'+y2,fill:'none',stroke:'#aab5c5','stroke-width':2});
  }
  for(const n of layout.nodes){
    const x=offset+n.x,y=top+n.y;
    add('rect',{x,y,width:layout.nodeWidth,height:86,rx:12,fill:n.level===0?c.p.dark:c.p.light});
    add('text',{x:x+layout.nodeWidth/2,y:y+33,'text-anchor':'middle','font-size':16,'font-weight':800,fill:n.level===0?'#fff':c.p.ink},n.name);
    if(state.showValues)add('text',{x:x+layout.nodeWidth/2,y:y+60,'text-anchor':'middle','font-size':12,fill:n.level===0?'#dce8f7':c.p.main},n.detail);
  }
};
renderers.bar=function(c,r){
  const values=r.map(x=>num(x[1])),min=values.reduce((a,b)=>Math.min(a,b),0),max=values.reduce((a,b)=>Math.max(a,b),0);
  const labelArea=Math.max(155,maxWidth(r.map(x=>x[0]),14)+22),noteArea=Math.max(90,maxWidth(r.map(x=>x[2]),11)+18);
  const x0=c.left+labelArea,x1=c.right-noteArea-120,range=max-min||1,x=v=>x0+(v-min)/range*(x1-x0),zero=x(0),rh=(c.bottom-c.top-28)/r.length;
  add('line',{x1:zero,y1:c.top,x2:zero,y2:c.bottom-24,stroke:'#aeb8c7'});
  r.forEach((row,i)=>{
    const value=values[i],y=c.top+i*rh+rh*.18,height=rh*.5,endpoint=x(value);
    add('text',{x:x0-16,y:y+height*.68,'text-anchor':'end','font-size':14,'font-weight':700,fill:c.p.ink},row[0]);
    add('rect',{x:Math.min(zero,endpoint),y,width:Math.abs(endpoint-zero),height,rx:4,fill:value<0?'#c65c61':c.p.main});
    if(state.showValues){add('text',{x:c.right-noteArea,y:y+height*.68,'text-anchor':'end','font-size':14,'font-weight':800,fill:c.p.ink},fmt(value));if(row[2])add('text',{x:c.right,y:y+height*.68,'text-anchor':'end','font-size':11,fill:c.p.main},row[2]);}
  });
};
renderers.flow=function(c,r){
  const gap=24,w=(c.right-c.left-gap*(r.length-1))/r.length;
  const titleLines=maxLines(r.map(x=>x[1]),10),detailLines=maxLines(r.map(x=>x[2]),16);
  const height=100+titleLines*25+(state.showValues?detailLines*19:0),y=c.top+24;
  r.forEach((row,i)=>{
    const x=c.left+i*(w+gap),last=i===r.length-1;
    add('rect',{x,y,width:w,height,rx:14,fill:last?c.p.dark:'#f6f8fb',stroke:'#dce2ea'});
    add('text',{x:x+20,y:y+30,'font-size':12,'font-weight':800,fill:last?'#dbe7fa':c.p.main},row[0]);
    textLines(x+20,y+64,wrap(row[1],10),{'font-size':18,'font-weight':800,fill:last?'#fff':c.p.ink},25);
    if(state.showValues)textLines(x+20,y+80+titleLines*25,wrap(row[2],16),{'font-size':12,fill:last?'#c9d6e8':'#718096'},19);
    if(!last)add('path',{d:'M'+(x+w+4)+' '+(y+height/2)+' h16 m-6 -5 l6 5 l-6 5',stroke:c.p.accent,'stroke-width':3,fill:'none'});
  });
};
renderers.timeline=function(c,r){
  const y=c.top+110,span=c.right-c.left-180,x0=c.left+90;
  add('line',{x1:x0,y1:y,x2:x0+span,y2:y,stroke:'#cfd6e1','stroke-width':4});
  r.forEach((row,i)=>{
    const x=x0+span*i/Math.max(r.length-1,1);
    add('circle',{cx:x,cy:y,r:9,fill:'#fff',stroke:c.p.main,'stroke-width':4});
    add('text',{x,y:y-27,'text-anchor':'middle','font-size':12,'font-weight':800,fill:c.p.main},row[0]);
    add('text',{x,y:y+41,'text-anchor':'middle','font-size':15,'font-weight':800,fill:c.p.ink},row[1]);
    if(state.showValues)textLines(x,y+69,wrap(row[2],13),{'text-anchor':'middle','font-size':12,fill:'#748095'},17);
  });
};
renderers.matrix=function(c,r){
  const cells=new Map();r.forEach((row,i)=>{const key=Number(row[1])+','+Number(row[2]);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i+1);});
  const crowd=Array.from(cells.values()).reduce((a,b)=>Math.max(a,b.length),0);
  const size=Math.max(385,Math.ceil(Math.sqrt(crowd*42*18))*5),cell=size/5,x0=c.left+65,y0=c.top+8;
  for(let iy=0;iy<5;iy++)for(let ix=0;ix<5;ix++){
    const score=(5-iy)*(ix+1);
    add('rect',{x:x0+ix*cell,y:y0+iy*cell,width:cell-2,height:cell-2,rx:5,fill:score>=16?'#f4c7c9':score>=9?'#f5dfae':'#d7eadf'});
  }
  for(let i=0;i<5;i++){
    add('text',{x:x0+i*cell+cell/2,y:y0+size+22,'text-anchor':'middle','font-size':12,fill:c.p.ink},i+1);
    add('text',{x:x0-15,y:y0+(4-i)*cell+cell/2+4,'text-anchor':'middle','font-size':12,fill:c.p.ink},i+1);
  }
  add('text',{x:x0+size/2,y:y0+size+44,'text-anchor':'middle','font-size':13,fill:c.p.ink},'발생 가능성 →');
  add('text',{x:x0-48,y:y0+size/2,transform:'rotate(-90 '+(x0-48)+' '+(y0+size/2)+')','text-anchor':'middle','font-size':13,fill:c.p.ink},'영향도 →');
  for(const [key,ids] of cells){
    const [prob,impact]=key.split(',').map(Number),cx=x0+(prob-.5)*cell,cy=y0+(5-impact+.5)*cell;
    const lines=wrap(ids.join('·'),Math.max(8,Math.floor(cell*.8/8))),height=lines.length*16+12;
    add('rect',{x:cx-cell*.46,y:cy-height/2,width:cell*.92,height,rx:12,fill:c.p.dark});
    textLines(cx,cy-height/2+19,lines,{'text-anchor':'middle','font-size':12,'font-weight':800,fill:'#fff'},16);
  }
  r.forEach((row,i)=>{
    const lx=x0+size+35,y=y0+18+i*58;
    add('circle',{cx:lx,cy:y,r:14,fill:c.p.dark});
    add('text',{x:lx,y:y+4,'text-anchor':'middle','font-size':10,fill:'#fff'},i+1);
    add('text',{x:lx+24,y:y-2,'font-size':12,'font-weight':700,fill:c.p.ink},row[0]);
    if(state.showValues)add('text',{x:lx+24,y:y+20,'font-size':11,fill:'#657187'},'가능성 '+row[1]+' / 영향도 '+row[2]);
  });
};

let fullSize=false;
const priorRender=render;
render=function(){
  priorRender();
  canvas.style.width=fullSize?dims()[0]+'px':'min(100%, 1100px)';
  canvas.style.maxWidth='none';
};
$('#viewSizeBtn').onclick=()=>{
  fullSize=!fullSize;$('#viewSizeBtn').textContent=fullSize?'전체 보기':'실제 크기';render();
};
installReports();
