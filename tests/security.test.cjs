const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');

test('authenticated API calls send bearer token and fail before fetch when logged out', async () => {
 let token='access-token'; const calls=[];
 const sandbox={exports:{},Headers,localStorage:{getItem:()=>token},fetch:async(input,init)=>{calls.push(init); return {status:200};}};
 const code=ts.transpileModule(fs.readFileSync('src/services/apiFetch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,sandbox);
 await sandbox.exports.authenticatedApiFetch('https://api.example.test',{headers:{'Content-Type':'application/json'}});
 assert.equal(calls[0].headers.get('Authorization'),'Bearer access-token');
 assert.equal(calls[0].headers.get('Content-Type'),'application/json');
 token=null;
 await assert.rejects(sandbox.exports.authenticatedApiFetch('https://api.example.test'));
 assert.equal(calls.length,1);
});

function worker() {
 const handlers={}; const state={user:'alice',shown:[],saved:[],wait:null};
 const sandbox={console, URL, Promise, Set, Date, self:{
  location:{origin:'https://app.example.test'},
  addEventListener:(type,handler)=>{handlers[type]=handler;},
  registration:{
   showNotification:async(title,options)=>{if(state.wait) await state.wait;state.shown.push({title,options});},
   getNotifications:async()=>state.shown.map(item=>({close:()=>{state.shown=state.shown.filter(x=>x!==item);}})),
  },
 }};
 const code=fs.readFileSync('src/pwa/sw-template.js','utf8').replace('__IS_DEV__','false').replace('__PRECACHE_URLS__','[]');
 vm.createContext(sandbox); vm.runInContext(code,sandbox);
 sandbox.getMetadata=async()=>state.user;
 sandbox.setMetadata=async(key,value)=>{state.user=value;};
 sandbox.openNotifDB=async()=>({transaction:()=>({objectStore:()=>({clear:()=>{state.saved=[];}})}),close:()=>{}});
 sandbox.waitForTransaction=async()=>{};
 sandbox.saveNotificationToIndexedDB=async payload=>{state.saved.push(payload);};
 const emit=(type,details)=>{let done;handlers[type]({...details,waitUntil:p=>{done=p;}});return done;};
 const push=user=>emit('push',{data:{json:()=>({user_id:user,title:'Private farm alert',body:'private'})}});
 return {state,emit,push};
}

test('push suppresses other accounts and logged-out sessions', async () => {
 const w=worker();
 await w.push('bob'); assert.equal(w.state.shown.length,0);
 await w.push('alice'); assert.equal(w.state.shown.length,1);
 await w.emit('message',{data:{type:'SET_PUSH_USER',userId:null}});
 assert.equal(w.state.shown.length,0); assert.equal(w.state.saved.length,0);
 await w.push('alice'); assert.equal(w.state.shown.length,0);
});

test('logout waits for an in-flight push and then removes its display and storage', async () => {
 const w=worker(); let release;
 w.state.wait=new Promise(resolve=>{release=resolve;});
 const pending=w.push('alice');
 await new Promise(resolve=>setImmediate(resolve));
 let loggedOut=false;
 const logout=w.emit('message',{data:{type:'SET_PUSH_USER',userId:null}}).then(()=>{loggedOut=true;});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loggedOut,false);
 release(); await pending; await logout;
 assert.equal(w.state.user,null); assert.equal(w.state.shown.length,0); assert.equal(w.state.saved.length,0);
});
