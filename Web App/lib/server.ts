import { localDb } from './local-db';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
export function db(){if(process.env.EVERLIGHT_LOCAL_DB==="1")return localDb();const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Supabase environment variables are missing');return createClient(url,key,{auth:{persistSession:false}})}
const secret=()=>{if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must be at least 32 characters');return process.env.SESSION_SECRET};
export function sign(payload:{role:string;slot?:string}){const data=Buffer.from(JSON.stringify({...payload,exp:Date.now()+1000*60*60*24*14})).toString('base64url');const mac=createHmac('sha256',secret()).update(data).digest('base64url');return `${data}.${mac}`}
export async function session(){const token=(await cookies()).get('everlight_session')?.value;if(!token)return null;const [data,mac]=token.split('.');if(!data||!mac)return null;const expected=createHmac('sha256',secret()).update(data).digest('base64url');if(mac.length!==expected.length||!timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return null;try{const obj=JSON.parse(Buffer.from(data,'base64url').toString());return obj.exp>Date.now()?obj as {role:string;slot?:string}:null}catch{return null}}
export function clean(s:unknown,max=400){return String(s??'').trim().slice(0,max)}

