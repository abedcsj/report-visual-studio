'use strict';
const choice=(name,type,need)=>({name,type,need});
const reportChapters=[
 {id:'basic',name:'기업 기본정보',question:'어떤 회사이며, 누가 소유하고 운영하는가?',choices:[choice('기업 개요','overview','회사명·설립일·소재지·주요 사업·임직원 수'),choice('대표이사 이력','ceo','대표 이름·학력·기간별 경력'),choice('주요 경영진','management','이름·직책·담당업무·학력·경력'),choice('지배구조','org','회사명·상위회사·지분율·기준일'),choice('조직도','team','부서명·상위조직·담당자·업무')]},
 {id:'industry',name:'① 산업의 수요',question:'이 산업에 앞으로도 돈이 들어올 이유가 무엇인가?',choices:[choice('산업 범위 좁혀 보기','flow','범용 산업 → 세부 산업 → 실제 시장'),choice('시장 규모·성장 추이','line','기간별 시장 규모·단위·실적과 전망 구분'),choice('지역·시장별 추이 비교','multiline','같은 기간·단위의 계열별 원수치'),choice('수요를 만드는 요인','causes','수요 요인·작용 과정·근거')]},
 {id:'product',name:'② 제품의 수요',question:'산업의 성장이 왜 이 제품의 수요로 연결되는가?',choices:[choice('핵심 제품·사진·작동원리','product','제품명·특징·작동 단계·용도·실제 사진'),choice('고객 공정 속 제품의 위치','flow','고객 공정 순서·제품 사용 위치·역할'),choice('산업 성장 → 제품 수요','causes','산업 변화·제품 필요성·수요 연결 근거')]},
 {id:'advantage',name:'③ 회사의 경쟁력',question:'여러 공급자 중 고객이 왜 이 회사를 선택하는가?',choices:[choice('경쟁사 비교','comparison','회사별 제품·고객·성능·가격·강점의 근거'),choice('경쟁력과 확인 근거','overview','기술·품질·인증·납기·고객관계별 확인 근거'),choice('인증·납품 이력','timeline','날짜·인증 또는 납품 사건·고객·출처')]},
 {id:'revenue',name:'④ 수요 → 매출',question:'좋은 시장 환경이 실제 이 회사의 매출로 연결되는가?',choices:[choice('수요가 매출이 되는 과정','flow','투자 → 발주 → 수주 → 제작 → 납품 → 검수 → 매출'),choice('수주잔고·가동률 추이','line','기간별 동일 지표 수치·단위'),choice('고객·제품별 매출 구성','donut','같은 기간의 중복 없는 구성항목·금액·전체 합계')]},
 {id:'profit',name:'⑤ 매출 → 이익',question:'매출에서 얼마나 이익이 남고, 그 이유는 무엇인가?',choices:[choice('매출에서 이익이 남는 구조','waterfall','매출·원가·판관비·영업이익. 비용은 음수, 합계 일치'),choice('이익률 추이','line','기간별 이익률·산출 기준·단위'),choice('마진 변화 요인','causes','가격·원가·제품 구성·가동률 변화와 이익 영향')]},
 {id:'recurring',name:'⑥ 이익의 반복성과 지속성',question:'올해의 이익을 내년에도 반복할 수 있고, 무엇을 재투자해야 하는가?',choices:[choice('반복수익 구조','cycle','반복발주·교체·유지보수의 실제 순환 단계'),choice('이익·현금·재투자 요약','financial','기간별 이익·영업현금흐름·CAPEX·지표별 단위'),choice('업황과 실적 변동','multiline','동일 단위의 기간별 비교 수치. 단위가 다르면 별도 도표')]},
 {id:'defense',name:'⑦ 초과이익의 방어',question:'경쟁사가 가격과 마진을 훼손하기 어려운 이유는 무엇인가?',choices:[choice('방어 요인과 근거','overview','기술·인증·전환비용별 실제 근거와 한계'),choice('진입장벽이 수익을 지키는 과정','causes','장벽 → 경쟁 제한 또는 고객 유지 → 이익 방어')]},
 {id:'value',name:'⑧ 가치 확대·유지',question:'성장할수록 강해지거나, 현재의 현금창출을 오래 유지할 수 있는가?',choices:[choice('투자·프로젝트 진행','timeline','프로젝트별 날짜·진행 상태·예정과 완료 구분'),choice('성장의 선순환','cycle','규모·원가·기술·고객 증가 사이 검증된 순환 관계'),choice('가치 유지의 핵심 조건','overview','반복수요·시장지위·필요 투자·유지 조건·확인 근거')]},
 {id:'finance',name:'⑨ 재무 상황',question:'실적·현금·부채는 어떤 상태이며, 상환 부담을 감당할 수 있는가?',choices:[choice('핵심 재무 요약','financial','기간별 실적·자산·부채·현금·단위·연결/별도 기준'),choice('차입금 구성','donut','차입 종류·잔액·기준일·전체 합계'),choice('차입금 만기 일정','timeline','만기일·채권자·상환액·단위'),choice('계열사 대여·보증','relations','출발·도착회사·대여 또는 보증·금액·기준일')]},
 {id:'recovery',name:'⑩ 회생 신청 배경과 절차',question:'무엇이 자금 문제로 이어졌고, 절차는 어디까지 진행됐는가?',choices:[choice('회생 신청까지의 배경','causes','사업 문제 → 현금 부족 → 회생 신청의 확인 근거'),choice('회생 절차 진행 경과','timeline','신청·개시·조사·계획안 등의 날짜·완료/예정 구분')]},
 {id:'issues',name:'⑪ 주요 이슈',question:'현재 판단에 영향을 주는 이슈와 확인할 사항은 무엇인가?',choices:[choice('주요 이슈 요약','overview','이슈별 현황·사업 영향·향후 확인 사항'),choice('관련 일정','timeline','발생일·사건·예정된 확인 일정')]},
 {id:'summary',name:'⑫ 최종 종합',question:'이 기업은 왜 계속 돈을 벌 수 있는가?',choices:[choice('수익창출 구조 종합','flow','산업 수요 → 제품 수요 → 경쟁력 → 매출 → 이익 → 반복·방어 → 가치'),choice('투자매력과 판단 조건','overview','핵심 근거·성장형/안정형 구분·한계·추가 확인 자료')]}
];

