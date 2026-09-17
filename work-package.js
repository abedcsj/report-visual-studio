'use strict';
// ZIP32 store format: exported bundles need no external library or network.
(()=>{
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 const crc32=bytes=>{let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;};
 function safePath(name){return typeof name==='string'&&name.length&&!name.startsWith('/')&&!name.includes('\\')&&!name.split('/').some(p=>p==='..'||p==='.'||!p)&&!/[\x00-\x1f]/.test(name);}
 function zip(entries){
  const parts=[],central=[];let offset=0,centralSize=0;
  for(const [name,value] of entries){if(!safePath(name))throw Error('파일 이름을 확인해주세요.');const n=encoder.encode(name),data=typeof value==='string'?encoder.encode(value):value;
   if((!ArrayBuffer.isView(data)||data.BYTES_PER_ELEMENT!==1)||n.length>65535||data.length>0xffffffff)throw Error('ZIP에 담을 수 없는 파일입니다.');
   const crc=crc32(data),head=new Uint8Array(30+n.length),h=new DataView(head.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,n.length,true);head.set(n,30);parts.push(head,data);
   const record=new Uint8Array(46+n.length),r=new DataView(record.buffer);r.setUint32(0,0x02014b50,true);r.setUint16(4,20,true);r.setUint16(6,20,true);r.setUint16(8,0x800,true);r.setUint16(14,33,true);r.setUint32(16,crc,true);r.setUint32(20,data.length,true);r.setUint32(24,data.length,true);r.setUint16(28,n.length,true);r.setUint32(42,offset,true);record.set(n,46);central.push(record);offset+=head.length+data.length;centralSize+=record.length;
  }
  if(offset+centralSize>0xffffffff||entries.length>65535)throw Error('ZIP32의 파일 크기 또는 개수 범위를 넘었습니다. 자료를 나누어 보관해주세요.');
  const tail=new Uint8Array(22),t=new DataView(tail.buffer);t.setUint32(0,0x06054b50,true);t.setUint16(8,entries.length,true);t.setUint16(10,entries.length,true);t.setUint32(12,centralSize,true);t.setUint32(16,offset,true);return new Blob([...parts,...central,tail],{type:'application/zip'});
 }
 async function readZip(input){
  const bytes=new Uint8Array(input),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),files=new Map();let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
  if(end<0||v.getUint16(end+4,true)||v.getUint16(end+6,true))throw Error('이 작업실에서 다운로드한 ZIP 파일을 선택해주세요.');
  const count=v.getUint16(end+10,true);let at=v.getUint32(end+16,true);
  if(at+v.getUint32(end+12,true)!==end)throw Error('ZIP 파일이 손상되었습니다.');
  for(let i=0;i<count;i++){
   if(at+46>end||v.getUint32(at,true)!==0x02014b50)throw Error('ZIP 목록을 읽을 수 없습니다.');
   const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),crc=v.getUint32(at+16,true),size=v.getUint32(at+20,true),rawSize=v.getUint32(at+24,true),nl=v.getUint16(at+28,true),extra=v.getUint16(at+30,true),comment=v.getUint16(at+32,true),local=v.getUint32(at+42,true);
   if(at+46+nl+extra+comment>end||flags&1)throw Error('암호화되었거나 손상된 ZIP 파일입니다.');
   const name=decoder.decode(bytes.subarray(at+46,at+46+nl));at+=46+nl+extra+comment;
   if(name.endsWith('/'))continue;if(!safePath(name)||files.has(name))throw Error('ZIP 파일 이름이 올바르지 않습니다.');
   if(local+30>bytes.length||v.getUint32(local,true)!==0x04034b50)throw Error('ZIP 파일이 손상되었습니다.');
   const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);if(start+size>end)throw Error('ZIP 파일이 잘렸습니다.');
   let data=bytes.slice(start,start+size);
   if(method===8){if(typeof DecompressionStream==='undefined')throw Error('이 브라우저에서는 재압축한 ZIP을 읽을 수 없습니다. 압축을 풀어 project.json을 선택해주세요.');data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());}
   else if(method!==0)throw Error('지원하지 않는 압축 방식입니다. 압축을 풀어 project.json을 선택해주세요.');
   if(data.length!==rawSize||crc32(data)!==crc)throw Error('파일이 손상되었습니다. 원본 ZIP을 다시 선택해주세요.');files.set(name,data);
  }
  return files;
 }
 window.workPackage={zip,readZip,encode:text=>encoder.encode(text),decode:bytes=>decoder.decode(bytes)};
})();
