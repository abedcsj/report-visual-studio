'use strict';

// Local pattern-based review. No model endpoint and no report upload request.
const reviewRules=[
 {type:'overview',pattern:/기업\s*개요|회사\s*개요|설립|소재지|임직원/,reason:'흩어진 회사 기본정보를 한 장의 개요로 묶을 수 있습니다.',checks:[['설립·주소 등 기본정보',/설립|소재지|주소/],['주요 사업',/주요\s*사업|제조|유통|서비스/]],questions:['대표이사·주주·임직원 수의 기준일을 확인해주세요.']},
 {type:'org',pattern:/지배\s*구조|최대\s*주주|모회사|자회사|지분율|계열사/,reason:'주주와 계열사의 관계를 문장보다 연결 구조로 보여주기 좋습니다.',checks:[['상·하위 회사 관계',/모회사|자회사|보유|산하/],['지분 또는 관계 설명',/지분|보유|%|자회사/]],questions:['회사별 정확한 상위회사와 기준일을 확인해주세요. 여러 주주·순환출자가 있으면 단순 트리에 그대로 넣을 수 없습니다.']},
 {type:'team',pattern:/조직도|조직\s*구성|경영지원본부|영업팀|생산팀|보고\s*체계/,reason:'부서와 팀의 보고 관계를 조직도로 정리할 수 있습니다.',checks:[['부서·팀 이름',/본부|부서|팀/],['보고 관계',/산하|직속|보고|소속|총괄/]],questions:['각 부서의 바로 위 조직과 담당자·업무를 확인해주세요.']},
 {type:'ceo',pattern:/대표이사.*(?:학력|이력|경력)|(?:학력|이력|경력).*대표이사|대표자\s*약력/s,reason:'대표이사의 학력과 경력을 인물 소개로 분리하면 읽기 쉽습니다.',checks:[['대표이사 정보',/대표이사|대표자/],['학력',/대학교|대학원|학사|석사|박사|졸업/],['경력 기간',/(?:19|20)\d{2}|년간|년부터/]],questions:['동명이인 여부와 전직·현직, 각 경력의 시작·종료 시점을 확인해주세요.']},
 {type:'management',pattern:/주요\s*(?:경영진|임원)|경영진|상무|전무|부사장|CFO|CEO/i,reason:'여러 경영진의 직책과 역할을 인물별로 비교할 수 있습니다.',checks:[['직책',/대표|상무|전무|이사|CFO|CEO/i],['담당 업무',/담당|총괄|책임|재무|생산|영업/]],questions:['인물별 이름·직책·담당·학력·경력과 재직 기준일을 확인해주세요. 없는 학력은 추정하지 않습니다.']},
 {type:'product',pattern:/핵심\s*제품|주요\s*제품|작동\s*원리|장비|스퍼터링|펌프|공정|제품\s*소개/,reason:'제품 소개와 실제 작동 순서를 묶고 사진·주석을 덧붙일 수 있습니다.',checks:[['제품·장비 이름 단서',/제품|장비|펌프|시스템|grower|degassing/i],['작동 순서·구성',/작동|원리|구성|투입|가열|회전|배출|단계|→/],['용도·적용처',/용도|사용|적용|납품|고객/]],questions:['실제 제품명과 작동 단계의 순서를 확인해주세요. 제품 사진·부품명·성능 수치의 근거가 있으면 함께 준비해주세요.']},
 {type:'flow',pattern:/사업\s*구조|매입.*판매|생산.*납품|매출\s*인식|돈을\s*버는|수주.*검수/s,reason:'매입·생산·납품·매출로 이어지는 흐름을 단계별로 보여줄 수 있습니다.',checks:[['입력 또는 공급',/매입|원재료|발주|수주|공급/],['판매 또는 수익 발생',/판매|납품|매출|검수|수수료/]],questions:['실제 거래 순서, 주요 고객, 매출이 인식되는 시점을 확인해주세요.']},
 {type:'financial',pattern:/재무|매출|영업이익|순이익|EBITDA|차입금|부채|현금흐름/i,reason:'기간별 실적과 재무 상태를 한 표에서 비교할 수 있습니다.',checks:[['수치',/\d[\d,.]*\s*(?:억|만|원|%|조)|\d[\d,.]*\s*\|/],['기준기간',/(?:19|20)\d{2}|당기|전기|반기|분기/],['단위',/억원|백만원|천원|원|%|조원/]],questions:['연결·별도 기준, 동일 기간 길이, 지표별 단위를 확인해주세요. 직전 기간 값이 없으면 증감률을 계산할 수 없습니다.']},
 {type:'line',pattern:/추이|성장률|시장\s*규모|가격\s*변동|출하량|판매량/,reason:'시간에 따른 한 지표의 변화를 선으로 보여줄 수 있습니다.',checks:[['둘 이상의 기간',t=>new Set(t.match(/(?:19|20)\d{2}(?:[.년/-]\s*\d{1,2})?/g)||[]).size>=2],['수치와 단위',/\d[\d,.]*\s*(?:억|만|원|%|톤|대|개|MSI)/i]],questions:['기간별 원수치와 단위를 준비해주세요. 누락 기간과 연간·분기 누계 혼용 여부를 확인해주세요.']},
 {type:'multiline',pattern:/(?:제주[\s\S]*전국|전국[\s\S]*제주|지역별|회사별|계열별|복수\s*계열)/,reason:'여러 지역·회사의 같은 지표를 한 그래프에서 비교할 후보입니다.',checks:[['기간',/(?:19|20)\d{2}|월별|연도별|분기/],['추이 또는 가격 비교 맥락',/추이|가격|매출|기간|연도|판매량/]],questions:['계열별 동일 기간 수치·동일 단위가 필요합니다. 단위가 다르거나 서로 다른 지표이면 별도 그래프로 나누세요.']},
 {type:'donut',pattern:/매출\s*비중|구성비|사업부문별|제품별\s*비중|비중.*%/,reason:'같은 전체를 구성하는 항목들의 비중을 보여줄 수 있습니다.',checks:[['구성항목',/부문|제품|사업|구성|비중/],['구성비 또는 금액',/\d[\d,.]*\s*(?:%|억|원)/]],questions:['같은 기준기간의 전체 합계와 빠진 항목이 없는지 확인해주세요. 합계 행은 중복해서 넣지 않습니다.']},
 {type:'bar',pattern:/항목별|제품별\s*매출|회사별\s*매출|실적\s*비교/,reason:'동일 단위의 항목별 크기를 막대로 비교할 수 있습니다.',checks:[['비교 수치',/\d[\d,.]*\s*(?:억|원|%|톤|대|개)/]],questions:['동일한 지표·단위·기간인지 확인해주세요. 여러 기간의 추이라면 추이 차트가 더 적합할 수 있습니다.']},
 {type:'comparison',pattern:/경쟁사|경쟁업체|동종\s*업체|경쟁\s*비교|경쟁력\s*비교/,reason:'경쟁사별 제품·고객·강점을 같은 기준으로 나란히 볼 수 있습니다.',checks:[['비교항목',/제품|고객|매출|강점|점유율|기술/]],questions:['실제 비교할 회사명과 회사별 같은 항목의 정보를 준비해주세요. 숫자의 단위·기준기간을 통일해주세요.']},
 {type:'relations',pattern:/대여금|지급\s*보증|특수관계자|내부거래|매출채권|차입.*보증/s,reason:'회사 사이 자금·거래의 방향을 화살표로 설명할 수 있습니다.',checks:[['관계 종류',/대여|보증|매출|매입|채권|차입/],['금액',/\d[\d,.]*\s*(?:억|만|원|조)/]],questions:['출발회사·도착회사·금액·기준일을 확인해주세요. 지급보증은 보증인→보증채권자이며 실제 차입자는 설명에 따로 적습니다.']},
 {type:'timeline',pattern:/회생|개시\s*결정|신청|주요\s*일정|연혁|인수.*완료|투자.*일정/s,reason:'신청·결정·투자 등 사건의 순서를 가로 타임라인으로 보여줄 수 있습니다.',checks:[['사건 날짜',/(?:19|20)\d{2}|\d{1,2}월/],['사건 내용',/신청|결정|제출|완료|체결|설립|인수|투자/]],questions:['각 사건의 날짜와 예정·완료 여부를 확인해주세요. 사건 간 간격은 실제 시간 길이에 비례하지 않습니다.']},
 {type:'causes',pattern:/원인|영향|때문|따라.*감소|원가.*상승|운전자금.*부담/s,reason:'원인에서 재무·사업상의 결과로 이어지는 연결을 설명할 수 있습니다.',checks:[['원인과 결과 연결',/때문|인해|따라|이어|초래|원인|→/]],questions:['사실로 확인된 인과관계와 분석가의 추론을 구분해주세요. 단순한 동시 발생을 원인으로 확정하지 않습니다.']},
 {type:'waterfall',pattern:/증감\s*요인|기초\s*현금|기말\s*현금|현금.*브리지|이익.*브리지/s,reason:'시작 금액이 증감 요인을 거쳐 최종 금액이 되는 구조를 보여줄 수 있습니다.',checks:[['시작·종료 잔액',/기초|기말|시작|종료/],['증감 수치',/\d[\d,.]*\s*(?:억|원|만)/]],questions:['시작 잔액·항목별 증가/감소액·종료 잔액이 필요합니다. 합계가 정확히 일치하는지 확인해주세요.']}
];
function splitReportSections(blocks){
 const sections=[];let current={heading:'본문',blocks:[]};
 for(const block of blocks){
  if(!block.text.trim())continue;
  if(block.heading){if(current.blocks.length)sections.push(current);current={heading:block.text,blocks:[]};}
  else current.blocks.push(block);
 }
 if(current.blocks.length)sections.push(current);return sections;
}
function looksLikeHeading(text){return text.length<90&&(/^(?:#{1,6}\s|(?:[1-9]|[1-9]\d)[.)、]\s|[①②③④⑤⑥⑦⑧⑨⑩]\s)/.test(text)||/^(?:기업\s*개요|회사\s*개요|사업\s*구조|주요\s*제품|재무\s*(?:현황|분석)|지배\s*구조|주요\s*경영진|주요\s*일정|회생\s*진행|산업\s*현황|경쟁사\s*비교|목차)$/.test(text.trim()));}
function blocksFromText(text){return text.split(/\r?\n/).map(line=>({text:line.trim(),heading:looksLikeHeading(line.trim())})).filter(b=>b.text);}
function blocksFromHTML(html){
 const doc=new DOMParser().parseFromString(html,'text/html'),blocks=[];
 for(const element of doc.body.children){
  if(element.tagName==='TABLE'){
   const table=[...element.querySelectorAll('tr')].map(row=>[...row.children].map(cell=>cell.textContent.trim().replace(/\s+/g,' ')));
   blocks.push({text:table.map(row=>row.join(' | ')).join('\n'),table});
  }else{
   const value=element.textContent.trim();if(!value)continue;
   blocks.push({text:value,heading:/^H[1-6]$/.test(element.tagName)||looksLikeHeading(value)});
  }
 }
 return blocks;
}
function analyzeSections(sections){
 const candidates=[];
 sections.forEach((section,index)=>{
  if(/^목차$|^contents$/i.test(section.heading.trim()))return;
  const body=section.blocks.map(b=>b.text).join('\n'),full=section.heading+'\n'+body;
  for(const rule of reviewRules){
   // Heading-only mentions are not evidence of usable report content.
   const evidence=section.blocks.filter(b=>rule.pattern.test(b.text));
   if(!evidence.length&&!(rule.pattern.test(section.heading)&&section.blocks.some(b=>b.table||b.text.length>30)))continue;
   const signals=rule.checks.map(([label,check])=>({label,found:typeof check==='function'?check(full):check.test(full)}));
   candidates.push({type:rule.type,section:section.heading,index,reason:rule.reason,signals,questions:rule.questions,evidence:(evidence.length?evidence:section.blocks).map(b=>b.text).join('\n'),source:full});
  }
 });return candidates;
}
let reportReview={name:'보고서',text:'',candidates:[]},reportReadSequence=0;
function installReview(blocks,name){
 const sections=splitReportSections(blocks),text=blocks.map(b=>b.text).join('\n\n');
 if(!text.trim())throw Error('읽을 수 있는 본문이 없습니다. 이미지로 된 문서는 본문을 직접 붙여넣어주세요.');
 const candidates=analyzeSections(sections);reportReview={name,text,candidates};
 $('#reportSource').textContent=text;$('#reportExtracted').hidden=false;$('#copyReportPrompt').disabled=false;showRecommendations();
 $('#reportStatus').textContent=name+' · '+sections.length+'개 본문 구간 · '+candidates.length+'개 추천 후보. 이미지 속 글자와 도형, 일부 머리글은 분석되지 않으므로 추출한 원문도 확인해주세요.';
}
function reportPrompt(){
 return ['첨부하거나 아래 붙여넣은 기업보고서를 읽고, 기업보고서 비주얼 스튜디오에 넣을 도표·도식의 적용 계획을 작성해줘.',
 '목적: 보고서를 읽고 내가 어떤 내용을 어떤 도식으로 만들지, 그 전에 무슨 정보를 더 구해야 하는지 한 번에 파악하는 것.',
 '각 후보마다 보고서 소제목/원문 근거 → 추천 유형 → 보여줄 핵심 메시지 → 이미 있는 데이터 → 추가로 필요한 정확한 정보/질문 → 삽입 위치를 표로 정리해.',
 '문서에 없는 수치·지분·관계·경력·날짜를 만들지 마. 단순 키워드가 아니라 실제 내용과 자료의 충분성을 판단해. 중복 후보는 합치고 시각화가 불필요한 문단은 그대로 두어도 된다고 알려줘. 항목 수에 상한을 두지 마.',
 '사이트의 자동 추천은 패턴 기반 초안이므로 잘못된 추천은 수정해. 추가 자료가 필요한 것과 바로 변환 가능한 것을 구분해. 이 단계에서는 모든 도식을 억지로 생성하지 마.',
 '사용 가능한 유형과 정확한 입력 형식:',...templates.map(t=>t.id+' / '+t.name+' / '+contracts[t.id].schema.split('\n')[0]),
 '제품 작동원리는 같은 제품 아래 여러 단계로 묶고, 사진은 사용자가 사이트에서 첨부한다. 타임라인은 가로형, 지배구조는 회사 관계, 조직도는 내부 부서 관계다.',
 '', '[보고서: '+reportReview.name+']',reportReview.text].join('\n');
}
function candidatePrompt(candidate){
 return promptFor(candidate.type,'보고서 「'+reportReview.name+'」의 「'+candidate.section+'」에 넣을 시각 자료. '+candidate.reason+'\n먼저 확인할 사항: '+candidate.questions.join(' ')+'\n문서에서 충분히 확인되는 경우에만 변환하고, 불확실하면 구체적인 추가 정보 질문을 해줘.\n[해당 구간 원문]\n'+candidate.source);
}
async function copyReviewText(value){
 try{await navigator.clipboard.writeText(value);toast('원문과 요청문을 함께 복사했습니다. ChatGPT에 붙여넣어주세요.');}
 catch{const area=document.createElement('textarea');area.value=value;area.setAttribute('aria-label','복사할 요청문');$('#reportRecommendations').prepend(area);area.focus();area.select();toast('요청문을 선택했습니다. Ctrl+C 또는 ⌘C로 복사해주세요.');}
}
function showRecommendations(){
 const list=$('#reportRecommendations');list.innerHTML='';
 if(!reportReview.candidates.length){const p=document.createElement('p');p.textContent='명확한 도식 후보를 찾지 못했습니다. 전체 검토 요청문을 복사하면 ChatGPT에서 보고서의 문맥을 검토할 수 있습니다.';list.appendChild(p);return;}
 for(const candidate of reportReview.candidates){
  const template=templates.find(t=>t.id===candidate.type),card=document.createElement('article');card.className='recommendation';
  const section=document.createElement('p');section.className='section-label';section.textContent='삽입 후보: '+candidate.section+' · 본문 구간 '+(candidate.index+1);card.appendChild(section);
  const title=document.createElement('h3');title.textContent=template.name;card.appendChild(title);
  const reason=document.createElement('p');reason.textContent=candidate.reason;card.appendChild(reason);
  const details=document.createElement('details'),summary=document.createElement('summary'),evidence=document.createElement('div');summary.textContent='추천 근거가 된 원문 보기';evidence.className='evidence';evidence.textContent=candidate.evidence;details.appendChild(summary);details.appendChild(evidence);card.appendChild(details);
  const checks=document.createElement('ul');for(const signal of candidate.signals){const item=document.createElement('li');item.className=signal.found?'found-label':'check-label';item.textContent=signal.label+' — '+(signal.found?'문서에 관련 단서 있음 · 정확성 확인':'이 구간에서 단서 미확인 · 자료 확인 필요');checks.appendChild(item);}card.appendChild(checks);
  const label=document.createElement('p');label.className='check-label';label.textContent='추가로 확인할 내용';card.appendChild(label);
  const questions=document.createElement('ul');for(const question of candidate.questions){const item=document.createElement('li');item.textContent=question;questions.appendChild(item);}card.appendChild(questions);
  const button=document.createElement('button');button.className='btn primary';button.textContent='이 내용의 변환 요청문 복사';button.onclick=()=>copyReviewText(candidatePrompt(candidate));card.appendChild(button);list.appendChild(card);
 }
}
$('#reportReviewBtn').onclick=()=>$('#reportDialog').showModal();$('#closeReport').onclick=()=>$('#reportDialog').close();
$('#copyReportPrompt').onclick=()=>copyReviewText(reportPrompt());
$('#analyzeReportText').onclick=()=>{reportReadSequence++;try{installReview(blocksFromText($('#reportText').value),'붙여넣은 보고서');}catch(e){$('#reportStatus').textContent=e.message;}};
$('#reportFile').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;const sequence=++reportReadSequence;
 if(!/\.docx$/i.test(file.name)){$('#reportStatus').textContent='워드에서 .docx로 저장한 뒤 첨부해주세요. .doc 파일은 본문을 복사해 붙여넣어도 됩니다.';return;}
 $('#reportStatus').textContent='보고서의 문단과 표를 읽는 중…';
 try{
  const result=await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{convertImage:mammoth.images.imgElement(()=>Promise.resolve({src:'',alt:'문서에 포함된 이미지'}))});
  if(sequence!==reportReadSequence)return;installReview(blocksFromHTML(result.value),file.name);
  if(result.messages?.length)$('#reportStatus').textContent+=' 문서 변환 알림이 있어 표와 추출 원문의 누락 여부를 확인해주세요.';
 }catch{if(sequence===reportReadSequence)$('#reportStatus').textContent='문서를 읽지 못했습니다. 암호를 해제한 .docx를 사용하거나 본문을 직접 붙여넣어주세요. 기존 검토 결과는 유지됩니다.';}
 event.target.value='';
};

// Keep photo upload visible and show the selected product's current image.
function updatePhotoPreview(){
 const product=$('#photoProduct').value,photo=(state.images||[]).find(p=>p.product===product);$('#photoPreview').hidden=!photo;
 if(photo){$('#photoPreview').src=photo.src;$('#photoStatus').textContent=product+' · 사진이 추가되어 있습니다.';}else{$('#photoPreview').removeAttribute('src');$('#photoStatus').textContent=product?product+' 사진을 선택해주세요.':'제품 데이터를 먼저 입력해주세요.';}
}
const photoSync=syncControls;syncControls=function(){photoSync();updatePhotoPreview();};
const photoRender=render;render=function(){photoRender();if(state.type==='product')updatePhotoPreview();};
$('#photoProduct').onchange=updatePhotoPreview;
const drop=$('#photoDrop');drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('dragover');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('dragover');if(event.dataTransfer.files.length)$('#photoInput').onchange({target:{files:event.dataTransfer.files,value:''}});});
syncControls();
