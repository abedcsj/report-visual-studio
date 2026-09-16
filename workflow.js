'use strict';

// Local-only prompts and import. No API calls or data transmission.
const contracts = {
  bar: {
    purpose:'회사·제품·연도별 단일 지표를 가로 막대로 비교합니다.',
    rule:'항목 수 제한 없음. 한 그래프에는 동일 단위의 단일 지표만 넣는다. 음수도 그대로 유지한다. 여러 회사의 여러 연도나 매출과 이익을 동시에 비교하려면 그래프를 나눌 것을 안내한다. 보조설명은 읽기 쉽게 작성한다.',
    schema:'항목 | 값 | 보조설명(선택)', min:1,cols:[2,3]
  },
  line: {
    purpose:'매출·판매량·가격처럼 시간이 지나며 변하는 하나의 지표를 보여줍니다.',
    rule:'기간 수 제한 없이 모든 기간을 시간순으로 정렬한다. 단일 지표·단일 선만 지원한다. 제주와 전국처럼 두 계열은 별도 그래프로 요청할 것을 안내한다. 기간 간격은 일정해야 한다. 누락된 기간은 0이나 추정치로 채우지 말고 먼저 확인한다. 연간 전체와 일부 월 누계를 섞지 않는다. 보조설명은 읽기 쉽게 작성한다.',
    schema:'기간 | 값 | 보조설명(선택)', min:2,cols:[2,3]
  },
  waterfall: {
    purpose:'시작 금액이 어떤 증가·감소 요인을 거쳐 최종 금액이 됐는지 보여줍니다.',
    rule:'증감 항목 수 제한 없음. 첫 줄은 시작 잔액, 중간 줄은 증감액, 마지막 줄은 종료 잔액이다. 감소는 음수로 쓴다. 시작값 + 모든 중간 증감액 = 종료값이어야 한다. 종료값은 다시 더하는 증감액이 아니다. 불일치가 있으면 임의의 기타 항목으로 맞추지 말고 확인을 요청한다. 합산으로 구한 종료값이라면 핵심 메시지에 계산값임을 표시한다.',
    schema:'항목 | 값\n첫 줄: 시작 잔액\n중간: 증가(+)/감소(-)\n마지막: 종료 잔액',min:3,cols:[2,2]
  },
  donut: {
    purpose:'매출 부문·제품·지분이 전체에서 차지하는 비중을 보여줍니다.',
    rule:'구성항목 수 제한 없음. 같은 기간·같은 전체를 구성하는 중복 없는 0 이상의 값만 넣는다. 합계는 양수여야 한다. 합계 행을 구성항목에 다시 넣지 않는다. 사이트가 입력 합계 대비 비율을 계산하므로 전체가 아닌 일부만 있다면 사용자가 원하는 모집단을 먼저 확인한다. 비율을 직접 입력하면 단위를 %로 쓰고 합계 100인지 확인한다. 보조설명은 읽기 쉽게 작성한다.',
    schema:'항목 | 값 | 보조설명(선택)',min:1,cols:[2,3]
  },
  flow: {
    purpose:'매입·생산·유통·고객으로 이어지는 사업 흐름을 순서대로 보여줍니다.',
    rule:'단계 수 제한 없이 단방향 흐름을 표현한다. 첫 열은 01, 02 등의 순서로 적고 제목과 세부설명은 읽기 쉽게 쓴다. 복잡한 분기·순환·다대다 거래를 직선 흐름으로 왜곡하지 말고 분리할 것을 안내한다. 확인되지 않은 고객·공급사·거래를 만들지 않는다. 단위는 해당 없음.',
    schema:'단계 | 제목 | 세부설명',min:2,cols:[3,3]
  },
  org: {
    purpose:'상위회사와 자회사 관계를 단계 수와 회사 수 제한 없이 연결합니다.',
    rule:'전체 회사 수·단계별 회사 수·단계 깊이에 상한을 두지 않는다. 단계는 0(최상위), 1, 2, 3…의 연속된 정수로 적는다. 최상위 회사가 여러 개면 각각 0단계로 적는다. 네 번째 열에 실제 상위회사명을 반드시 적는다. 0단계의 네 번째 열만 빈칸. 상위회사는 바로 윗단계에 있어야 하며 회사명은 정확히 일치해야 한다. 같은 단계는 형제 관계이지 서로의 자회사가 아니다. 회사명과 지분·관계는 원자료대로 적는다. 지분율이 없으면 임의 추정하지 말고 확인된 관계만 적는다. 여러 주주·순환출자·공동소유는 이 단순 트리로 표현할 수 없으므로 확인을 요청한다. 단위는 해당 없음.',
    schema:'단계 | 회사명 | 지분·관계 | 상위회사명',min:2,cols:[3,4]
  },
  timeline: {
    purpose:'회생절차·투자·주요 사업의 진행 경과를 날짜순으로 보여줍니다.',
    rule:'사건 수 제한 없이 모든 사건을 시간순으로 정렬한다. 일자는 YYYY.MM 또는 YYYY.MM.DD로 적고 사건과 설명을 제공한다. 예정과 완료는 사건명에 명확히 구분하고 날짜를 모르면 지어내지 않는다. 사건 간 거리는 날짜 간격에 비례하지 않는 순서형 타임라인임을 유의한다. 단위는 해당 없음.',
    schema:'일자 | 사건 | 세부설명',min:2,cols:[3,3]
  },
  matrix: {
    purpose:'리스크별 발생 가능성과 영향도를 1~5점 좌표로 비교합니다.',
    rule:'리스크 수 제한 없음. 두 번째 열은 발생 가능성(X축), 세 번째 열은 영향도(Y축), 각각 1~5의 정수다. 1은 낮음, 5는 높음. 점수를 실제 확률처럼 표현하지 않는다. 원자료에 점수나 사용자가 승인한 평가기준이 없으면 임의로 점수를 만들지 말고 평가기준을 먼저 질문한다. 분석가 평가값이면 핵심 메시지에 명시한다. 리스크명은 원자료대로 적는다. 단위는 점 (1~5).',
    schema:'리스크 | 가능성(1~5) | 영향도(1~5)',min:1,cols:[3,3]
  }
};

