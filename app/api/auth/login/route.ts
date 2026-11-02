import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(request:NextRequest) {
 const {password}=await request.json().catch(()=>({}));
 const expected=process.env.ADMIN_PASSWORD;
 if(!expected) return NextResponse.json({error:"尚未設定 ADMIN_PASSWORD"},{status:503});
 if(typeof password!=="string"||password!==expected) return NextResponse.json({error:"管理密碼不正確"},{status:401});
 await createSession(); return NextResponse.json({ok:true});
}
