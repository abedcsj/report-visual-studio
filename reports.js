'use strict';

// Text-oriented report templates share the existing local import/export workflow.
templates.splice(templates.findIndex(t=>t.id==='matrix'),1);
templates.push(
  {id:'ceo',name:'대표이사 이력',desc:'이름·학력·주요 경력',icon:'人',help:'이름 | 구분(직책/학력/이력) | 기간 | 내용',sample:'김예시 | 직책 | 현재 | 대표이사\n김예시 | 학력 | 2002 | 예시대학교 경영학 학사\n김예시 | 이력 | 2015~2020 | 예시산업 영업본부장\n김예시 | 이력 | 2021~현재 | 예시기업 대표이사'},
  {id:'team',name:'조직도',desc:'부서·팀·보고 관계',icon:'⌘',help:'단계(0부터) | 조직명 | 담당자·업무 | 상위조직명',sample:'0 | 대표이사 | 김예시 |\n1 | 경영지원본부 | 재무·인사 총괄 | 대표이사\n1 | 사업본부 | 영업·생산 총괄 | 대표이사\n2 | 재무팀 | 회계·자금 관리 | 경영지원본부\n2 | 영업팀 | 고객·판매 관리 | 사업본부\n2 | 생산팀 | 생산·품질 관리 | 사업본부'},
  {id:'management',name:'주요 경영진',desc:'직책·담당·학력·경력',icon:'☷',help:'이름 | 직책 | 담당업무 | 학력 | 주요이력',sample:'김예시 | 대표이사 | 경영 총괄 | 예시대학교 경영학 | 예시산업 영업본부장; 2021년 대표이사 취임\n이예시 | 재무담당 전무 | 재무·투자 관리 | 예시대학교 회계학 | 예시회사 재무팀장\n박예시 | 생산담당 상무 | 생산·품질 관리 | 예시대학교 기계공학 | 예시제조 공장장'},
  {id:'product',name:'핵심 제품 설명',desc:'제품 개요·특징·작동원리',icon:'◇',help:'제품명 | 구분(개요/특징/구성/작동원리/용도/사양) | 항목명 | 설명',sample:'예시 순환펌프 | 개요 | 제품 소개 | 배관 내 유체를 순환시키는 장치\n예시 순환펌프 | 특징 | 속도 조절 | 운전 조건에 맞춰 회전 속도를 조절\n예시 순환펌프 | 구성 | 모터와 임펠러 | 모터가 임펠러를 회전시키는 구조\n예시 순환펌프 | 작동원리 | 01. 유체 유입 | 흡입구를 통해 유체가 들어옴\n예시 순환펌프 | 작동원리 | 02. 회전과 에너지 전달 | 회전하는 임펠러가 유체에 에너지를 전달\n예시 순환펌프 | 작동원리 | 03. 유체 배출 | 에너지를 얻은 유체가 토출구를 통해 이동\n예시 순환펌프 | 용도 | 적용 분야 | 건물 냉난방 순환 배관'}
);
const reportContracts={
  ceo:{purpose:'대표이사의 이름·학력·이력을 인물별 소개로 정리합니다.',schema:'이름 | 구분(직책/학력/이력) | 기간 | 내용',min:1,cols:[4,4],rule:'한 행에 하나의 학력 또는 이력을 입력한다. 구분은 직책, 학력, 이력 중 하나다. 동일 이름은 같은 인물로 묶인다. 동명이인은 원자료에서 확인 가능한 구분자를 이름에 붙인다. 기간이 없으면 빈칸으로 두고 학력·경력·재직 여부를 추정하지 않는다. 공동대표도 각각 입력하며 인원·학력·이력 수에 상한이 없다. 이력은 원자료의 연대순으로 정리한다. 단위는 해당 없음.'},
  team:{purpose:'회사 내부의 부서·팀과 보고 관계를 조직도로 보여줍니다.',schema:'단계 | 조직명 | 담당자·업무 | 상위조직명',min:1,cols:[4,4],rule:'단계는 0부터 연속된 정수이며 깊이·단계별 조직 수에 상한이 없다. 최상위의 상위조직명은 빈칸, 나머지는 바로 윗단계의 정확한 조직명을 적는다. 조직명은 고유해야 하므로 동명 부서는 상위 본부 등 확인 가능한 구분자를 붙인다. 지분 관계가 아닌 실제 내부 보고 관계만 사용한다. 담당자·업무는 없으면 빈칸. 이중 보고나 미확인 보고 관계는 임의로 연결하지 말고 먼저 확인한다. 단위는 해당 없음.'},
  management:{purpose:'주요 경영진의 이름·직책·담당업무·학력·경력을 인물별로 정리합니다.',schema:'이름 | 직책 | 담당업무 | 학력 | 주요이력',min:1,cols:[5,5],rule:'한 행에 한 사람. 이름과 직책은 필수이며 나머지는 미기재일 때 빈칸. 복수 학력·경력은 세미콜론으로 구분한다. 인원·경력 수에 상한을 두지 않는다. 동명이인은 확인 가능한 구분자를 붙인다. 전직과 현직, 재직 기준일을 원자료대로 구분하고 학력·성과·전문성을 추정하지 않는다. 단위는 해당 없음.'},
  product:{purpose:'핵심 제품의 개요·특징·구성·작동원리·용도·사양을 설명하는 제품 소개를 만듭니다.',schema:'제품명 | 구분(개요/특징/구성/작동원리/용도/사양) | 항목명 | 설명',min:1,cols:[4,4],rule:'한 행에 하나의 설명 항목. 같은 제품명은 하나의 제품 소개로 묶인다. 구분은 개요, 특징, 구성, 작동원리, 용도, 사양 중 하나다. 작동원리는 실제 순서대로 배치하고 항목명에 01, 02 등의 순서를 적는다. 복잡한 분기·순환은 설명에 명시하고 일방향 과정으로 왜곡하지 않는다. 자료가 없는 구분은 생략하며 제품 수·설명 항목 수·작동 단계 수에 상한이 없다. 제공 자료에 없는 성능·인증·효능·기술 사양을 만들지 않는다. 제품 설명의 수치에는 원래 단위와 % 기호를 유지한다. 단위는 해당 없음.'}
};