delete contracts.matrix;
Object.assign(contracts,reportContracts);

function parseRows(text){
  return String(text||'').replace(/\\n/g,'\n').split(/\r?\n/)
    .map(x=>x.trim()).filter(Boolean).map(line=>{
      const separator=line.includes('|')?'|':line.includes('\t')?'\t':',';
      return line.split(separator).map(x=>x.trim());
    });
}
function parseNumber(value){
  const raw=String(value??'').trim().replace(/−/g,'-');
  if(!raw)return NaN;
  const s=raw.replace(/,/g,'');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)?Number(s):NaN;
}
function validateData(type,r){
  const spec=contracts[type];
  if(!spec)return '지원하지 않는 그래프 유형입니다.';
  if(r.length<spec.min)return '이 유형을 표현하려면 최소 '+spec.min+'개 항목이 필요합니다.';
  for(let i=0;i<r.length;i++){
    const row=r[i],prefix=(i+1)+'번째 줄: ';
    if(row.length<spec.cols[0]||row.length>spec.cols[1])return prefix+'입력 열 수를 확인해주세요. '+spec.schema.split('\n')[0];
    if(!row[0])return prefix+'항목명이 비어 있습니다.';
    if(['bar','line','waterfall','donut'].includes(type)){
      if(!Number.isFinite(parseNumber(row[1])))return prefix+'값은 단위 없는 숫자로 입력해주세요. 빈 값은 0으로 처리하지 않습니다.';
      if(type==='donut'&&parseNumber(row[1])<0)return prefix+'구성비에는 음수를 넣을 수 없습니다.';
    }
    if(['flow','org','timeline'].includes(type)&&!row[1])return prefix+'제목 또는 회사명이 필요합니다.';
    if(type==='matrix'&&[row[1],row[2]].some(v=>!Number.isInteger(parseNumber(v))||parseNumber(v)<1||parseNumber(v)>5))return prefix+'가능성과 영향도는 각각 1~5의 정수여야 합니다.';
  }
  if(type==='donut'&&r.reduce((s,row)=>s+parseNumber(row[1]),0)<=0)return '구성비의 합계가 0입니다. 양수인 항목이 필요합니다.';
  if(type==='waterfall'){
    const sum=r.slice(0,-1).reduce((s,row)=>s+parseNumber(row[1]),0),last=parseNumber(r.at(-1)[1]);
    if(Math.abs(sum-last)>Math.max(1e-8,Math.abs(sum)*1e-10))return '시작값 + 중간 증감액 ('+fmt(sum)+')과 마지막 종료값 ('+fmt(last)+')이 다릅니다. 원자료를 확인해주세요.';
  }
  if(type==='org'){
    const byName=new Map(),byLevel=new Map();
    for(const row of r){
      const level=parseNumber(row[0]);
      if(!Number.isSafeInteger(level)||level<0)return '단계는 0부터 시작하는 정수로 입력해주세요.';
      if(byName.has(row[1]))return '회사명이 중복됩니다. 각 회사는 한 번만 입력해주세요.';
      byName.set(row[1],row);
      if(!byLevel.has(level))byLevel.set(level,[]);
      byLevel.get(level).push(row);
    }
    if(!byLevel.has(0))return '최상위 회사는 0단계로 입력해주세요.';
    for(const row of r){
      const level=parseNumber(row[0]);
      if(level===0&&row[3])return '0단계 회사에는 상위회사를 입력하지 마세요.';
      if(level>0){
        const parents=byLevel.get(level-1)||[];
        if(row[3]){
          const parent=byName.get(row[3]);
          if(!parent||parseNumber(parent[0])!==level-1)return row[1]+': 상위회사명이 바로 윗단계 회사명과 일치하지 않습니다.';
        }else if(parents.length!==1)return row[1]+': 상위회사가 불명확합니다. 네 번째 열에 정확한 상위회사명을 입력해주세요.';
      }
    }
  }
  return '';
}

