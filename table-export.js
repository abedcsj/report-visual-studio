'use strict';
(()=>{
 const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const unique=values=>[...new Set(values)];
 function currentTable(input=state){
  const raw=parseRows(input.data),type=reportBaseType(input.type),custom=columnNames[input.type]||columnNames[type]||[];
  if(type==='financial'){
   const periods=unique(raw.map(row=>row[1])).sort((a,b)=>a.localeCompare(b,'ko',{numeric:true}));
   const metrics=unique(raw.map(row=>row[0]));
   return {headers:['지표',...periods],body:metrics.map(metric=>{
    const entries=raw.filter(row=>row[0]===metric),unit=entries.find(row=>row[3])?.[3]||'';
    return [metric+(unit?' ('+unit+')':''),...periods.map(period=>entries.find(row=>row[1]===period)?.[2]||'—')];
   })};
  }
  if(type==='comparison'){
   const companies=unique(raw.map(row=>row[0])),fields=unique(raw.map(row=>row[1]));
   return {headers:['비교항목',...companies],body:fields.map(field=>[field,...companies.map(company=>raw.find(row=>row[0]===company&&row[1]===field)?.[2]||'—')])};
  }
  if(type==='multiline'){
   const periods=unique(raw.map(row=>row[0])).sort((a,b)=>a.localeCompare(b,'ko',{numeric:true})),series=unique(raw.map(row=>row[1]));
   return {headers:['기간',...series],body:periods.map(period=>[period,...series.map(name=>raw.find(row=>row[0]===period&&row[1]===name)?.[2]||'—')])};
  }
  if(type==='donut'){
   const total=raw.reduce((sum,row)=>sum+(Number.isFinite(num(row[1]))?num(row[1]):0),0);
   return {headers:[custom[0]||'항목',custom[1]||'값','비중',custom[2]||'설명'],body:raw.map(row=>[row[0],row[1],total?((num(row[1])/total)*100).toFixed(1)+'%':'—',row[2]||'—'])};
  }
  const width=Math.max(custom.length,...raw.map(row=>row.length));
  return {headers:Array.from({length:width},(_,i)=>custom[i]||'항목 '+(i+1)),body:raw.map(row=>Array.from({length:width},(_,i)=>row[i]||'—'))};
 }
 function tableHtml(data,documentMode=false){
  const cell='border:1px solid #9aa6b5;padding:7px 10px;text-align:left;vertical-align:top;font:10pt/1.45 Arial,Apple SD Gothic Neo,sans-serif;';
  const table='<table style="border-collapse:collapse;width:100%;">'+'<thead><tr>'+data.headers.map(value=>'<th style="'+cell+'background:#1b3157;color:#fff;font-weight:700;">'+escapeHtml(value)+'</th>').join('')+'</tr></thead><tbody>'+data.body.map((row,index)=>'<tr>'+row.map(value=>'<td style="'+cell+'background:'+(index%2?'#f5f7fa':'#ffffff')+';">'+escapeHtml(value).replace(/\n/g,'<br>')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  if(!documentMode)return table;
  return '<div style="font-family:Arial,Apple SD Gothic Neo,sans-serif;color:#182235;"><h2 style="margin:0 0 6px;font-size:16pt;">'+escapeHtml(state.title||'표')+'</h2>'+(state.subtitle?'<p style="margin:0 0 12px;color:#526078;">'+escapeHtml(state.subtitle)+'</p>':'')+table+'<p style="margin:9px 0 0;font-size:9pt;color:#657187;">단위: '+escapeHtml(state.unit||'해당 없음')+'<br>자료: '+escapeHtml(state.source||'미기재')+'</p></div>';
 }
 function plainText(data){return [state.title||'표',state.subtitle||'',data.headers.join('\t'),...data.body.map(row=>row.join('\t')),'단위: '+(state.unit||'해당 없음'),'자료: '+(state.source||'미기재')].filter(Boolean).join('\n');}
 async function copyTable(){
  const data=currentTable(),html=tableHtml(data,true),plain=plainText(data);
  if(navigator.clipboard?.write&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);return;}
  const holder=document.createElement('div');holder.contentEditable='true';holder.style.position='fixed';holder.style.left='-10000px';holder.innerHTML=html;document.body.appendChild(holder);
  const selection=getSelection(),range=document.createRange();range.selectNodeContents(holder);selection.removeAllRanges();selection.addRange(range);let copied=false;try{copied=document.execCommand('copy');}finally{selection.removeAllRanges();holder.remove();}if(!copied)throw Error('복사 실패');
 }
 function csvCell(value){let text=String(value??'');if(/^[\s]*[=+@-]/.test(text)&&!/^\s*[+-]?\d+(\.\d+)?\s*$/.test(text))text="'"+text;return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;}
 function downloadCsv(){
  const data=currentTable(),csv=[data.headers,...data.body].map(row=>row.map(csvCell).join(',')).join('\r\n');
  download(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),escName()+'_표.csv');
 }
 const button=document.createElement('button');button.className='btn';button.id='tableExportBtn';button.textContent='표로 내보내기';
 button.onclick=()=>{
  if(typeof selectedChart==='function'&&!selectedChart()){toast('먼저 도표나 도식을 선택해주세요.');return;}
  if(validateData(state.type,rows())){toast('입력 내용을 먼저 확인해주세요.');return;}
  document.getElementById('tableExportTitle').textContent=(state.title||'표')+' · 편집 가능한 표';
  document.getElementById('tableExportPreview').innerHTML=tableHtml(currentTable());
  document.getElementById('tableExportDialog').showModal();
 };
 document.querySelector('.stage-toolbar').appendChild(button);
 const dialog=document.createElement('dialog');dialog.id='tableExportDialog';dialog.innerHTML='<div class="dialog-header"><h2 id="tableExportTitle">편집 가능한 표</h2><button class="btn" id="closeTableExport">닫기</button></div><div class="dialog-body"><p class="table-export-help">Word용 표 복사는 셀 구조와 색상을 유지합니다. 붙여넣은 뒤 Word에서 글자와 셀을 직접 수정할 수 있습니다.</p><div id="tableExportPreview"></div><div class="table-export-actions"><button class="btn primary" id="copyEditableTable">Word용 표 복사</button><button class="btn" id="downloadTableCsv">Excel용 CSV</button></div></div>';
 document.body.appendChild(dialog);
 document.getElementById('closeTableExport').onclick=()=>dialog.close();
 dialog.onclick=event=>{if(event.target===dialog)dialog.close();};
 document.getElementById('copyEditableTable').onclick=async()=>{try{await copyTable();toast('편집 가능한 표를 복사했습니다. Word에 붙여넣으세요.');}catch{toast('표 복사를 지원하지 않는 브라우저입니다. CSV를 이용해주세요.');}};
 document.getElementById('downloadTableCsv').onclick=()=>{downloadCsv();toast('Excel용 표 파일을 저장했습니다.');};
 window.reportTableExport={currentTable,tableHtml,plainText};
})();
