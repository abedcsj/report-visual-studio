'use strict';
(()=>{
 const entries=[
  ['D01','사업구조 흐름도','flow','Executive Summary · 돈을 버는 방식'],
  ['D02','지배구조도','basic_4','Executive Summary · 주주와 계열회사'],
  ['D03','조직도','basic_5','Executive Summary · 조직의 보고 관계'],
  ['D05','수요 발생 원인과 결과','industry_4','01 산업의 수요'],
  ['D06','산업 수요 → 제품 구매','product_3','02 제품의 수요'],
  ['D07','인증·납품 이력 타임라인','advantage_3','03 회사의 경쟁력'],
  ['D08','계약 → 매출 → 대금 회수','revenue_1','04 수요의 매출 전환'],
  ['D10','마진 변화 원인과 결과','profit_3','05 매출의 이익 전환'],
  ['D12','투자·프로젝트 타임라인','value_1','08 미래 가치의 확대와 유지'],
  ['D13','회생절차 타임라인','recovery_2','10 회생 신청 배경과 절차'],
  ['D15','고객 공정 속 제품 위치','product_2','02 제품의 수요 · 사용 단계 강조'],
  ['D16','회생 신청에 이른 원인 흐름도','recovery_1','10 회생 신청 배경과 절차']
 ];
 const catalog=entries.map(([id,name,from,desc])=>{
  const source=templates.find(t=>t.id===from);if(!source)throw Error('도식 정의를 찾지 못했습니다: '+from);
  specializedTypes[id]={...(specializedTypes[from]||{base:from})};
  contracts[id]={...contracts[from],purpose:name};columnNames[id]=[...columnNames[from]];
  return {...source,id,name:id+' · '+name,desc,icon:id};
 });
 const byId=id=>catalog.find(t=>t.id===id);
 byId('D08').sample='01 | 계약 체결 | 사양·금액 확정 / 선수금 조건 확인\n02 | 제작 | 제작비 지출 / 중도금 조건 확인\n03 | 납품·검수 | 고객의 인도·성능 확인\n04 | 매출 인식 | 실제 회계정책의 인식 조건 충족 시점\n05 | 잔금 회수 | 계약상 지급일 및 실제 입금 확인';
 contracts.D08.rule+=' 매출 인식은 입금과 별개다. 기간에 걸쳐 인식하는 계약은 제작 단계에 표시하고 별도 순차 단계로 오해하지 않게 수정한다. 선수금·중도금·잔금은 해당 단계 설명에 표시한다.';
 byId('D15').sample='01 | 원재료 준비 | 고객이 공정 투입물을 준비\n02 | ★ 제품 사용 공정 | 이 회사 제품의 역할과 없을 때의 문제\n03 | 후속 공정·검사 | 다음 공정과 품질 확인';
 contracts.D15.rule+=' 강조할 단계명 앞에 ★를 붙인다. 해당 단계의 배경색으로 제품 사용 위치를 강조한다.';
 byId('D16').sample='손실 계약 누적 | 영업 현금 부족 | 지급 부담 증가 | 가상 원인·손익 및 현금흐름 확인\n차입 만기 도래 | 상환자금 확보 실패 | 회생 신청 | 가상 원인·신청서 및 만기 자료 확인';
 templates.splice(0,templates.length,...catalog);
 // Only these twelve types can be selected or newly imported. Base contracts
 // remain private validation helpers for the flow, hierarchy and timeline engines.
 const allowed=new Set(catalog.map(t=>t.id));
 for(const c of reportChapters)c.choices=catalog.map(t=>({name:t.name,type:t.id,need:contracts[t.id].schema}));
 Object.assign(defaultState,{type:'D01',title:byId('D01').name+' (가상 예시)',data:byId('D01').sample,unit:'해당 없음',displayMode:'native'});
 state={...defaultState,...extras({}),displayMode:'native'};
 const types=document.getElementById('promptType');types.replaceChildren();for(const t of catalog){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;types.append(o);}
 const mode=document.getElementById('displayMode');mode.replaceChildren(new Option('도식','native'));mode.hidden=true;document.querySelector('label[for="displayMode"]').hidden=true;
 const more=document.getElementById('templateList').closest('details');more.hidden=true;
 buildTemplates=function(){document.getElementById('templateList').replaceChildren();};
 showChapterTemplates=function(){const host=document.getElementById('chapterTemplateChoices');host.replaceChildren();document.getElementById('newChartTitle').textContent='D번호로 도식 선택';for(const t of catalog){const b=document.createElement('button');b.type='button';b.className='template-choice';b.dataset.diagram=t.id;const title=document.createElement('strong'),location=document.createElement('p'),schema=document.createElement('small');title.textContent=t.name;location.textContent=t.desc;schema.textContent='입력: '+contracts[t.id].schema;b.append(title,location,schema);b.onclick=()=>createProjectChart(t.id,{name:t.name,type:t.id,need:contracts[t.id].schema});host.append(b);}document.getElementById('newChartDialog').showModal();};
 const normalizeBefore=normalizeAnswer;
 normalizeAnswer=function(obj,...rest){if(obj?.type&&!allowed.has(obj.type))throw Error('D번호 목록의 도식 코드만 사용할 수 있습니다. 선택한 도식의 요청문으로 다시 변환해주세요.');const result=normalizeBefore(obj,...rest);if(result&&typeof result==='object')result.displayMode='native';return result;};
 window.diagramCatalog={entries:catalog,allowed};
 buildTemplates();syncControls();render();
})();
