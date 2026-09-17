'use strict';
window.reportParagraphModel={
 ensure(s){
  const text=typeof s.notes==='string'?s.notes:'';
  if(!Array.isArray(s.paragraphs)||!s.paragraphs.length)s.paragraphs=text.split(/\n\s*\n/).map(text=>({id:crypto.randomUUID(),text}));
  else if(s.paragraphs.map(p=>p.text).join('\n\n')!==text){const parts=text.split(/\n\s*\n/),old=s.paragraphs;s.paragraphs=parts.map((text,i)=>({id:old[i]?.id||crypto.randomUUID(),text}));}
  for(const chart of s.charts){chart.report??={};if(!s.paragraphs.some(p=>p.id===chart.report.paragraphId)){const index=Number.isInteger(chart.report.position)?Math.max(0,Math.min(s.paragraphs.length-1,chart.report.position-1)):chart.report.position==='start'?0:s.paragraphs.length-1;chart.report.paragraphId=s.paragraphs[index].id;}delete chart.report.hidden;}
  return s.paragraphs;
 },
 sync(s){s.notes=s.paragraphs.map(p=>p.text).join('\n\n');},
 moveParagraph(s,id,delta){const ps=this.ensure(s),i=ps.findIndex(p=>p.id===id),j=i+delta;if(i<0||j<0||j>=ps.length)return false;[ps[i],ps[j]]=[ps[j],ps[i]];this.sync(s);return true;},
 moveChart(s,id,delta){const ps=this.ensure(s),chart=s.charts.find(c=>c.id===id);if(!chart)return false;const peers=s.charts.filter(c=>c.report.paragraphId===chart.report.paragraphId),i=peers.indexOf(chart),other=peers[i+delta];if(other){const a=s.charts.indexOf(chart),b=s.charts.indexOf(other);[s.charts[a],s.charts[b]]=[s.charts[b],s.charts[a]];return true;}const p=ps.findIndex(p=>p.id===chart.report.paragraphId),target=ps[p+delta];if(!target)return false;chart.report.paragraphId=target.id;s.charts=s.charts.filter(c=>c!==chart);if(delta<0)s.charts.push(chart);else{const at=s.charts.findIndex(c=>c.report.paragraphId===target.id);s.charts.splice(at<0?s.charts.length:at,0,chart);}return true;}
};