function promptFor(type,goal=''){
  const t=templates.find(x=>x.id===type),s=contracts[type];
  const base=typeof reportBaseType==='function'?reportBaseType(type):type;
  const example={type,title:t.name+' (가상 예시)',subtitle:'입력 형식 예시 · 원자료로 교체',unit:['bar','line','waterfall','donut','multiline'].includes(base)?'원자료 단위':['financial','comparison','relations'].includes(base)?'항목별 표기':'해당 없음',source:'원자료명 · 기준기간',data:t.sample.split('\n')};
  return [
    '첨부하거나 붙여넣은 원본 자료를 「기업보고서 비주얼 스튜디오」의 '+t.name+'에 바로 적용할 수 있도록 변환해줘.',
    '보여주고 싶은 내용: '+(goal.trim()||'[원하는 비교나 추이를 여기에 적거나 자료와 함께 설명]'),
    '',
    '[선택한 유형과 사이트의 실제 입력 형식]',
    '유형 코드: '+type,
    '용도: '+s.purpose,
    '한 줄 형식: '+s.schema,
    '유형별 규칙: '+s.rule,
    '',
    '[공통 원칙]',
    '- 원본의 숫자·기간·단위를 확인하고 정확히 유지해. 없는 값은 만들거나 0으로 대체하지 마.',
    '- 합계와 부분항목을 중복 집계하지 말고, 실제·추정·예정·기간 누계를 명확히 구분해.',
    '- 부족한 자료, 불명확한 단위나 관계, 지원하지 않는 표현은 변환하기 전에 간단히 질문해. 그 경우 적용용 JSON은 만들지 마.',
    '- 전체 항목 수·단계별 개수·단계 깊이에 상한을 두지 마. 모든 요청 항목을 유지하고 임의로 생략·합산·분할하지 마. 사이트가 도표 영역을 자동 확장한다.',
    '- 데이터 각 행은 |로 열을 구분해. 수치 차트의 값 열에는 천 단위 쉼표·단위·% 기호를 넣지 마. 소수점과 음수는 유지해. 인물·제품 설명문 속 수치와 단위는 원문대로 유지해.',
    '- data에는 제목·열 이름·합계 설명·마크다운 표 구분선을 넣지 마. 문자열 내용에도 |를 쓰지 마.',
    '- 제목·핵심 메시지·출처는 읽기 쉽게 작성해. 출처가 없으면 "사용자 제공 자료 (출처 미기재)"라고 써.',
    '',
    '[답변 형식]',
    '적용 가능한 경우 설명문 없이 JSON 코드블록 하나만 반환해. 아래 항목을 모두 포함해.',
    'type=유형 코드, title=제목, subtitle=핵심 메시지, unit=단위, source=출처, data=데이터 행의 문자열 배열.',
    '아래는 형식만 보여주는 가상 예시야. 수치·회사·일정을 실제 자료인 것처럼 사용하지 말고 반드시 원자료로 교체해.',
    JSON.stringify(example,null,2),
    '',
    '내가 이 JSON을 사이트의 「② ChatGPT 답변 붙여넣기」에 넣으면 바로 적용되도록 작성해줘.'
  ].join('\n');
}

