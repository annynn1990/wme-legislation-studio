(function () {
"use strict";
var laws=[],selectedLawId=null,activeTab="overview",toastTimer=null,githubToken="",pendingLaw=null;
var statusLabels={current:"現行有效",draft:"草案",historical:"歷史版本",repealed:"已廢止",unknown:"待核實"};
function el(id){return document.getElementById(id);}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function toast(message){var n=el("toast");n.textContent=message;n.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){n.classList.remove("show");},2600);}
function statusText(s){return statusLabels[s]||"待核實";}
function statusClass(s){return "status-"+(statusLabels[s]?s:"unknown");}
function articleCount(list){return list.reduce(function(n,l){return n+(Array.isArray(l.articles)?l.articles.length:0);},0);}
function renderStats(){el("stat-laws").textContent=laws.length;el("stat-articles").textContent=articleCount(laws);el("stat-current").textContent=laws.filter(function(l){return l.validityStatus==="current";}).length;el("stat-review").textContent=laws.filter(function(l){return !l.validityStatus||l.validityStatus==="unknown";}).length;el("law-count-label").textContent=laws.length+" 份法規";}
function renderOverview(){var t=el("overview-law-list");if(!laws.length){t.innerHTML='<div class="overview-empty">目前沒有收錄法規。可到「資料管理」加入原文。</div>';return;}t.innerHTML=laws.slice(0,5).map(function(l){return '<div class="overview-law"><div class="law-icon">§</div><div class="overview-law-main"><b>'+esc(l.title)+'</b><small>'+esc(l.legalReference||l.jurisdiction||"未提供法規編號")+' · '+((l.articles||[]).length)+' 條</small></div><span class="status-pill '+statusClass(l.validityStatus)+'">'+statusText(l.validityStatus)+'</span></div>';}).join("");}
function renderDetail(law){var t=el("law-detail");if(!law){t.innerHTML='<div class="empty-state"><span>§</span><h3>沒有符合條件的法規</h3><p>請調整搜尋字詞或篩選狀態。</p></div>';return;}var href=law.sourceFile?"https://github.com/annynn1990/wme-legislation-studio/blob/main/"+law.sourceFile.split("/").map(encodeURIComponent).join("/"):"";var groups=[];(law.articles||[]).forEach(function(a){var name=a.chapter||"未分類條文",g=groups.find(function(x){return x.name===name;});if(!g){g={name:name,articles:[]};groups.push(g);}g.articles.push(a);});var ah=groups.map(function(g){return '<div class="article-group-title">'+esc(g.name)+'</div>'+g.articles.map(function(a){return '<article class="article-card"><div class="article-card-head"><b>'+esc(a.number||"未編號")+'</b><span>'+esc(a.heading||"")+'</span></div><p>'+esc(a.content||"")+'</p></article>';}).join("");}).join("");t.innerHTML='<div class="detail-topline"><span class="status-pill '+statusClass(law.validityStatus)+'">'+statusText(law.validityStatus)+'</span><span class="detail-ref">'+esc(law.legalReference||"未提供法規編號")+'</span></div><h2 class="detail-title">'+esc(law.title)+'</h2><div class="detail-meta"><span>法域：'+esc(law.jurisdiction||"未設定")+'</span><span>分類：'+esc(law.category||"未分類")+'</span><span>版本：'+esc(law.versionLabel||"未標示")+'</span><span>條文：'+(law.articles||[]).length+'</span></div><div class="detail-source"><b>來源與效力備註</b><p>'+esc(law.sourceNote||"尚未提供來源核實說明。")+'</p>'+(href?'<a href="'+href+'" target="_blank" rel="noopener">開啟 Repository 原始文件 ↗</a>':"")+'</div><div class="article-heading"><h3>條文全文</h3><small>PROVISIONS / '+(law.articles||[]).length+'</small></div>'+(ah||'<div class="no-results">尚未拆分出條文。請檢查匯入格式。</div>');}
function renderLawList(){var q=(el("law-search").value||"").trim().toLowerCase(),status=el("law-status-filter").value;var list=laws.filter(function(l){var basic=[l.title,l.legalReference,l.category,l.jurisdiction].join(" ").toLowerCase(),text=(l.articles||[]).map(function(a){return [a.number,a.chapter,a.content].join(" ");}).join(" ").toLowerCase();return (!q||basic.indexOf(q)>=0||text.toLowerCase().indexOf(q)>=0)&&(status==="all"||l.validityStatus===status);});el("law-result-count").textContent=list.length;if(!list.some(function(l){return l.id===selectedLawId;}))selectedLawId=list.length?list[0].id:null;el("law-list").innerHTML=list.length?list.map(function(l){return '<button type="button" class="law-list-item '+(l.id===selectedLawId?"selected":"")+'" data-law-id="'+esc(l.id)+'"><span class="law-icon">§</span><span><b>'+esc(l.title)+'</b><small>'+esc(l.legalReference||"未提供編號")+' · '+(l.articles||[]).length+' 條</small></span></button>';}).join(""):'<div class="no-results">沒有符合條件的法規。</div>';renderDetail(list.find(function(l){return l.id===selectedLawId;})||null);}
function setTab(tab){if(["overview","laws","research","data"].indexOf(tab)<0)return;activeTab=tab;document.querySelectorAll(".nav-item").forEach(function(b){b.classList.toggle("active",b.dataset.tab===tab);});document.querySelectorAll(".view").forEach(function(v){v.classList.toggle("active",v.id==="view-"+tab);});if(tab==="laws")renderLawList();if(tab==="overview")renderOverview();window.scrollTo({top:0,behavior:"smooth"});}
function termsFrom(text){var chunks=String(text||"").match(/[\u3400-\u9fff]{2,}|[A-Za-z0-9_-]{2,}/g)||[],terms=[];chunks.forEach(function(c){if(/^[\u3400-\u9fff]+$/.test(c)){if(c.length===2)terms.push(c);else for(var i=0;i<c.length-1;i++)terms.push(c.slice(i,i+2));}else terms.push(c.toLowerCase());});var stop=["以及","或者","如何","是否","希望","制度","相關","問題","進行","整合","這些","目前","應該","建立"];return Array.from(new Set(terms.filter(function(x){return stop.indexOf(x)<0;}))).slice(0,48);}
function runResearch(e){e.preventDefault();var title=el("research-title").value.trim()||"立法研究",objective=el("research-objective").value.trim(),policy=el("research-policy").value.trim(),prefs=el("research-preferences").value.trim();if(objective.length<6){toast("請再具體描述立法目標。");return;}var terms=termsFrom([objective,policy,prefs].join(" ")),current=[],pending=[];laws.forEach(function(l){(l.articles||[]).forEach(function(a){var hay=[l.title,a.chapter,a.number,a.heading,a.content].join(" ").toLowerCase(),hits=terms.filter(function(x){return hay.indexOf(x.toLowerCase())>=0;}),item={law:l,article:a,hits:hits};if(hits.length)(l.validityStatus==="current"?current:pending).push(item);});});current.sort(function(a,b){return b.hits.length-a.hits.length;});pending.sort(function(a,b){return b.hits.length-a.hits.length;});var cards=current.length?current.slice(0,30).map(function(x){return '<article class="result-card"><span class="match-score">命中 '+x.hits.length+' 個檢索詞</span><h4>'+esc(x.law.title)+'／'+esc(x.article.number||"未編號")+'</h4><p>'+esc(x.article.content)+'</p><span class="source-citation">'+esc(x.law.legalReference||x.law.title)+' · '+esc(x.article.chapter||"未分類")+'</span><span class="source-citation">資料：'+esc(x.law.sourceFile||"Repository")+'</span></article>';}).join(""):'<div class="surface output-placeholder"><div class="placeholder-mark">—</div><h3>現行法規中沒有命中條文</h3><p>這只表示目前的關鍵字檢索沒有找到符合項目，不代表相關法律不存在。請調整關鍵字，或先補齊法規資料。</p></div>';var pendingNote=pending.length?'<div class="research-caution">另有 '+pending.length+' 條相似內容位於「非現行／待核實」版本。這些內容不納入現行條文結果，正式研究前須先核對效力。</div>':"";var summary='本地檢索詞：'+(terms.length?terms.map(esc).join("、"):"未抽取到可用關鍵字")+'。本次現行條文命中 '+current.length+' 條。';el("research-output").innerHTML='<article class="surface result-header"><span class="kicker">RESEARCH RETRIEVAL / LOCAL SEARCH</span><h3>'+esc(title)+'</h3><p>依輸入的目標、政策原則及起草偏好，對已標示為「現行有效」的條文執行關鍵字檢索。</p><div class="result-summary">'+summary+'</div></article>'+(cards)+pendingNote+'<div class="research-caution">研究範圍限制：這是字詞命中清單，不是 AI 法律意見、法規衝突判定或全庫完整審計。待 AI API 安全接入後，才會加入來源 ID 驗證的分析與草案生成。</div>';toast("檢索完成：現行條文命中 "+current.length+" 條。");}
function parseTextLaw(title,text,status,reference){
 var clean=String(text||"").replace(/\r\n?/g,"\n").trim();
 var chapters=Array.from(clean.matchAll(/(?:^|\n)\s*(第[〇零一二三四五六七八九十百千\d]+章[^\n]*)/g));
 function chapterAt(pos){var value="";chapters.forEach(function(m){if(m.index<=pos)value=m[1].trim();});return value;}
 var re=/(?:^|\n)\s*(第[〇零一二三四五六七八九十百千\d]+條(?:之[〇零一二三四五六七八九十百千\d]+)?)[、.． ]?\s*/g;
 var matches=Array.from(clean.matchAll(re));
 var articles=matches.length?matches.map(function(m,i){return{id:"article-"+(i+1),chapter:chapterAt(m.index),number:m[1],heading:"",content:clean.slice(m.index+m[0].length,i+1<matches.length?matches[i+1].index:clean.length).trim()};}):[{id:"article-full-text",chapter:"全文",number:"全文",heading:"",content:clean}];
 return{id:"wme-law-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),title:title.trim(),legalReference:reference.trim(),jurisdiction:"黃名帝國",category:"未分類",validityStatus:status||"unknown",versionLabel:"新增版本",effectiveDate:null,sourceFile:"site/data/laws.json",sourceNote:"由黃名帝國立法工作室前端新增。效力狀態以使用者選擇為準；請核對公布及生效紀錄。",originalText:clean,articles:articles};
}
function updateArticlePreview(){
 var raw=el("import-text").value.trim(),label=el("article-preview");
 if(!raw){label.innerHTML='<span class="preview-mark">§</span><span>輸入法律全文後，會在這裡顯示辨識到的條文數量。</span>';return;}
 var count=(raw.match(/(?:^|\n)\s*第[〇零一二三四五六七八九十百千\d]+條(?:之[〇零一二三四五六七八九十百千\d]+)?/g)||[]).length;
 label.innerHTML='<span class="preview-mark">§</span><b>'+count+'</b><span> 條文已辨識'+(count?"，儲存時會自動整理。":"，目前將以完整原文保存。")+'</span>';
}
function showGitHubDialog(){
 el("github-connect-dialog").hidden=false;
 el("connect-message").hidden=true;
 el("github-token").focus();
}
function hideGitHubDialog(){el("github-connect-dialog").hidden=true;}
function updateConnectionStatus(){
 var status=el("github-connection-status");
 status.classList.toggle("connected",!!githubToken);
 status.innerHTML=githubToken?'<i></i> GitHub 已連接':'<i></i> 尚未連接 GitHub';
}
function encodeBase64Utf8(value){
 var bytes=new TextEncoder().encode(value),binary="";
 for(var i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode.apply(null,Array.from(bytes.subarray(i,i+0x8000)));
 return btoa(binary);
}
function decodeBase64Utf8(value){
 var binary=atob(String(value||"").replace(/\s/g,"")),bytes=new Uint8Array(binary.length);
 for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new TextDecoder().decode(bytes);
}
async function validateGitHubToken(candidate){
 var endpoint="https://api.github.com/repos/annynn1990/wme-legislation-studio/contents/site/data/laws.json?ref=main";
 var response=await fetch(endpoint,{headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+candidate,"X-GitHub-Api-Version":"2022-11-28"}});
 var result=await response.json().catch(function(){return {};});
 if(!response.ok)throw new Error(response.status===401||response.status===403?"授權碼無效，或沒有此 Repository 的 Contents 讀取權限。":(result.message||"無法連接 GitHub。"));
 return true;
}
async function saveLawToGithub(law){
 var button=el("save-law-button"),message=el("save-message");
 button.disabled=true;button.innerHTML='正在儲存… <span>…</span>';
 message.hidden=false;message.textContent="正在將法律寫入 GitHub，請不要關閉頁面。";
 var endpoint="https://api.github.com/repos/annynn1990/wme-legislation-studio/contents/site/data/laws.json";
 var headers={"Accept":"application/vnd.github+json","Authorization":"Bearer "+githubToken,"X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"};
 try{
  var readResponse=await fetch(endpoint+"?ref=main",{method:"GET",headers:headers});
  var remote=await readResponse.json().catch(function(){return {};});
  if(!readResponse.ok)throw new Error((remote.message||"無法讀取 GitHub 法律資料")+"（HTTP "+readResponse.status+"）");
  var remoteData=JSON.parse(decodeBase64Utf8(remote.content));
  var remoteLaws=Array.isArray(remoteData.laws)?remoteData.laws:[];
  var merged=remoteLaws.concat([law]);
  var payload={schemaVersion:1,jurisdiction:"黃名帝國",laws:merged};
  var put=await fetch(endpoint,{method:"PUT",headers:headers,body:JSON.stringify({message:"Add law: "+law.title,content:encodeBase64Utf8(JSON.stringify(payload,null,2)+"\n"),sha:remote.sha,branch:"main"})});
  var saved=await put.json().catch(function(){return {};});
  if(!put.ok){
   if(put.status===409||put.status===422)throw new Error("法律資料剛被更新過。請重新載入頁面再試一次。");
   throw new Error((saved.message||"GitHub 儲存失敗")+"（HTTP "+put.status+"）");
  }
  laws=merged;refresh();selectedLawId=law.id;
  el("import-title").value="";el("import-reference").value="";el("import-text").value="";el("import-status").value="unknown";updateArticlePreview();
  message.textContent="已成功新增「"+law.title+"」，共保存 "+law.articles.length+" 條辨識條文。";
  toast("法律已新增並儲存。");
 }catch(error){
  message.textContent="儲存未完成："+(error&&error.message?error.message:"請稍後重試。");
  toast("無法儲存法律，請檢查連線或授權。");
 }finally{
  button.disabled=false;button.innerHTML='新增並儲存法律 <span>→</span>';
 }
}
async function connectGitHub(){
 var candidate=el("github-token").value.trim(),button=el("connect-github-button"),message=el("connect-message");
 if(!candidate){message.hidden=false;message.textContent="請先貼上 GitHub 授權碼。";return;}
 button.disabled=true;button.textContent="正在驗證…";message.hidden=true;
 try{
  await validateGitHubToken(candidate);
  githubToken=candidate;el("github-token").value="";updateConnectionStatus();hideGitHubDialog();
  if(pendingLaw){var law=pendingLaw;pendingLaw=null;await saveLawToGithub(law);}
  else toast("GitHub 已連接。");
 }catch(error){
  message.hidden=false;message.textContent=error&&error.message?error.message:"連接失敗，請確認授權設定。";
 }finally{
  button.disabled=false;button.innerHTML='連接並繼續儲存 <span>→</span>';
 }
}
function bind(){
 document.querySelectorAll("[data-tab]").forEach(function(b){b.addEventListener("click",function(){setTab(b.dataset.tab);});});
 document.querySelectorAll("[data-open-tab]").forEach(function(b){b.addEventListener("click",function(){setTab(b.dataset.openTab);});});
 el("law-search").addEventListener("input",renderLawList);
 el("law-status-filter").addEventListener("change",renderLawList);
 el("law-list").addEventListener("click",function(e){var b=e.target.closest("[data-law-id]");if(!b)return;selectedLawId=b.dataset.lawId;renderLawList();});
 el("research-form").addEventListener("submit",runResearch);
 el("export-button")?.addEventListener("click",exportJson);
 el("import-text").addEventListener("input",updateArticlePreview);
 el("law-entry-form").addEventListener("submit",function(e){
  e.preventDefault();
  var title=el("import-title").value.trim(),text=el("import-text").value.trim();
  if(!title){el("import-title").focus();return;}
  if(!text){el("import-text").focus();toast("請貼上法律全文。");return;}
  var law=parseTextLaw(title,text,el("import-status").value,el("import-reference").value);
  pendingLaw=law;
  if(!githubToken){showGitHubDialog();return;}
  pendingLaw=null;void saveLawToGithub(law);
 });
 el("github-token").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();void connectGitHub();}});
 el("connect-github-button").addEventListener("click",function(){void connectGitHub();});
 el("github-connection-status").addEventListener("click",function(){if(!githubToken)showGitHubDialog();else toast("GitHub 已連接至目前頁面。");});
 el("close-github-dialog").addEventListener("click",function(){hideGitHubDialog();});
 el("github-connect-dialog").addEventListener("click",function(e){if(e.target===el("github-connect-dialog"))hideGitHubDialog();});
 el("import-status").addEventListener("change",function(){updateArticlePreview();});
 updateConnectionStatus();updateArticlePreview();
}
async function loadLawData(){
 var version="20261102-fix1";
 var candidates=[
  "/wme-legislation-studio/data/laws.json?v="+version,
  new URL("./data/laws.json?v="+version,document.baseURI).href,
  "https://raw.githubusercontent.com/annynn1990/wme-legislation-studio/main/site/data/laws.json? v="+version
 ];
 var errors=[];
 for(var i=0;i<candidates.length;i++){
  try{
   var response=await fetch(candidates[i].replace("? v=","?v="),{cache:"no-store",headers:{"Accept":"application/json"}});
   if(!response.ok){errors.push(response.status+" "+candidates[i]);continue;}
   var data=await response.json();
   if(!data||(!Array.isArray(data)&&!Array.isArray(data.laws)))throw new Error("JSON 格式不包含 laws 陣列");
   return Array.isArray(data)?data:data.laws;
  }catch(error){errors.push(String(error&&error.message?error.message:error));}
 }
 throw new Error(errors.join("；"));
}
async function init(){
 try{
  bind();
  laws=await loadLawData();
  selectedLawId=laws.length?laws[0].id:null;
  refresh();
 }catch(e){
  var target=el("overview-law-list");
  if(target)target.innerHTML='<div class="overview-empty">法律資料暫時無法載入。請重新整理頁面；若問題持續，請聯絡網站管理員。</div>';
  toast("法律資料載入失敗。");
  console.error("WME law data load failed:",e);
 }
}
init();
})();