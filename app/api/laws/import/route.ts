import { createHash,randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { isAuthorized } from "@/lib/auth";
import { pool } from "@/lib/db";
import { cleanText,splitProvisions,stripHtml } from "@/lib/legal-parser";
export const runtime="nodejs";
export const maxDuration=60;
async function extract(file:File):Promise<string>{
 const buffer=Buffer.from(await file.arrayBuffer()); const name=file.name.toLowerCase();
 if(name.endsWith(".pdf")) return cleanText((await pdfParse(buffer)).text);
 if(name.endsWith(".docx")) return cleanText((await mammoth.extractRawText({buffer})).value);
 const raw=buffer.toString("utf8");
 return name.endsWith(".html")||name.endsWith(".htm")?stripHtml(raw):cleanText(raw);
}
export async function POST(request:NextRequest){
 if(!(await isAuthorized())) return NextResponse.json({error:"請先登入"},{status:401});
 const form=await request.formData();
 const pasted=String(form.get("text")??"").trim();
 const titleInput=String(form.get("title")??"").trim();
 const jurisdiction=String(form.get("jurisdiction")??"黃名帝國").trim();
 const validity=String(form.get("validity")??"current");
 const allowed=new Set(["current","historical","draft","repealed","unknown"]);
 if(!allowed.has(validity)) return NextResponse.json({error:"版本狀態無效"},{status:400});
 const files=form.getAll("files").filter((v):v is File=>v instanceof File&&v.size>0);
 if(!pasted&&!files.length) return NextResponse.json({error:"請貼上法律全文或選擇文件"},{status:400});
 if(files.length>30) return NextResponse.json({error:"一次最多匯入30個文件"},{status:413});
 const maxBytes=Number(process.env.MAX_UPLOAD_MB||30)*1024*1024;
 if(files.some(f=>f.size>maxBytes)) return NextResponse.json({error:"單一文件超過大小限制"},{status:413});
 const entries:{title:string;sourceName:string;text:string}[]=[];
 if(pasted) entries.push({title:titleInput||"新匯入法規",sourceName:"手動貼上",text:cleanText(pasted)});
 for(const file of files){
  const ext=file.name.toLowerCase().split(".").pop();
  if(!["txt","md","pdf","docx","html","htm"].includes(ext||""))
   return NextResponse.json({error:`不支援的檔案格式：${file.name}`},{status:415});
  entries.push({title:file.name.replace(/\.[^.]+$/,""),sourceName:file.name,text:await extract(file)});
 }
 const client=await pool.connect(); const imported:{id:string;title:string;provisionCount:number}[]=[];
 try{
  await client.query("BEGIN");
  for(const entry of entries){
   if(!entry.text) throw new Error(`${entry.sourceName} 未能抽取文字`);
   const lawId=randomUUID(),versionId=randomUUID();
   const checksum=createHash("sha256").update(entry.text).digest("hex");
   const provisions=splitProvisions(entry.text);
   const lawStatus=validity==="draft"?"draft":validity==="repealed"?"repealed":"active";
   await client.query("INSERT INTO laws(id,title,jurisdiction,status) VALUES($1,$2,$3,$4)",
    [lawId,entry.title,jurisdiction||"黃名帝國",lawStatus]);
   await client.query("INSERT INTO law_versions(id,law_id,version_label,validity_status,source_name,original_text,checksum) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [versionId,lawId,"匯入版本",validity,entry.sourceName,entry.text,checksum]);
   for(const p of provisions){
    await client.query("INSERT INTO provisions(id,law_id,version_id,order_index,chapter,article_number,heading,content) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
     [randomUUID(),lawId,versionId,p.orderIndex,p.chapter,p.articleNumber,p.heading,p.content]);
   }
   imported.push({id:lawId,title:entry.title,provisionCount:provisions.length});
  }
  await client.query("COMMIT");
  return NextResponse.json({imported},{status:201});
 }catch(error){
  await client.query("ROLLBACK");
  return NextResponse.json({error:error instanceof Error?error.message:"匯入失敗"},{status:500});
 }finally{client.release();}
}