function normalizeAnswer(obj,allowStyle=false){
  if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('JSON 객체 하나를 넣어주세요.');
  if(!Object.hasOwn(contracts,obj.type))throw Error('type이 올바르지 않습니다. 해당 유형의 요청문으로 다시 변환해주세요.');
  const next={...state,type:obj.type};
  for(const key of ['title','subtitle','unit','source']){
    if(typeof obj[key]!=='string')throw Error(key+' 항목이 없습니다. 요청문에 따른 전체 답변을 넣어주세요.');
    next[key]=obj[key];
  }
  if(Array.isArray(obj.data)&&obj.data.every(x=>typeof x==='string'))next.data=obj.data.join('\n');
  else if(typeof obj.data==='string')next.data=obj.data.replace(/\\n/g,'\n');
  else throw Error('data는 데이터 행의 배열 또는 문자열이어야 합니다.');
  const error=validateData(next.type,parseRows(next.data));if(error)throw Error(error);
  if(allowStyle){
    if(Object.hasOwn(palettes,obj.theme))next.theme=obj.theme;
    if(['16:9','3:2','4:3','1:1'].includes(obj.ratio))next.ratio=obj.ratio;
    for(const key of ['showValues','transparent'])if(typeof obj[key]==='boolean')next[key]=obj[key];
  }
  return next;
}
function parseAnswer(raw){
  const fences=[...raw.matchAll(/\u0060{3}(?:json)?\s*([\s\S]*?)\u0060{3}/gi)];
  if(fences.length>1)throw Error('여러 결과가 있습니다. 적용할 JSON 하나만 붙여넣어주세요.');
  const value=fences.length?fences[0][1].trim():raw.trim();
  let obj;
  try{obj=JSON.parse(value);}catch(e){throw Error('JSON을 읽지 못했습니다. 원본 표가 아니라 ChatGPT가 변환한 JSON 코드 전체를 넣어주세요.');}
  return normalizeAnswer(obj);
}

