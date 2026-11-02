import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { pool } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 if(!(await isAuthorized())) return NextResponse.json({error:"請先登入"},{status:401});
 const {rows}=await pool.query(
  `SELECT l.id,l.title,l.law_number,l.jurisdiction,l.status,l.created_at,
    COUNT(p.id)::int AS provision_count,MAX(v.created_at) AS latest_version
   FROM laws l LEFT JOIN law_versions v ON v.law_id=l.id AND v.validity_status='current'
   LEFT JOIN provisions p ON p.version_id=v.id GROUP BY l.id ORDER BY l.updated_at DESC`
 );
 return NextResponse.json({laws:rows});
}
