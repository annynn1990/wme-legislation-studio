import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime="nodejs";
export const maxDuration=60;
type Provision={id:string;law_title:string;law_number:string|null;chapter:string|null;article_number:string|null;heading:string|null;content:string};

function extractSearchTerms(value:string){
 const chunks=value.match(/[\u3400-\u9fff]{2,}|[A-Za-z0-9_-]{2,}/g)||[];
 const found:string[]=[];
 for(const chunk of chunks){
  if(/^[\u3400-\u9fff]+$/.test(chunk)){
   if(chunk.length===2) found.push(chunk);
   else for(let i=0;i<chunk.length-1;i++) found.push(chunk.slice(i,i+2));
  }else found.push(chunk);
 }
 const unique=[...new Set(found)];
 if(unique.length<=40) return unique;
 const stride=Math.ceil(unique.length/40);
 return unique.filter((_,i)=>i%stride===0).slice(0,40);
}

export async function POST(request:NextRequest){
 if(!(await isAuthorized())) return NextResponse.json({error:"請先登入"},{status:401});
 const body=await request.json().catch(()=>({}));
 const objective=String(body.objective??"").trim();
 const title=String(body.title??"立法研究").trim();
 const policy=String(body.policyPrinciples??"").trim();
 const preferences=String(body.preferences??"").trim();
 if(objective.length<10) return NextResponse.json({error:"請具體描述立法目標（至少10字）"},{status:400});

 // Chinese legislation usually has no whitespace tokenisation: use adjacent-character bigrams.
 const terms=extractSearchTerms([objective,policy,preferences].join(" "));
 const patterns=terms.map(t=>`%${t}%`);
 const {rows}=await pool.query<Provision>(
  `SELECT p.id,l.title AS law_title,l.law_number,p.chapter,p.article_number,p.heading,p.content
   FROM provisions p JOIN laws l ON l.id=p.law_id
   JOIN law_versions v ON v.id=p.version_id
   WHERE v.validity_status='current' AND l.status='active'
     AND ($1::text[] = ARRAY[]::text[] OR p.content ILIKE ANY($1::text[]) OR l.title ILIKE ANY($1::text[]))
   ORDER BY p.created_at DESC LIMIT 60`,[patterns]);
 const sources=rows.map(p=>({id:p.id,citation:[p.law_title,p.law_number,p.chapter,p.article_number,p.heading].filter(Boolean).join("／"),text:p.content}));
 const base=(process.env.AI_BASE_URL||"https://ai-gateway.vercel.sh/v1").replace(/\/$/,"");
 const key=process.env.AI_API_KEY||process.env.AI_GATEWAY_API_KEY;
 const model=process.env.AI_MODEL;
 if(!key||!model) return NextResponse.json({error:"尚未設定 AI_API_KEY 與 AI_MODEL，請先配置環境變數"},{status:503});
 const system=`你是黃名帝國立法研究室的法律研究及起草助理。只能把使用者提供的檢索條文作為已知法律來源。不可捏造法規、條號、判例、憲法條文或法律沿革。若資料不足，必須明確指出。輸出繁體中文 JSON，格式：{"executiveSummary":"...","issues":[{"type":"衝突/重複/漏洞/歧義/權限/程序","severity":"高/中/低","title":"...","analysis":"...","sourceIds":["..."],"recommendation":"..."}],"structure":[{"chapter":"...","purpose":"...","sourceIds":["..."]}],"draftArticles":[{"articleNumber":"第一條","heading":"...","text":"...","rationale":"...","legalEffect":"...","sourceIds":["..."]}],"unresolvedQuestions":["..."],"reviewChecklist":["..."]}。sourceIds 只能使用給定來源 ID。所有草案是提案，不是現行法律。`;
 const user={objective,policyPrinciples:policy,draftingPreferences:preferences,
  note:"以下條文是本次可檢索到的現行版本資料。這不是全庫完整性證明，未列出的法規不得假定不存在。",
  searchTerms:terms,sources};
 const response=await fetch(`${base}/chat/completions`,{
  method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
  body:JSON.stringify({model,temperature:0.2,response_format:{type:"json_object"},
   messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(user)}]})
 });
 if(!response.ok){const detail=await response.text();return NextResponse.json({error:`AI服務錯誤（${response.status}）：${detail.slice(0,400)}`},{status:502});}
 const payload=await response.json();const raw=payload.choices?.[0]?.message?.content;
 if(typeof raw!=="string") return NextResponse.json({error:"AI回傳格式不正確"},{status:502});
 let result:any;try{result=JSON.parse(raw);}catch{return NextResponse.json({error:"AI未回傳有效JSON，請重試"},{status:502});}
 const validIds=new Set(sources.map(s=>s.id));
 const valid=(ids:unknown)=>Array.isArray(ids)?ids.filter((id)=>typeof id==="string"&&validIds.has(id)):[];
 result.issues=Array.isArray(result.issues)?result.issues.map((x:any)=>({...x,sourceIds:valid(x.sourceIds)})):[];
 result.structure=Array.isArray(result.structure)?result.structure.map((x:any)=>({...x,sourceIds:valid(x.sourceIds)})):[];
 result.draftArticles=Array.isArray(result.draftArticles)?result.draftArticles.map((x:any)=>({...x,sourceIds:valid(x.sourceIds)})):[];
 const id=randomUUID();
 const cited=[...new Set([...result.issues,...result.structure,...result.draftArticles].flatMap((x:any)=>x.sourceIds))];
 await pool.query("INSERT INTO analyses(id,title,objective,policy_principles,drafting_preferences,result,cited_provision_ids,model_name) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
 [id,title,objective,policy,preferences,JSON.stringify(result),cited,model]);
 return NextResponse.json({id,result,sources,model});
}