let beforeImport=null;
function setPane(pane){
  $('#promptPane').hidden=pane!=='prompt';$('#answerPane').hidden=pane!=='answer';
  $('#promptTab').classList.toggle('active',pane==='prompt');$('#answerTab').classList.toggle('active',pane==='answer');
}
function updatePrompt(){
  const type=$('#promptType').value,t=templates.find(x=>x.id===type),spec=contracts[type];
  $('#typePurpose').textContent=spec.purpose;
  $('#typeSchema').textContent=spec.schema;
  $('#typeSample').textContent=t.sample;
  $('#typeCaution').textContent=spec.rule;
  $('#promptPreview').value=promptFor(type,$('#requestGoal').value);
}
function openWorkflow(pane){
  $('#promptType').value=state.type;updatePrompt();setPane(pane);
  $('#workflowDialog').showModal();
  (pane==='answer'?$('#answerInput'):$('#promptType')).focus();
}
$('#openPromptBtn').onclick=()=>openWorkflow('prompt');
$('#openAnswerBtn').onclick=()=>openWorkflow('answer');
$('#closeWorkflow').onclick=()=>$('#workflowDialog').close();
$('#promptTab').onclick=()=>setPane('prompt');
$('#answerTab').onclick=()=>setPane('answer');
$('#promptType').onchange=updatePrompt;
$('#requestGoal').oninput=updatePrompt;
for(const t of templates){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;$('#promptType').appendChild(option);}
$('#copyPromptFull').onclick=async()=>{
  try{await navigator.clipboard.writeText($('#promptPreview').value);toast('요청문을 복사했습니다. 원본 자료와 함께 ChatGPT에 보내주세요.');}
  catch(e){$('#promptPreview').focus();$('#promptPreview').select();toast('요청문을 선택했습니다. Ctrl+C 또는 ⌘C로 복사해주세요.');}
};
$('#applyAnswer').onclick=()=>{
  try{
    const candidate=parseAnswer($('#answerInput').value);
    beforeImport={...state};state=candidate;
    syncControls();render();$('#answerError').textContent='';
    $('#undoAnswer').disabled=false;$('#workflowDialog').close();
    toast('제목·단위·출처·데이터를 적용했습니다. 원자료와 대조해주세요.');
  }catch(e){$('#answerError').textContent=e.message;}
};
$('#undoAnswer').onclick=()=>{
  if(!beforeImport)return;
  state=beforeImport;beforeImport=null;syncControls();render();
  $('#undoAnswer').disabled=true;$('#answerError').textContent='';
  toast('직전 적용 전으로 되돌렸습니다.');
};
$('#answerInput').oninput=()=>{$('#answerError').textContent='';};

