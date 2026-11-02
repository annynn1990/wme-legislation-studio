(function(){
"use strict";
var laws=[],draftItems=[],pendingEdit=null,toastTimer=null;
var statusLabels={current:"現行有效",draft:"草案",historical:"歷史版本",repealed:"已廢止",unknown:"效力待核實"};
function el(id){return document.getElementById(id);}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function toast(msg){var n=el("toast");n.textContent=msg;n.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){n.classList.remove("show");},2600);}
function statusLabel(s){return statusLabels[s]||"效力待核實";}
function getLaw(id){return laws.find(function(l){return l.id===id;})||null;}
function getArticle(law,id){return(law&&Array.isArray(law.articles)?law.articles:[]).find(function(a){return a.id===id;})||null;}
function lawStatusClass(s){return "status-"+(statusLabels[s]?s:"unknown");}

function setView(name){
 document.querySelectorAll(".top-nav-item").forEach(function(b){b.classList.toggle("active",b.dataset.view===name);});
 document.querySelectorAll(".view").forEach(function(v){v.classList.toggle("active",v.id==="view-"+name);});
 if(name==="library")renderLibrary();
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderLawSelect(){
 var select=el("law-select"),filter=el("library-law-filter");
 select.innerHTML='<option value="">請選擇一部法律</option>'+laws.map(function(l){return '<option value="'+esc(l.id)+'">'+esc(l.title)+'</option>';}).join("");
 filter.innerHTML='<option value="">所有法律</option>'+laws.map(function(l){return '<option value="'+esc(l.id)+'">'+esc(l.title)+'</option>';}).join("");
 el("law-total").textContent=String(laws.length);
 el("library-count").textContent=laws.length+" 份法律";
}
function renderArticleSelect(){
 var law=getLaw(el("law-select").value),select=el("article-select");
 if(!law){select.innerHTML='<option value="">請先選擇法律</option>';renderSourceNote(null);return;}
 select.innerHTML=(law.articles||[]).map(function(a,i){return '<option value="'+esc(a.id)+'">'+esc(a.number||("條文 "+(i+1)))+(a.chapter?" · "+esc(a.chapter):"")+'</option>';}).join("");
 renderSourceNote(law);
}
function renderSourceNote(law){
 var n=el("source-note");
 if(!law){n.innerHTML='<span class="note-icon">§</span><div><b>法條來源</b><p>選擇法律後，工作室會顯示該法的條文，修改內容會保留對應條號。</p></div>';return;}
 n.innerHTML='<span class="note-icon">§</span><div><b>'+esc(law.title)+'</b><p>'+esc(law.legalReference||"未提供法規編號")+' · '+esc(statusLabel(law.validityStatus))+' · '+(law.articles||[]).length+' 條。'+esc(law.sourceNote||"")+'</p></div>';
}
function updateChangeType(){
 var type=el("change-type").value,isAdd=type==="add";
 el("article-field").classList.toggle("hidden",isAdd);
 el("new-number-field").classList.toggle("hidden",!isAdd);
 el("new-article-number").required=isAdd;
}
function prepareEditor(e){
 e.preventDefault();
 var law=getLaw(el("law-select").value),type=el("change-type").value,article=type==="add"?null:getArticle(law,el("article-select").value);
 var objective=el("amend-objective").value.trim();
 if(!law){toast("請先選擇要修改的法律。");return;}
 if(!objective){el("amend-objective").focus();toast("請先說明希望解決的問題。");return;}
 if(type!=="add"&&!article){toast("這部法律沒有可選的條文。");return;}
 var number=type==="add"?el("new-article-number").value.trim():article.number;
 if(type==="add"&&!number){el("new-article-number").focus();toast("請填寫新增條號。");return;}
 pendingEdit={lawId:law.id,lawTitle:law.title,type:type,number:number,original:article?article.content:"",chapter:article?article.chapter:"",objective:objective,articleId:article?article.id:null};
 el("editor-title").textContent=type==="add"?"新增條文":type==="repeal"?"刪除條文":"修改條文";
 el("editor-subtitle").textContent=law.title+" · "+number;
 el("current-text").textContent=article?article.content:"這是一條新增條文，尚無現行文字。";
 el("proposed-box").classList.toggle("hidden",type==="repeal");
 el("proposed-text").value=type==="add"?"":article?article.content:"";
 el("reason-text").value=objective;
 el("editor-panel").classList.remove("hidden");
 el("editor-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
function addDraftItem(){
 if(!pendingEdit)return;
 var item=Object.assign({},pendingEdit,{
  proposed:el("proposed-text").value.trim(),
  reason:el("reason-text").value.trim(),
  uid:"draft-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)
 });
 if(item.type!=="repeal"&&!item.proposed){el("proposed-text").focus();toast("請填寫修正後的條文內容。");return;}
 if(!item.reason){el("reason-text").focus();toast("請補上修正理由。");return;}
 draftItems.push(item);
 pendingEdit=null;
 el("editor-panel").classList.add("hidden");
 renderDraft();
 toast("已加入修正草案。");
}
function amendmentText(item,index){
 var label=String(index+1)+"、";
 if(item.type==="amend"){
  return label+"修正本法"+item.number+"，修正條文如下：\n"+item.proposed+"\n\n【現行條文】\n"+item.original+"\n\n【修正理由】\n"+item.reason;
 }
 if(item.type==="add"){
  return label+"增訂本法"+item.number+"，條文如下：\n"+item.proposed+"\n\n【增訂理由】\n"+item.reason;
 }
 return label+"刪除本法"+item.number+"。\n\n【現行條文】\n"+item.original+"\n\n【刪除理由】\n"+item.reason;
}
function buildBillText(){
 if(!draftItems.length)return "";
 var groups=[];
 draftItems.forEach(function(item){var group=groups.find(function(g){return g.lawId===item.lawId;});if(!group){group={lawId:item.lawId,title:item.lawTitle,items:[]};groups.push(group);}group.items.push(item);});
 return groups.map(function(group){
  var title=group.title+(group.items.some(function(i){return i.type==="add"||i.type==="repeal";})?"部分條文修正草案":"部分條文修正草案");
  return "《"+title+"》\n\n案由：就"+group.title+"提出修正，理由及內容如下：\n\n"+group.items.map(amendmentText).join("\n\n")+"\n\n本草案仍須經議會審議及正式公布後，方依程序成為法律。";
 }).join("\n\n"+"—".repeat(28)+"\n\n");
}
function renderDraft(){
 var list=el("draft-list");
 el("draft-empty").classList.toggle("hidden",draftItems.length>0);
 el("draft-actions").hidden=draftItems.length===0;
 if(!draftItems.length){list.innerHTML="";return;}
 list.innerHTML=draftItems.map(function(item,index){
  var tag=item.type==="add"?"增訂":item.type==="repeal"?"刪除":"修正";
  var body=item.type==="repeal"?"刪除 "+esc(item.number):esc(item.number)+"："+esc(item.proposed);
  return '<article class="draft-item"><div class="draft-item-top"><span class="draft-tag">'+tag+'</span><b>'+esc(item.lawTitle)+'</b><button class="remove-item" type="button" data-remove="'+index+'" aria-label="移除">×</button></div><p>'+body+'</p><small>修正理由：'+esc(item.reason)+'</small></article>';
 }).join("");
}
function removeDraft(index){draftItems.splice(index,1);renderDraft();}
async function copyDraft(){
 var text=buildBillText();if(!text)return;
 try{await navigator.clipboard.writeText(text);toast("修正草案已複製。");}
 catch(e){fallbackCopy(text);}
}
function fallbackCopy(text){
 var box=document.createElement("textarea");box.value=text;box.style.position="fixed";box.style.opacity="0";document.body.appendChild(box);box.select();
 try{document.execCommand("copy");toast("修正草案已複製。");}catch(e){toast("複製失敗，請改用下載草案。");}
 box.remove();
}
function downloadDraft(){
 var text=buildBillText();if(!text)return;
 var blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="黃名帝國修法草案.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast("已下載修法草案。");
}
function renderLibrary(){
 var query=(el("library-search").value||"").trim().toLowerCase(),filter=el("library-law-filter").value;
 var list=laws.filter(function(l){return(!filter||l.id===filter)&&(!query||l.title.toLowerCase().includes(query)||(l.articles||[]).some(function(a){return [a.number,a.chapter,a.content].join(" ").toLowerCase().includes(query);}));});
 var target=el("library-list");
 if(!list.length){target.innerHTML='<div class="empty-draft">找不到符合的法律或條文。</div>';return;}
 target.innerHTML=list.map(function(l){
  var articles=(l.articles||[]).map(function(a){
   return '<article class="library-article"><div class="article-meta"><b>'+esc(a.number||"未編號")+'</b><span>'+esc(a.chapter||"")+'</span></div><p>'+esc(a.content||"")+'</p><button type="button" class="use-article" data-law="'+esc(l.id)+'" data-article="'+esc(a.id)+'">用這條開始修法 →</button></article>';
  }).join("");
  return '<section class="library-law-card"><header><div><h3>'+esc(l.title)+'</h3><small>'+esc(l.legalReference||"未提供法規編號")+'</small></div><span class="status-pill '+lawStatusClass(l.validityStatus)+'">'+statusLabel(l.validityStatus)+'</span></header><p class="library-source">'+esc(l.sourceNote||"")+'</p>'+articles+'</section>';
 }).join("");
}
async function loadData(){
 var candidates=[
  new URL("./data/laws.json?v=20261102-parliament",document.baseURI).href,
  "/wme-legislation-studio/data/laws.json?v=20261102-parliament",
  "https://raw.githubusercontent.com/annynn1990/wme-legislation-studio/main/site/data/laws.json"
 ];
 var errors=[];
 for(var i=0;i<candidates.length;i++){
  try{var response=await fetch(candidates[i],{cache:"no-store"});if(!response.ok){errors.push("HTTP "+response.status);continue;}var data=await response.json();var result=Array.isArray(data)?data:data.laws;if(!Array.isArray(result))throw new Error("資料格式錯誤");return result;}
  catch(error){errors.push(error.message||String(error));}
 }
 throw new Error(errors.join(" / "));
}
function bind(){
 document.querySelectorAll("[data-view]").forEach(function(b){b.addEventListener("click",function(){setView(b.dataset.view);});});
 el("law-select").addEventListener("change",renderArticleSelect);
 el("change-type").addEventListener("change",updateChangeType);
 el("amend-form").addEventListener("submit",prepareEditor);
 el("add-to-draft").addEventListener("click",addDraftItem);
 el("cancel-edit").addEventListener("click",function(){pendingEdit=null;el("editor-panel").classList.add("hidden");});
 el("draft-list").addEventListener("click",function(e){var b=e.target.closest("[data-remove]");if(b)removeDraft(Number(b.dataset.remove));});
 el("copy-draft").addEventListener("click",copyDraft);
 el("download-draft").addEventListener("click",downloadDraft);
 el("clear-draft").addEventListener("click",function(){draftItems=[];renderDraft();toast("已清空修正草案。");});
 el("library-search").addEventListener("input",renderLibrary);
 el("library-law-filter").addEventListener("change",renderLibrary);
 el("library-list").addEventListener("click",function(e){
  var b=e.target.closest("[data-article]");if(!b)return;
  setView("workspace");el("law-select").value=b.dataset.law;renderArticleSelect();el("article-select").value=b.dataset.article;el("amend-objective").focus();
  toast("已選取 "+(getArticle(getLaw(b.dataset.law),b.dataset.article)||{}).number+"，請描述想修改的地方。");
 });
 updateChangeType();
}
async function init(){
 bind();
 try{laws=await loadData();renderLawSelect();renderArticleSelect();renderDraft();renderLibrary();}
 catch(error){el("law-total").textContent="—";el("law-select").innerHTML='<option value="">法律資料讀取失敗</option>';el("library-list").innerHTML='<div class="empty-draft">法律資料暫時無法讀取，請重新整理頁面。</div>';console.error(error);toast("法規資料載入失敗。");}
}
init();
})();