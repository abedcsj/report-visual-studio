'use strict';
// GitHub Pages: transactions serialize writes across tabs; photos stay in documents.
const localDatabase = new Promise((resolve, reject) => {
 const request = indexedDB.open('report-visual-studio-pages:' + location.pathname.replace(/index\.html$/, ''), 1);
 request.onupgradeneeded = () => {
  const store = request.result.createObjectStore('projects', {keyPath:'id'});
  store.createIndex('name', 'name', {unique:true});
 };
 request.onsuccess = () => {request.result.onversionchange=()=>request.result.close();resolve(request.result);};
 request.onerror = () => reject(Error('브라우저 저장소를 열 수 없습니다. 일반 창에서 다시 열어주세요.'));
 request.onblocked = () => reject(Error('다른 탭을 닫고 다시 열어주세요.'));
});
api = async function(path, options = {}) {
 if(path === '/api/projects/import-legacy')return {imported:0};
 if(!path.startsWith('/api/projects'))throw Error('현재 목차의 도식과 기업 작업 백업을 사용해주세요.');
 const db = await localDatabase;
 const method = options.method || 'GET';
 const body = options.body ? JSON.parse(options.body) : {};
 const id = path.startsWith('/api/projects/') ? path.slice('/api/projects/'.length) : null;
 return new Promise((resolve,reject) => {
  const tx = db.transaction('projects', method==='GET'?'readonly':'readwrite');
  const store = tx.objectStore('projects');let result, failure;
  const stop = message => {failure=Error(message);tx.abort();};
  tx.oncomplete = () => resolve(result);
  tx.onabort = () => reject(failure || Error(tx.error?.name==='ConstraintError'?'같은 이름의 기업이 있습니다. 기존 기업을 선택해주세요.':'저장하지 못했습니다. 저장 공간을 확인하고 기업 작업을 백업해주세요.'));
  tx.onerror = () => {};
  if(method==='GET'){
   const req=id?store.get(id):store.getAll();
   req.onsuccess=()=>{if(id){if(!req.result)return stop('기업을 찾을 수 없습니다.');result=req.result;}else result={items:req.result.sort((a,b)=>b.updated.localeCompare(a.updated)).map(({id,name,updated})=>({id,name,updated}))};};
  }else if(method==='POST'&&!id){
   const name=String(body.name||'').trim();if(!name)return stop('기업명을 입력해주세요.');
   result={id:crypto.randomUUID(),name,document:{sections:{}},revision:0,updated:new Date().toISOString()};store.add(result);
  }else if(method==='DELETE'&&id){
   const req=store.get(id);req.onsuccess=()=>{const project=req.result;if(!project)return stop('이미 삭제된 기업입니다.');if(body.name!==project.name)return stop('기업명이 일치하지 않습니다.');if(body.revision!==project.revision)return stop('다른 탭에서 수정되었습니다. 목록을 새로고침하고 다시 확인해주세요.');store.delete(id);result={deleted:id};};
  }else if(method==='PUT'&&id){
   const req=store.get(id);req.onsuccess=()=>{
    const project=req.result;if(!project)return stop('기업을 찾을 수 없습니다.');
    if(project.revision!==body.revision)return stop('다른 탭에서 변경되었습니다. 백업 후 저장본을 다시 열어주세요.');
    if(!body.document?.sections)return stop('기업 자료 형식을 확인해주세요.');
    result={...project,document:body.document,revision:project.revision+1,updated:new Date().toISOString()};store.put(result);
   };
  }else stop('지원하지 않는 저장 요청입니다.');
 });
};