// Signed bars use a real zero baseline.
renderers.bar=function(c,r){
  const data=r.map(x=>({label:x[0],value:num(x[1]),note:x[2]||''}));
  const min=Math.min(0,...data.map(d=>d.value)),max=Math.max(0,...data.map(d=>d.value));
  const range=max-min||1,x0=c.left+155,x1=c.right-210;
  const x=v=>x0+(v-min)/range*(x1-x0),zero=x(0);
  const rh=(c.bottom-c.top-28)/data.length;
  add('line',{x1:zero,y1:c.top,x2:zero,y2:c.bottom-24,stroke:'#aeb8c7','stroke-width':1});
  data.forEach((d,i)=>{
    const y=c.top+i*rh+rh*.18,h=rh*.5,endpoint=x(d.value);
    add('text',{x:x0-16,y:y+h*.68,'text-anchor':'end','font-size':14,'font-weight':700,fill:c.p.ink},d.label);
    add('rect',{x:Math.min(zero,endpoint),y,width:Math.abs(endpoint-zero),height:h,rx:4,fill:d.value<0?'#c65c61':i===data.length-1?c.p.main:c.p.dark});
    if(state.showValues){
      add('text',{x:c.right-92,y:y+h*.68,'text-anchor':'end','font-size':14,'font-weight':800,fill:c.p.ink},fmt(d.value));
      if(d.note)add('text',{x:c.right,y:y+h*.68,'text-anchor':'end','font-size':11,fill:c.p.main},d.note);
    }
  });
};
// Explicit parents prevent arbitrary ownership connections.
renderers.org=function(c,r){
  const data=r.map(x=>({level:num(x[0]),title:x[1],detail:x[2]||'',parent:x[3]||''}));
  const maxLevel=Math.max(...data.map(x=>x.level)),span=c.right-c.left,positions=[];
  for(let level=0;level<=maxLevel;level++){
    const group=data.filter(x=>x.level===level);
    const y=c.top+20+level*(c.bottom-c.top-122)/Math.max(1,maxLevel);
    group.forEach((d,i)=>{
      const w=Math.min(220,span/group.length-24),x=c.left+span/group.length*(i+.5)-w/2;
      positions.push({x,y,w,d});
    });
  }
  for(const child of positions.filter(p=>p.d.level>0)){
    const parents=positions.filter(p=>p.d.level===child.d.level-1);
    const parent=child.d.parent?parents.find(p=>p.d.title===child.d.parent):parents[0];
    if(!parent)continue;
    const x1=parent.x+parent.w/2,y1=parent.y+82,x2=child.x+child.w/2,y2=child.y,mid=(y1+y2)/2;
    add('path',{d:'M'+x1+' '+y1+' V'+mid+' H'+x2+' V'+y2,fill:'none',stroke:'#aab5c5','stroke-width':2});
  }
  for(const {x,y,w,d} of positions){
    add('rect',{x,y,width:w,height:82,rx:12,fill:d.level===0?c.p.dark:c.p.light});
    add('text',{x:x+w/2,y:y+32,'text-anchor':'middle','font-size':15,'font-weight':800,fill:d.level===0?'#fff':c.p.ink},d.title);
    if(state.showValues)add('text',{x:x+w/2,y:y+58,'text-anchor':'middle','font-size':12,fill:d.level===0?'#dce8f7':c.p.main},d.detail);
  }
};
const originalLine=renderers.line;
renderers.line=function(c,r){
  originalLine(c,r);
  if(state.showValues)r.forEach((row,i)=>{
    if(row[2])add('text',{x:c.left+32+(c.right-c.left-62)*i/Math.max(r.length-1,1),y:c.bottom-4,'text-anchor':'middle','font-size':10,fill:c.p.main},row[2]);
  });
};
// Group coincident risk numbers rather than hide earlier markers.
renderers.matrix=function(c,r){
  const size=Math.min(c.bottom-c.top-70,c.right-c.left-360),x0=c.left+65,y0=c.top+8,cell=size/5;
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
  const cells=new Map();
  r.forEach((row,i)=>{const key=row[1]+','+row[2];if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i+1);});
  for(const [key,ids] of cells){
    const [prob,impact]=key.split(',').map(Number),cx=x0+(prob-.5)*cell,cy=y0+(5-impact+.5)*cell;
    add('rect',{x:cx-cell*.43,y:cy-16,width:cell*.86,height:32,rx:12,fill:c.p.dark});
    add('text',{x:cx,y:cy+4,'text-anchor':'middle','font-size':ids.length>3?10:12,'font-weight':800,fill:'#fff'},ids.join('·'));
  }
  r.forEach((row,i)=>{
    const lx=x0+size+35,y=y0+18+i*53;
    add('circle',{cx:lx,cy:y,r:12,fill:c.p.dark});
    add('text',{x:lx,y:y+4,'text-anchor':'middle','font-size':11,fill:'#fff'},i+1);
    textLines(lx+22,y-2,wrap(row[0],17),{'font-size':12,'font-weight':700,fill:c.p.ink},16);
    if(state.showValues)add('text',{x:lx+22,y:y+32,'font-size':10,fill:'#657187'},'가능성 '+row[1]+' / 영향도 '+row[2]);
  });
};

// Preserve prior data/style, recovering only invalid state fields.
try{
  if(!Object.hasOwn(contracts,state.type)){
    localStorage.setItem('reportVisualStudio_retired',JSON.stringify(state));
    state={...defaultState};
  }
  if(!Object.hasOwn(palettes,state.theme))state.theme='navy';
  if(!['16:9','3:2','4:3','1:1'].includes(state.ratio))state.ratio='16:9';
  if(typeof state.data!=='string')state.data=templates.find(x=>x.id===state.type).sample;
  state.data=state.data.replace(/\\n/g,'\n');
}catch(e){state={...defaultState};}