// Closed-loop diagrams are separate from one-way business flows.
templates.push({id:'cycle',name:'반복·선순환 구조',desc:'마지막 단계에서 처음으로',icon:'↻',help:'순서 | 단계 | 설명',sample:'01 | 제품 공급 | 고객의 운영에 필요한 제품 제공\n02 | 사용·유지보수 | 실제 사용과 관리 서비스\n03 | 교체·추가 발주 | 수요 발생 시 다시 제품 공급'});
contracts.cycle={purpose:'실제로 반복되는 수익 또는 성장의 순환 구조를 보여줍니다.',schema:'순서 | 단계 | 설명',min:2,cols:[3,3],rule:'단계 순서대로 입력하며 마지막에서 첫 번째 단계로 다시 연결된다. 실제 순환 관계의 근거를 확인하고 임의의 선순환을 만들지 않는다. 일방향 관계는 flow를 사용한다. 단계 수 제한 없음. 단위는 해당 없음.'};
columnNames.cycle=['순서','단계','설명'];
const cycleValidation=validateData;validateData=function(type,r){const error=cycleValidation(type,r);if(error)return error;if(type==='cycle'&&r.some(row=>!row[1]))return '단계 이름을 입력해주세요.';return '';};
const cycleOption=document.createElement('option');cycleOption.value='cycle';cycleOption.textContent='반복·선순환 구조';$('#promptType').appendChild(cycleOption);