function installReports(){
  delete renderers.matrix;
  const previousValidate=validateData;
  validateData=function(type,r){
    const error=previousValidate(type,r);if(error)return error;
    if(type==='team'){
      if(r.length===1&&r[0][0]==='0'&&r[0][1]&&!r[0][3])return '';
      return previousValidate('org',r).replaceAll('회사','조직');
    }
    if(!reportContracts[type])return '';
    for(let i=0;i<r.length;i++){
      const row=r[i],prefix=(i+1)+'번째 줄: ';
      if(type==='ceo'&&(!['직책','학력','이력'].includes(row[1])||!row[3]))return prefix+'구분(직책/학력/이력)과 내용을 입력해주세요.';
      if(type==='management'&&!row[1])return prefix+'직책을 입력해주세요.';
      if(type==='product'&&(!['개요','특징','구성','작동원리','용도','사양'].includes(row[1])||!row[2]||!row[3]))return prefix+'구분·항목명·설명을 확인해주세요.';
    }
    return '';
  };
  const previousDimensions=adaptiveDimensions;
  adaptiveDimensions=function(){
    const base=previousDimensions(),r=rows();
    if(validateData(state.type,r))return base;
    if(state.type==='team'){
      const l=organizationLayout(r);return [Math.max(base[0],l.width+132),Math.max(base[1],l.height+240)];
    }
    if(['ceo','management','product'].includes(state.type))return [base[0],Math.max(base[1],reportLayout(state.type,r,base[0]).height+230)];
    return base;
  };
  renderers.team=renderers.org;
  for(const type of ['ceo','management','product'])renderers[type]=(c,r)=>renderReport(c,reportLayout(type,r,c.w));
  buildTemplates=function(){
    $('#templateList').innerHTML='';
    for(const t of templates){
      const b=document.createElement('button');b.className='template';b.dataset.id=t.id;
      b.innerHTML='<span class="icon">'+t.icon+'</span><span><strong>'+t.name+'</strong><small>'+t.desc+'</small></span>';
      b.onclick=()=>{state.type=t.id;state.data=t.sample;state.title=t.name+' (가상 예시)';state.subtitle='입력 형식을 보여주는 가상 자료 · 원자료로 교체';state.unit=['bar','line','waterfall','donut'].includes(t.id)?'억원':'해당 없음';state.source='가상 예시 · 원자료로 교체';syncControls();render();};
      $('#templateList').appendChild(b);
    }
  };
}

function reportLayout(type,r,width){
  const groups=new Map();
  r.forEach((row,index)=>{
    const key=type==='management'?String(index):row[0];
    if(!groups.has(key))groups.set(key,{name:row[0],items:[]});
    const group=groups.get(key);
    if(type==='management'){
      group.items.push(...[['직책',row[1]],['담당업무',row[2]],['학력',row[3]],['주요 이력',row[4]]].map(([label,body])=>({label,heading:'',body:body||'미기재'})));
    }else group.items.push({label:row[1],heading:row[2],body:row[3]});
  });
  let y=0;
  for(const group of groups.values()){
    group.y=y;group.nameLines=wrap(group.name,Math.max(10,Math.floor((width-184)/24)));
    let local=group.nameLines.length*32+38;
    for(const item of group.items){
      item.y=local;item.headingLines=item.heading?wrap(item.heading,Math.floor((width-360)/16)):[];
      item.bodyLines=wrap(item.body,Math.floor((width-360)/16));
      item.height=Math.max(58,item.headingLines.length*23+item.bodyLines.length*25+28);
      local+=item.height;
    }
    group.height=local+12;y+=group.height+26;
  }
  return {groups:[...groups.values()],height:y};
}
function renderReport(c,layout){
  for(const group of layout.groups){
    const top=c.top+group.y;
    add('rect',{x:c.left,y:top,width:c.right-c.left,height:group.height,rx:14,fill:'#f7f9fc',stroke:'#dce2ea'});
    add('rect',{x:c.left,y:top,width:6,height:group.nameLines.length*32+32,rx:3,fill:c.p.main});
    textLines(c.left+26,top+38,group.nameLines,{'font-size':24,'font-weight':800,fill:c.p.ink},32);
    for(const item of group.items){
      const y=top+item.y;
      add('line',{x1:c.left+24,y1:y-10,x2:c.right-24,y2:y-10,stroke:'#dce2ea'});
      add('text',{x:c.left+26,y:y+16,'font-size':14,'font-weight':700,fill:c.p.main},item.label);
      if(item.headingLines.length)textLines(c.left+172,y+16,item.headingLines,{'font-size':16,'font-weight':700,fill:c.p.ink},23);
      textLines(c.left+172,y+16+item.headingLines.length*23,item.bodyLines,{'font-size':16,fill:c.p.ink},25);
    }
  }
}
