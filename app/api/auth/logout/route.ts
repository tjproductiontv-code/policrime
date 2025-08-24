export function GET(){ return new Response(JSON.stringify({error:'Method Not Allowed'}), { status:405, headers:{'Content-Type':'application/json','Allow':'POST'} }); }
import { NextResponse } from 'next/server'; import { clearAuthCookie } from '@/lib/auth'; export async function POST(req:Request){ clearAuthCookie(); return NextResponse.redirect(new URL('/', req.url)); }