const clone=value=>JSON.parse(JSON.stringify(value));
let companyProject=null,chapterId='basic',projectChartId=null,projectLoading=false,projectDirty=false,projectGeneration=0,projectSaveTimer=null,projectSaving=null,projectLastError='',companyList=[];
function chapterMeta(){return reportChapters.find(c=>c.id===chapterId)||reportChapters[0];}
function chapterData(id=chapterId){
 if(!companyProject)return null;
 return companyProject.document.sections[id]??={notes:'',questions:'',complete:false,charts:[]};
}
function selectedChart(){return chapterData()?.charts.find(c=>c.id===projectChartId);}
function chapterStatus(section){if(!section)return '미작성';if(section.complete)return '작성·검토 완료';if(section.questions.trim())return '추가 정보 확인 필요';return section.notes.trim()||section.charts.length?'작성 중':'미작성';}
function projectStatus(value){$('#projectSaveStatus').textContent=value;}
function captureProjectChart(){
 if(projectLoading||!companyProject||!projectChartId)return false;
 const chart=selectedChart();if(!chart)return false;
 const value=clone(state);if(JSON.stringify(chart.state)===JSON.stringify(value))return false;
 chart.state=value;return true;
}
function markProjectDirty(){
 if(!companyProject||projectLoading)return;
 projectDirty=true;projectGeneration++;projectStatus('변경사항 저장 대기');clearTimeout(projectSaveTimer);
 projectSaveTimer=setTimeout(()=>flushProject().catch(()=>{}),1000);drawChapterNav();
}
async function persistProjectImages(doc){
 for(const section of Object.values(doc.sections))for(const chart of section.charts)for(const image of chart.state.images||[]){
  if(!image.src&&image.id)throw Error('기존 온라인 사진은 다시 첨부해주세요.');
  delete image.id;
 }
 return doc;
}
async function flushProject(){
 clearTimeout(projectSaveTimer);
 if(projectSaving){await projectSaving;if(projectDirty)return flushProject();return true;}
 if(!companyProject||!projectDirty)return true;
 const project=companyProject,generation=projectGeneration,doc=clone(project.document);projectStatus('저장 중…');
 projectSaving=(async()=>{try{
  await persistProjectImages(doc);
  const result=await api('/api/projects/'+project.id,{method:'PUT',body:JSON.stringify({document:doc,revision:project.revision})});
  project.revision=result.revision;project.updated=result.updated;projectLastError='';
  if(projectGeneration===generation){projectDirty=false;projectStatus('저장됨');try{localStorage.removeItem('reportProjectDraft:'+project.id);}catch{}}
  else projectStatus('새 변경사항 저장 대기');return true;
 }catch(error){projectLastError=error.message;projectStatus(error.message);$('#reloadProjectFromServer').hidden=false;throw error;}finally{projectSaving=null;}})();
 await projectSaving;if(projectDirty)return flushProject();return true;
}
function rememberLocalDraft(){try{if(companyProject&&projectDirty)localStorage.setItem('reportProjectDraft:'+companyProject.id,JSON.stringify({baseRevision:companyProject.revision,document:companyProject.document}));}catch{}}
function drawChapterNav(){
 $('#chapterNav').innerHTML='';
 for(const meta of reportChapters){const button=document.createElement('button');button.className='chapter-button'+(meta.id===chapterId?' active':'');const title=document.createElement('strong'),status=document.createElement('span');title.textContent=meta.name;const section=companyProject?.document.sections[meta.id];status.textContent=chapterStatus(section)+(section?.charts.length?' · 도식 '+section.charts.length+'개':'');button.appendChild(title);button.appendChild(status);button.onclick=()=>selectChapter(meta.id);$('#chapterNav').appendChild(button);}
}
function drawChartTabs(){
 const list=$('#chapterChartList');list.innerHTML='';
 for(const chart of chapterData()?.charts||[]){const button=document.createElement('button');button.className='btn'+(chart.id===projectChartId?' active':'');button.textContent=chart.name||chart.state.title||'도식';button.onclick=()=>openProjectChart(chart.id);list.appendChild(button);}
}
function setChartVisibility(){
 const selected=!!selectedChart();$('#canvas').hidden=!selected;$('#emptyChapter').hidden=selected;$('#projectWorkspace').classList.toggle('no-chart',!selected);
 $('#chartEditor').hidden=!selected;
 for(const id of ['pngBtn','svgBtn','copyBtn'])$('#'+id).disabled=!selected;
 for(const id of ['saveBtn','loadBtn'])$('#'+id).disabled=!companyProject;
 if(selected)$('#chartName').value=selectedChart().name||state.title;
}
async function hydrateChart(raw){
 const candidate=clone(raw);candidate.images=await Promise.all((candidate.images||[]).map(async image=>{
  if(image.id&&!image.src){throw Error('기존 온라인 사진은 다시 첨부해주세요.');}return image;
 }));
 // Invalid drafts are still editable; do not reject unfinished rows on reopen.
 return {...defaultState,...candidate,...extras(candidate)};
}
let openSequence=0;
async function openProjectChart(id){
 if(captureProjectChart())markProjectDirty();const chart=chapterData()?.charts.find(c=>c.id===id);if(!chart)return;
 const sequence=++openSequence;projectStatus('도식을 불러오는 중…');
 try{const candidate=await hydrateChart(chart.state);if(sequence!==openSequence)return;projectLoading=true;projectChartId=id;state=candidate;beforeImport=null;syncControls();render();projectLoading=false;drawChartTabs();setChartVisibility();projectStatus(projectDirty?'변경사항 저장 대기':'저장됨');}
 catch(error){projectLoading=false;projectStatus(error.message);}
}
function selectChapter(id){
 if(captureProjectChart())markProjectDirty();openSequence++;chapterId=id;projectChartId=null;const section=chapterData(),meta=chapterMeta();
 $('#chapterTitle').textContent=meta.name;$('#chapterQuestion').textContent=meta.question;$('#chapterNotes').value=section.notes;$('#chapterQuestions').value=section.questions;$('#chapterComplete').checked=section.complete;$('#chapterNotesPanel').open=!section.charts.length;
 drawChapterNav();drawChartTabs();setChartVisibility();
 if(section.charts.length)openProjectChart(section.charts[0].id);
}
async function loadCompanyList(){
 $('#companyHomeStatus').textContent='기업과 기존 보관 자료를 불러오는 중…';
 try{await api('/api/projects/import-legacy',{method:'POST'});companyList=(await api('/api/projects')).items;$('#companyCards').innerHTML='';
  for(const item of companyList){const button=document.createElement('button');button.className='company-card';const title=document.createElement('strong'),date=document.createElement('span'),action=document.createElement('span');title.textContent=item.name;date.textContent='최근 저장 '+new Date(item.updated).toLocaleString('ko-KR');action.textContent='보고서 이어서 작성 →';button.appendChild(title);button.appendChild(date);button.appendChild(action);button.onclick=()=>openCompany(item.id);$('#companyCards').appendChild(button);}
  $('#companyHomeStatus').textContent=companyList.length?companyList.length+'개 기업 · 이 브라우저에 저장된 자료입니다.':'새 기업을 추가해 보고서를 시작하세요.';
 }catch(error){$('#companyHomeStatus').textContent=error.message;}
}
async function openCompany(id){
 if(projectLoading)return;projectLoading=true;$('#companyHomeStatus').textContent='기업의 보고서를 여는 중…';
 try{await flushProject();const project=await api('/api/projects/'+id);project.document.sections??={};
  companyProject=project;projectDirty=false;projectLastError='';projectChartId=null;reportReadSequence++;reportReview={name:'보고서',text:'',candidates:[]};$('#reportSource').textContent='';$('#reportRecommendations').innerHTML='';$('#reportText').value='';$('#reportExtracted').hidden=true;$('#copyReportPrompt').disabled=true;$('#reportStatus').textContent=project.name+' 보고서를 첨부해주세요.';
  $('#currentCompany').textContent='현재 기업: '+project.name;$('#companyHome').hidden=true;$('#projectWorkspace').hidden=false;$('#companyIndicator').hidden=false;$('#projectActions').hidden=false;$('#reloadProjectFromServer').hidden=true;$('#recoverLocalDraft').hidden=true;
  projectLoading=false;selectChapter('basic');projectStatus('저장됨');
  try{const draft=JSON.parse(localStorage.getItem('reportProjectDraft:'+id));if(draft&&draft.baseRevision===project.revision){companyProject.document=draft.document;selectChapter('basic');markProjectDirty();toast('저장되지 않았던 이 기업의 초안을 복구했습니다.');}else if(draft){$('#recoverLocalDraft').hidden=false;toast('최신 저장본을 열었습니다. 이전 초안은 복구 초안 내려받기로 보관할 수 있습니다.');}}catch{}
 }catch(error){projectLoading=false;$('#companyHomeStatus').textContent=error.message;projectStatus(error.message);}
}
async function returnToCompanies(){
 if(captureProjectChart())markProjectDirty();
 try{await flushProject();openSequence++;reportReadSequence++;companyProject=null;projectChartId=null;state={...defaultState,...extras({})};$('#projectWorkspace').hidden=true;$('#companyIndicator').hidden=true;$('#projectActions').hidden=true;$('#companyHome').hidden=false;await loadCompanyList();}
 catch(error){toast('저장되지 않아 기업 변경을 멈췄습니다. 지금 저장을 누르거나 기업 작업을 백업해주세요.');projectStatus(error.message);}
}
function createProjectChart(type,preset){
 if(!companyProject)return;if(captureProjectChart())markProjectDirty();
 const template=templates.find(t=>t.id===type);if(!template)return;
 const name=preset?.name||template.name;
 const newState={...defaultState,...extras({}),type,data:template.sample,title:name+' (가상 예시)',subtitle:'원자료로 교체한 뒤 보고서에 사용하세요',source:'가상 예시 · 원자료로 교체',unit:['bar','line','waterfall','donut','multiline'].includes(reportBaseType(type))?'원자료 단위':'항목별 표기'};
 const chart={id:crypto.randomUUID(),name,state:newState,preset:preset||{name,type,need:contracts[type].schema}};chapterData().charts.push(chart);markProjectDirty();$('#newChartDialog').close();openProjectChart(chart.id);$('#chapterNotesPanel').open=false;
}
function showChapterTemplates(){
 const container=$('#chapterTemplateChoices');container.innerHTML='';$('#newChartTitle').textContent=chapterMeta().name+' · 도식 추가';
 for(const preset of chapterMeta().choices){const button=document.createElement('button');button.className='template-choice';const title=document.createElement('strong'),desc=document.createElement('p'),need=document.createElement('small');title.textContent=preset.name;desc.textContent=templates.find(t=>t.id===preset.type).name;need.textContent='필요한 자료: '+preset.need;button.appendChild(title);button.appendChild(desc);button.appendChild(need);button.onclick=()=>createProjectChart(preset.type,preset);container.appendChild(button);}
 $('#newChartDialog').showModal();
}
const projectRender=render;render=function(){projectRender();if(captureProjectChart()){markProjectDirty();rememberLocalDraft();}if(companyProject)setChartVisibility();};
const projectBuildTemplates=buildTemplates;buildTemplates=function(){projectBuildTemplates();document.querySelectorAll('.template').forEach(button=>{button.onclick=()=>createProjectChart(button.dataset.id);});};
const projectOpenWorkflow=openWorkflow;openWorkflow=function(pane){
 if(!selectedChart()){showChapterTemplates();return;}
 const chart=selectedChart();$('#requestGoal').value='대상 기업: '+companyProject.name+'\n보고서 목차: '+chapterMeta().name+'\n핵심 질문: '+chapterMeta().question+'\n만들 도식: '+chart.name+'\n필요한 자료: '+(chart.preset?.need||contracts[state.type].schema)+'\n이 항목의 보고서 본문:\n'+chapterData().notes+'\n추가 확인 사항:\n'+chapterData().questions;
 projectOpenWorkflow(pane);
};
$('#newChapterChart').onclick=showChapterTemplates;$('#closeNewChart').onclick=()=>$('#newChartDialog').close();
for(const [id,key] of [['chapterNotes','notes'],['chapterQuestions','questions']])$('#'+id).oninput=()=>{chapterData()[key]=$('#'+id).value;markProjectDirty();rememberLocalDraft();};
$('#chapterComplete').onchange=()=>{chapterData().complete=$('#chapterComplete').checked;markProjectDirty();rememberLocalDraft();};
$('#chartName').oninput=()=>{if(selectedChart()){selectedChart().name=$('#chartName').value;drawChartTabs();markProjectDirty();}};
$('#duplicateChart').onclick=()=>{if(!selectedChart())return;captureProjectChart();const copy=clone(selectedChart());copy.id=crypto.randomUUID();copy.name+=' 복사';chapterData().charts.push(copy);markProjectDirty();openProjectChart(copy.id);};
let deleteArmed=null;$('#deleteChart').onclick=()=>{if(!projectChartId)return;if(deleteArmed!==projectChartId){deleteArmed=projectChartId;$('#deleteChart').textContent='정말 삭제';return;}const section=chapterData();section.charts=section.charts.filter(c=>c.id!==projectChartId);projectChartId=null;deleteArmed=null;$('#deleteChart').textContent='삭제';markProjectDirty();selectChapter(chapterId);};
$('#changeCompany').onclick=returnToCompanies;$('#reloadCompanies').onclick=loadCompanyList;
$('#saveProjectNow').onclick=async()=>{try{if(captureProjectChart())markProjectDirty();await flushProject();toast('기업 작업을 저장했습니다.');}catch(error){projectStatus(error.message);}};
$('#createCompanyForm').onsubmit=async event=>{event.preventDefault();const name=$('#newCompanyName').value.trim();if(!name)return;$('#createCompanyButton').disabled=true;try{const project=await api('/api/projects',{method:'POST',body:JSON.stringify({name})});$('#newCompanyName').value='';await openCompany(project.id);}catch(error){$('#companyHomeStatus').textContent=error.message;}finally{$('#createCompanyButton').disabled=false;}};
$('#backupProject').onclick=()=>{if(!companyProject)return;captureProjectChart();download(new Blob([JSON.stringify({format:'report-company-v1',company:companyProject.name,document:companyProject.document},null,2)],{type:'application/json'}),companyProject.name.replace(/[^\w가-힣]+/g,'_')+'_기업작업.json');};
$('#recoverLocalDraft').onclick=()=>{try{const draft=JSON.parse(localStorage.getItem('reportProjectDraft:'+companyProject.id));if(draft)download(new Blob([JSON.stringify({format:'report-company-v1',company:companyProject.name,document:draft.document},null,2)],{type:'application/json'}),'기업작업_복구초안.json');}catch{toast('복구 초안을 읽지 못했습니다.');}};
$('#reloadProjectFromServer').onclick=async()=>{const id=companyProject?.id;if(!id)return;$('#backupProject').onclick();if(projectSaving)try{await projectSaving;}catch{}clearTimeout(projectSaveTimer);projectDirty=false;await openCompany(id);};
$('#restoreProject').onclick=()=>$('#projectBackupInput').click();
$('#fileInput').onchange=async event=>{const file=event.target.files[0];if(!file||!companyProject||!projectChartId)return;const companyId=companyProject.id,chartId=projectChartId;try{const raw=JSON.parse(await file.text());if(companyProject?.id!==companyId||projectChartId!==chartId){toast('작업 위치가 바뀌어 불러오기를 취소했습니다.');return;}state=normalizeAnswer(raw,true);syncControls();render();toast('현재 기업의 도식에 작업 파일을 적용했습니다.');}catch(error){toast(error.message||'작업 파일을 읽지 못했습니다.');}event.target.value='';};
$('#projectBackupInput').onchange=async event=>{const file=event.target.files[0];if(!file||!companyProject)return;try{const obj=JSON.parse(await file.text());if(obj.format!=='report-company-v1'||obj.company!==companyProject.name||!obj.document?.sections)throw Error('현재 선택한 기업의 작업 백업 파일을 선택해주세요.');
 for(const [key,section] of Object.entries(obj.document.sections)){if(!reportChapters.some(c=>c.id===key)||!Array.isArray(section.charts))throw Error('백업의 목차 형식이 올바르지 않습니다.');for(const chart of section.charts)if(!contracts[chart.state?.type]||typeof chart.state.data!=='string')throw Error('백업의 도식 형식을 확인해주세요.');}
 // Merge without overwriting current work; imported diagrams get new identities.
 for(const [key,section] of Object.entries(obj.document.sections)){const target=chapterData(key);target.notes=[target.notes,section.notes].filter(Boolean).join('\n\n');target.questions=[target.questions,section.questions].filter(Boolean).join('\n');target.charts.push(...section.charts.map(c=>({...c,id:crypto.randomUUID()})));}
 projectChartId=null;selectChapter(chapterId);markProjectDirty();await flushProject();toast('현재 기업에 백업 내용을 추가했습니다.');
 }catch(error){toast(error.message);}event.target.value='';};
// Company-only chart shelf; the legacy all-company modal is no longer opened.
$('#shelfBtn').onclick=()=>{const container=$('#chapterTemplateChoices');container.innerHTML='';$('#newChartTitle').textContent=companyProject.name+' · 저장된 도식';for(const meta of reportChapters)for(const chart of chapterData(meta.id).charts){const button=document.createElement('button');button.className='template-choice';button.textContent=meta.name+' / '+chart.name;button.onclick=()=>{selectChapter(meta.id);openProjectChart(chart.id);$('#newChartDialog').close();};container.appendChild(button);}if(!container.children.length)container.textContent='아직 도식이 없습니다. 목차에서 도식을 추가하세요.';$('#newChartDialog').showModal();};
window.addEventListener('beforeunload',event=>{if(projectDirty){rememberLocalDraft();event.preventDefault();event.returnValue='';}});
window.addEventListener('online',()=>{if(projectDirty)flushProject().catch(()=>{});});
buildTemplates();loadCompanyList();
