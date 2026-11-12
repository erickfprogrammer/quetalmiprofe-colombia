import React,{useState} from "react";
import {GraduationCap,ShieldCheck,MailCheck,CheckCircle2,AlertCircle,Loader2,ArrowRight,ArrowLeft,RefreshCcw} from "lucide-react";
import {db,configured} from "./supabase";
import "./auth-confirm.css";

const publicBase="https://quetalmiprofe-colombia.vercel.app";
const params=new URLSearchParams(window.location.search);
const tokenHash=params.get("token_hash")||"";
const flowType=params.get("type")||"email";
const safeType=["email","signup","invite","magiclink","recovery","email_change"].includes(flowType)?flowType:"email";

export default function AuthConfirm(){
 const [stage,setStage]=useState("ready");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [email,setEmail]=useState("");
 const [sent,setSent]=useState(false);
 const origin=window.location.origin;
 function clearTokenFromAddress(){
  window.history.replaceState(null,"",window.location.pathname);
 }
 async function verify(){
  if(!configured||!db){setStage("error");setMessage("El servicio de autenticación no está disponible.");return;}
  if(!tokenHash){setStage("error");setMessage("Este enlace no contiene un código de confirmación válido.");return;}
  setBusy(true);setMessage("");
  try{
   const {error}=await db.auth.verifyOtp({token_hash:tokenHash,type:safeType});
   if(error){
    const {data:userInfo}=await db.auth.getUser();
    if(userInfo?.user?.email_confirmed_at){
     clearTokenFromAddress();
     setStage("success");
     setMessage("Tu correo ya estaba confirmado. Puedes entrar a tu cuenta.");
    }else{
     setStage("error");
     setMessage(/expired|invalid|token|otp/i.test(error.message)?"Este enlace ya fue utilizado o ha vencido. Solicita uno nuevo para confirmar tu correo.":"No pudimos confirmar tu correo: "+error.message);
    }
   }else{
    clearTokenFromAddress();
    setStage("success");
    setMessage("Correo confirmado correctamente. Ya puedes iniciar sesión o entrar a la plataforma.");
   }
  }catch(_err){
   setStage("error");setMessage("Ocurrió un problema de conexión al verificar el correo. Puedes reintentarlo.");
  }
  setBusy(false);
 }
 async function resend(e){
  e.preventDefault();if(!db||!email.trim())return;
  setBusy(true);setSent(false);
  const {error}=await db.auth.resend({type:"signup",email:email.trim(),options:{emailRedirectTo:origin+"/plataforma"}});
  setBusy(false);
  if(error)setMessage("No se pudo reenviar: "+error.message);
  else{setSent(true);setMessage("Si existe una cuenta pendiente de confirmar, recibirás un nuevo correo. Revisa también la carpeta de spam.")}
 }
 return <main className="auth-confirm-page">
  <div className="confirm-glow"/>
  <div className="auth-confirm-wrap">
   <a className="auth-confirm-brand" href="/"><span className="auth-brand-icon"><GraduationCap size={27}/></span><span>qué tal <strong>mi profe<span className="auth-gold-dot">.</span></strong></span></a>
   <section className="auth-confirm-card" aria-live="polite">
    <div className="auth-confirm-icon">{stage==="success"?<CheckCircle2 size={36}/>:stage==="error"?<AlertCircle size={36}/>:<MailCheck size={36}/>}</div>
    <div className="auth-confirm-eyebrow">SEGURIDAD DE TU CUENTA</div>
    {stage==="success"?<>
     <h1>¡Correo confirmado!</h1>
     <p>{message}</p>
     <a className="auth-confirm-btn" href="/plataforma">Ir a la plataforma <ArrowRight size={18}/></a>
    </>:stage==="error"?<>
     <h1>Revisa tu enlace</h1>
     <p>{message}</p>
     <a className="auth-confirm-btn" href="/plataforma">Ir a iniciar sesión <ArrowRight size={18}/></a>
    </>:<>
     <h1>Confirma tu correo</h1>
     <p>Tu cuenta está a un paso de estar lista. Comprueba que llegaste desde un correo de Qué Tal Mi Profe y pulsa el botón para validar tu dirección.</p>
     <button className="auth-confirm-btn" onClick={verify} disabled={busy||!tokenHash}>{busy?<Loader2 className="auth-confirm-spin" size={17}/>:<ShieldCheck size={18}/>} Confirmar mi correo</button>
     {!tokenHash&&<p className="confirm-small">No encontramos un código válido en este enlace.</p>}
    </>}
    {stage!=="success"&&<div className="auth-confirm-resend">
     <h2>¿El enlace venció o ya se utilizó?</h2>
     <p>Si tu cuenta ya quedó confirmada, solo inicia sesión. Si no, solicita otro correo de confirmación.</p>
     <form onSubmit={resend}>
      <label htmlFor="auth-resend-email">Tu correo de registro</label>
      <input id="auth-resend-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="estudiante@universidad.edu.co" required/>
      <button type="submit" disabled={busy||!email.trim()}>{busy?<Loader2 className="auth-confirm-spin" size={15}/>:<RefreshCcw size={15}/>} Reenviar confirmación</button>
     </form>
     {sent&&<div className="confirm-success-note">{message}</div>}
    </div>}
   </section>
   <a className="auth-confirm-back" href="/"><ArrowLeft size={15}/> Volver al inicio</a>
   <div className="auth-confirm-privacy"><ShieldCheck size={16}/> Protegemos tu cuenta. Las reseñas nunca muestran tu correo ni tu identidad públicamente.</div>
  </div>
 </main>;
}
