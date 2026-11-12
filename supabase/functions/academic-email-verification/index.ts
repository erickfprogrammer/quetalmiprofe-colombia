import { createClient } from "npm:@supabase/supabase-js@2.80.0";
import nodemailer from "npm:nodemailer@7.0.11";

const db=createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",{auth:{persistSession:false,autoRefreshToken:false}});
const ORIGINS=new Set(["https://quetalmiprofe-colombia.vercel.app","http://localhost:5173"]);
const cors=(req:Request)=>({"Access-Control-Allow-Origin":ORIGINS.has(req.headers.get("Origin")||"")?req.headers.get("Origin")!:"https://quetalmiprofe-colombia.vercel.app","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store","Vary":"Origin"});
const respond=(req:Request,body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:cors(req)});
const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a)).map(b=>b.toString(16).padStart(2,"0")).join("");
const digest=async(id:string,code:string)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("QTP:academic:v1:"+id+":"+code)));
const constantEqual=(a:string,b:string)=>{if(a.length!==b.length)return false;let z=0;for(let i=0;i<a.length;i++)z|=a.charCodeAt(i)^b.charCodeAt(i);return z===0};
const html=(code:string,uni:string)=>{
 const safe=uni.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").slice(0,200);
 return "<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>"+
 "<body style='margin:0;background:#f7f8f2;color:#243440;font-family:Arial,sans-serif'><div style='max-width:540px;margin:30px auto;padding:0 16px'>"+
 "<div style='text-align:center;font-size:23px;font-weight:800;padding-bottom:25px'>qué tal <b>mi profe<span style='color:#d4a345'>.</span></b></div>"+
 "<div style='background:white;border:1px solid #e7ebe7;border-radius:20px;overflow:hidden'><div style='height:9px;background:#ffe173'></div><div style='padding:36px 32px'>"+
 "<div style='font-size:10px;font-weight:800;letter-spacing:2px;color:#94783c'>VERIFICACIÓN UNIVERSITARIA</div>"+
 "<h1 style='font-size:29px;letter-spacing:-1px;line-height:1.2'>Confirma tu correo académico</h1>"+
 "<p style='color:#6c7d86;font-size:14px;line-height:1.8'>Confirma que tienes acceso a una cuenta institucional de <b>"+safe+"</b>. Ingresa este código de 8 dígitos en la plataforma:</p>"+
 "<div style='background:#fff2c4;border-radius:12px;text-align:center;padding:18px;margin:24px 0;font-size:31px;font-weight:900;letter-spacing:6px'>"+code+"</div>"+
 "<p style='font-size:12px;color:#72828a;line-height:1.8'>Válido por 15 minutos. Tu correo personal de inicio de sesión no se modificará.</p>"+
 "<div style='background:#eaf5ef;border-radius:10px;padding:16px;font-size:12px;line-height:1.8;color:#3a6b55'><b>Tu privacidad importa.</b><br/>Tus reseñas no mostrarán tu correo académico ni tu nombre.</div>"+
 "<p style='margin-top:20px;font-size:11px;color:#8f9ba0;line-height:1.8'>Si no solicitaste este código, ignora el mensaje. No compartas el código con nadie.</p>"+
 "</div></div><div style='text-align:center;color:#9aa4a8;font-size:11px;padding:24px'>Qué Tal Mi Profe · Comunidad estudiantil independiente</div></div></body></html>";
};
async function mail(to:string,code:string,university:string){
 const host=Deno.env.get("ACADEMIC_SMTP_HOST");
 const port=Number(Deno.env.get("ACADEMIC_SMTP_PORT")||"465");
 const username=Deno.env.get("ACADEMIC_SMTP_USER");
 const password=Deno.env.get("ACADEMIC_SMTP_PASS");
 const from=Deno.env.get("ACADEMIC_SMTP_FROM");
 if(!host||!username||!password||!from)throw Error("SMTP_NOT_CONFIGURED");
 if(![465,587,2587].includes(port))throw Error("SMTP_PORT_INVALID");
 const transport=nodemailer.createTransport({host,port,secure:port===465,auth:{user:username,pass:password},connectionTimeout:12000,greetingTimeout:12000,socketTimeout:18000});
 try{
  const result=await transport.sendMail({from:'"Qué Tal Mi Profe" <'+from+'>',to,subject:"Tu código académico | Qué Tal Mi Profe",html:html(code,university),text:"Qué Tal Mi Profe\nCódigo: "+code+"\nVence en 15 minutos. Tu correo de acceso no cambia. No compartas el código."});
  if(!result.accepted?.includes(to))throw Error("RECIPIENT_NOT_ACCEPTED");
 }finally{transport.close()}
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=="POST")return respond(req,{error:"Método no permitido."},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer /,"");
  if(!token)return respond(req,{error:"Inicia sesión para verificar tu correo."},401);
  const {data:identity,error:authError}=await db.auth.getUser(token);
  const user=identity?.user;
  if(authError||!user)return respond(req,{error:"Tu sesión caducó. Inicia sesión nuevamente."},401);
  const raw=await req.text();
  if(raw.length>1024)return respond(req,{error:"Solicitud demasiado grande."},413);
  let data:Record<string,unknown>;
  try{data=JSON.parse(raw)}catch{return respond(req,{error:"Solicitud inválida."},400)}
  if(data.action!=="request"&&data.action!=="confirm")return respond(req,{error:"Acción desconocida."},400);
  const {data:profile,error:profError}=await db.from("student_profiles").select("university_code,verified_academic_email").eq("user_id",user.id).maybeSingle();
  if(profError||!profile?.university_code)return respond(req,{error:"Selecciona primero tu universidad."},400);
  if(data.action==="request"){
   const email=String(data.academic_email||"").trim().toLowerCase();
   if(email.length>254||! /^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email))return respond(req,{error:"Escribe un correo académico válido."},400);
   const domain=email.split("@")[1];
   const {data:uni}=await db.from("student_universities").select("code,parent_code,name").eq("code",profile.university_code).maybeSingle();
   if(!uni)return respond(req,{error:"Universidad no encontrada."},400);
   const {data:accepted}=await db.from("verified_institution_domains").select("domain,kind").eq("domain",domain).eq("parent_code",uni.parent_code||uni.code).maybeSingle();
   if(!accepted)return respond(req,{error:"Este dominio académico aún no está autorizado para tu universidad."},400);
   if(!Deno.env.get("ACADEMIC_SMTP_HOST")||!Deno.env.get("ACADEMIC_SMTP_USER")||!Deno.env.get("ACADEMIC_SMTP_PASS")||!Deno.env.get("ACADEMIC_SMTP_FROM"))
     return respond(req,{error:"El envío al correo académico todavía no está configurado. No se envió ningún mensaje."},503);
   const {data:existing}=await db.from("student_profiles").select("user_id").eq("verified_academic_email",email).neq("user_id",user.id).limit(1);
   if(existing?.length)return respond(req,{error:"Este correo académico ya está asociado con otra cuenta."},409);
   const start=new Date(Date.now()-3600000).toISOString();
   const {count}=await db.from("academic_email_challenges").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",start);
   if((count||0)>=3)return respond(req,{error:"Alcanzaste el límite de tres envíos por hora."},429);
   const {data:recent}=await db.from("academic_email_challenges").select("created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(recent&&Date.now()-new Date(recent.created_at).getTime()<75000)return respond(req,{error:"Espera un minuto antes de solicitar otro código."},429);
   const id=crypto.randomUUID(),numbers=new Uint32Array(1);crypto.getRandomValues(numbers);
   const code=String(numbers[0]%100000000).padStart(8,"0");
   const {error:insertError}=await db.from("academic_email_challenges").insert({id,user_id:user.id,university_code:profile.university_code,academic_email:email,otp_digest:await digest(id,code),expires_at:new Date(Date.now()+900000).toISOString()});
   if(insertError)return respond(req,{error:"No pudimos crear el código de verificación."},500);
   try{
    await mail(email,code,uni.name);
    await db.from("academic_email_challenges").update({delivery_state:"sent"}).eq("id",id);
   }catch(error){
    console.error("Academic SMTP error",error instanceof Error?error.message:"unknown");
    await db.from("academic_email_challenges").delete().eq("id",id);
    return respond(req,{error:"No se pudo entregar el mensaje al correo académico. Revisa la configuración del remitente."},503);
   }
   return respond(req,{ok:true,message:"El servicio aceptó el envío al correo académico. Revisa entrada, spam y correo no deseado."});
  }
  const code=String(data.code||"").trim();
  if(!/^\d{8}$/.test(code))return respond(req,{error:"El código debe contener ocho dígitos."},400);
  const {data:challenge}=await db.from("academic_email_challenges").select("*").eq("user_id",user.id).eq("delivery_state","sent").is("consumed_at",null).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(!challenge)return respond(req,{error:"No hay un código pendiente. Solicita uno nuevo."},400);
  if(challenge.university_code!==profile.university_code)return respond(req,{error:"Tu universidad cambió. Solicita otro código."},400);
  if(new Date(challenge.expires_at).getTime()<Date.now())return respond(req,{error:"El código venció. Solicita uno nuevo."},400);
  if(challenge.attempts>=5)return respond(req,{error:"Se agotaron los intentos. Solicita un nuevo código."},429);
  const hash=await digest(challenge.id,code);
  if(!constantEqual(hash,challenge.otp_digest)){
    await db.from("academic_email_challenges").update({attempts:challenge.attempts+1}).eq("id",challenge.id);
    return respond(req,{error:"El código es incorrecto. Revísalo e intenta de nuevo."},400);
  }
  const {data:uni}=await db.from("student_universities").select("parent_code,code").eq("code",challenge.university_code).maybeSingle();
  const domain=challenge.academic_email.split("@")[1];
  const {data:allowed}=await db.from("verified_institution_domains").select("kind").eq("domain",domain).eq("parent_code",uni?.parent_code||uni?.code||"").maybeSingle();
  if(!allowed)return respond(req,{error:"El dominio ya no está autorizado."},403);
  const {data:updated,error:upError}=await db.from("student_profiles").update({verification_status:allowed.kind,verified_domain:domain,verified_academic_email:challenge.academic_email,verified_at:new Date().toISOString()}).eq("user_id",user.id).eq("university_code",challenge.university_code).select("verification_status").maybeSingle();
  if(upError?.code==="23505")return respond(req,{error:"El correo académico ya está asociado a otra cuenta."},409);
  if(upError||!updated)return respond(req,{error:"No pudimos guardar la verificación."},500);
  await db.from("academic_email_challenges").update({consumed_at:new Date().toISOString()}).eq("id",challenge.id);
  return respond(req,{ok:true,status:updated.verification_status,message:"Correo académico verificado. Seguirás entrando con tu correo personal."});
 }catch(error){
  console.error("Unexpected university verification error",error instanceof Error?error.message:"unknown");
  return respond(req,{error:"Ocurrió un error inesperado. Intenta más tarde."},500);
 }
});
