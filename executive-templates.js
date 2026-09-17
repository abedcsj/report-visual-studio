'use strict';
(()=>{
 const items=[
  {id:'executive_business',name:'기업과 사업 한눈에 보기',base:'overview',layout:'matrix',columns:['사업·제품','고객·용도','매출 발생 방식','현재 상황·근거'],sample:'정밀장비 | 제조사 생산공정 | 제작·납품·검수 후 매출 | 가상 예시·계약과 매출인식 기준 확인 필요'},
  {id:'executive_ownership',name:'핵심 지분·지배구조',base:'org',columns:['단계','회사·주주','관계·지분율','상위 주체'],sample:'0 | 예시홀딩스 | 최상위 주주 |\n1 | 분석대상기업 | 직접 지분 70%·가상 수치 | 예시홀딩스\n1 | 예시계열사 | 형제 계열사·가상 수치 | 예시홀딩스'},
  {id:'executive_financial',name:'핵심 재무 요약',base:'financial',columns:['지표','기간','값','단위'],sample:'매출액 | 2023 | 100 | 억원\n매출액 | 2024 | 120 | 억원\n매출액 | 2025 | 150 | 억원\n영업이익 | 2023 | 8 | 억원\n영업이익 | 2024 | 10 | 억원\n영업이익 | 2025 | 12 | 억원'},
  {id:'executive_highlights',name:'투자 하이라이트와 성립 조건',base:'overview',layout:'matrix',columns:['핵심 판단','확인한 근거','가치에 미치는 영향','성립 조건·추가 확인'],sample:'반복수요 가능성 | 기존 고객의 재발주 이력·자료 확인 필요 | 매출 안정성에 기여 가능 | 반복매출 비중과 고객 유지율 확인\n수익성 개선 가능성 | 고부가 제품 비중 변화·자료 확인 필요 | 이익과 현금 증가 가능 | 원가·운전자금·추가 CAPEX 확인'}
 ];
 for(const t of items){specializedTypes[t.id]={base:t.base,columns:t.columns,...(t.layout?{layout:t.layout}:{})};columnNames[t.id]=t.columns;templates.push({id:t.id,name:t.name,desc:'Executive Summary 전용',icon:'E',help:t.columns.join(' | '),sample:t.sample});contracts[t.id]={purpose:t.name,schema:t.columns.join(' | '),cols:[t.columns.length,t.columns.length],min:1,rule:'Executive Summary에 필요한 핵심만 요약하되 항목 수는 제한하지 않는다. 근거 없는 수치를 만들지 않는다. 재무는 기간·단위·연결/별도를 일치시킨다. 지분은 직접·간접 지배와 형제 계열사를 구분한다. 투자 하이라이트에는 성립 조건과 추가 확인 사항을 함께 적는다.'};const option=document.createElement('option');option.value=t.id;option.textContent='Executive Summary · '+t.name;document.getElementById('promptType').append(option);}
 reportChapters.find(c=>c.id==='executive').choices=items.map(t=>({name:t.name,type:t.id,need:t.columns.join('·')}));
 buildTemplates();drawChapterNav();
})();
