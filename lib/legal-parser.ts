export type ParsedProvision = {
 orderIndex: number; chapter: string | null; articleNumber: string | null;
 heading: string | null; content: string;
};
const ARTICLE = /^\s*(第\s*[0-9〇零一二三四五六七八九十百千兩]+\s*條(?:之\s*[0-9〇零一二三四五六七八九十百千兩]+)?)[　\s、.．:：]*(.*)$/;
export function cleanText(input: string) {
 return input.replace(/\r\n?/g,"\n").replace(/\u0000/g,"")
  .replace(/[\t\u00a0]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
}
export function splitProvisions(input: string): ParsedProvision[] {
 const lines=cleanText(input).split("\n"); const provisions:ParsedProvision[]=[];
 let chapter:string|null=null; let current:ParsedProvision|null=null;
 for (const line of lines) {
  const trimmed=line.trim();
  const ch=trimmed.match(/^第\s*[0-9〇零一二三四五六七八九十百千兩]+\s*章[　\s、.．]*(.*)$/);
  if(ch){chapter=trimmed;continue;}
  const match=trimmed.match(ARTICLE);
  if(match){
   if(current) provisions.push({...current,content:current.content.trim()});
   const tail=match[2]?.trim()??"";
   current={orderIndex:provisions.length,chapter,articleNumber:match[1].replace(/\s+/g,""),
    heading:tail&&tail.length<=48&&!/[。；;]/.test(tail)?tail:null,content:trimmed};
  } else if(current) current.content += (current.content?"\n":"")+line;
 }
 if(current) provisions.push({...current,content:current.content.trim()});
 if(!provisions.length) return cleanText(input).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)
  .map((content,index)=>({orderIndex:index,chapter:null,articleNumber:null,heading:null,content}));
 return provisions.map((p,index)=>({...p,orderIndex:index}));
}
export function stripHtml(html:string) {
 return cleanText(html.replace(/<script[\s\S]*?<\/script>/gi," ")
  .replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi,"\n")
  .replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">"));
}
