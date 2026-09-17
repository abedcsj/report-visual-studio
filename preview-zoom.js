'use strict';
// Preview-only scaling. SVG viewBox and export dimensions are never modified.
(()=>{
 const viewport=document.querySelector('.canvas-wrap');
 const toolbar=document.createElement('div');toolbar.className='preview-zoom';
 toolbar.innerHTML='<button class="btn" id="zoomOut" aria-label="미리보기 축소">−</button><input id="previewZoomPercent" type="number" min="0.1" max="800" step="1" value="100" aria-label="미리보기 배율 퍼센트"><span>%</span><button class="btn" id="zoomIn" aria-label="미리보기 확대">+</button><button class="btn" id="zoomActual">100%</button><span class="zoom-help">두 손가락으로 오므려 축소 · 벌려 확대</span>';
 document.querySelector('.stage-toolbar').appendChild(toolbar);
 const percent=document.getElementById('previewZoomPercent'),fitButton=document.getElementById('viewSizeBtn');
 fitButton.textContent='화면에 맞춤';fitButton.title='도표 전체가 미리보기 안에 들어오도록 축소합니다.';
 viewport.setAttribute('aria-label','도표 미리보기. 두 손가락으로 확대·축소하거나 배율을 입력할 수 있습니다.');
 let scale=1,fit=true,lastChart='',pinch=null,safariScale=1;
 function size(){const v=svg.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);return v?.length===4&&v[2]>0&&v[3]>0?{w:v[2],h:v[3]}:null;}
 function apply(next,anchor){
  const dimensions=size();if(!dimensions||canvas.hidden)return;
  const before=canvas.getBoundingClientRect();
  const point=anchor||{x:viewport.getBoundingClientRect().left+viewport.clientWidth/2,y:viewport.getBoundingClientRect().top+viewport.clientHeight/2};
  const rx=before.width?(point.x-before.left)/before.width:0,ry=before.height?(point.y-before.top)/before.height:0;
  scale=Math.max(.001,Math.min(8,next));
  canvas.style.width=dimensions.w*scale+'px';canvas.style.height=dimensions.h*scale+'px';canvas.style.maxWidth='none';canvas.style.flexShrink='0';
  percent.value=String(Math.round(scale*1000)/10);
  fitButton.textContent='화면에 맞춤';
  if(fit){viewport.scrollLeft=0;viewport.scrollTop=0;}
  else{const after=canvas.getBoundingClientRect();viewport.scrollLeft+=after.left+rx*after.width-point.x;viewport.scrollTop+=after.top+ry*after.height-point.y;}
 }
 function refresh(){
  const d=size();if(!d||canvas.hidden)return;
  if(fit){const css=getComputedStyle(viewport);const w=viewport.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-2,h=viewport.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom)-2;if(w>0&&h>0)apply(Math.min(1,w/d.w,h/d.h));}
  else apply(scale);
 }
 function zoom(next,anchor){fit=false;apply(next,anchor);}
 fitButton.onclick=()=>{fit=true;refresh();};
 document.getElementById('zoomOut').onclick=()=>zoom(scale/1.2);
 document.getElementById('zoomIn').onclick=()=>zoom(scale*1.2);
 document.getElementById('zoomActual').onclick=()=>zoom(1);
 percent.onchange=()=>{const value=Number(percent.value);if(Number.isFinite(value)&&value>0)zoom(value/100);else percent.value=String(Math.round(scale*1000)/10);};
 // Chrome/Edge/Firefox trackpads expose pinch gestures as ctrl+wheel.
 viewport.addEventListener('wheel',event=>{if(!event.ctrlKey||canvas.hidden)return;event.preventDefault();zoom(scale*Math.exp(-event.deltaY*.01),{x:event.clientX,y:event.clientY});},{passive:false});
 function touchPair(touches){const a=touches[0],b=touches[1];return {distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
 viewport.addEventListener('touchstart',event=>{if(event.touches.length===2&&!canvas.hidden){event.preventDefault();pinch={...touchPair(event.touches),scale};}},{passive:false});
 viewport.addEventListener('touchmove',event=>{if(event.touches.length===2&&pinch){event.preventDefault();const pair=touchPair(event.touches);if(pinch.distance>0)zoom(pinch.scale*pair.distance/pinch.distance,pair);}},{passive:false});
 for(const event of ['touchend','touchcancel'])viewport.addEventListener(event,()=>{pinch=null;},{passive:true});
 // Safari on macOS uses gesture events for trackpad pinch.
 viewport.addEventListener('gesturestart',event=>{if(canvas.hidden||pinch)return;event.preventDefault();safariScale=scale;},{passive:false});
 viewport.addEventListener('gesturechange',event=>{if(canvas.hidden||pinch)return;event.preventDefault();if(Number.isFinite(event.scale))zoom(safariScale*event.scale);},{passive:false});
 viewport.addEventListener('gestureend',event=>event.preventDefault(),{passive:false});
 const previousRender=render;
 render=function(){previousRender();const id=(typeof projectChartId==='string'?projectChartId:'')+':'+state.type;if(id!==lastChart){lastChart=id;fit=true;}refresh();};
 new ResizeObserver(()=>refresh()).observe(viewport);
 refresh();
})();
