import { NextRequest,NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime="nodejs";
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!(await isAuthorized())) return NextResponse.json({error:"請先登入"},{status:401});
 const {id}=await context.params;const {rows}=await pool.query("SELECT * FROM analyses WHERE id=$1",[id]);
 if(!rows[0]) return NextResponse.json({error:"找不到分析紀錄"},{status:404});
 return NextResponse.json({analysis:rows[0]});
}
