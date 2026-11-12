import React,{useEffect,useMemo,useState}from"react";
import{Search,GraduationCap,ArrowRight,Star,ShieldCheck,BookOpen,Menu,X,Plus,LogIn,LogOut,CheckCircle2,AlertCircle,ChevronRight,MessageCircle,Flag,School,LockKeyhole,ThumbsUp,Loader2,Sparkles,Eye,Heart,MessageSquare,Check,MapPin,Clock,Send,Filter,Settings2}from"lucide-react";
import universities from"./universities.json";
import institutionalDomains from "./university-email-domains.json";
import Landing from "./Landing";
import{db,configured}from"./supabase";

const googleOAuthConfigured=import.meta.env.VITE_GOOGLE_OAUTH_ENABLED==="true";
const TAGS=["Explica bacano","Califica justo","Es exigente","Responde dudas","Da buen material","Puntual","Muchos trabajos","Parciales difíciles","Se preocupa por aprender","Buena metodología"];
const fmt=n=>Number(n||0).toFixed(1);
const normalize=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const normName=s=>normalize(s).replace(/\s+/g," ").replace(/ñ/g,"n");
const campusParent=code=>{const u=universities.find(x=>x.code===code);return u?.parent_code||(code==="areandina-valledupar"?"2728":code)};
const matchUniversityEmail=(email,code)=>{const domain=String(email||"").trim().toLowerCase().split("@")[1];if(!domain||!code)return null;return institutionalDomains.find(x=>x.domain===domain&&x.parent_code===campusParent(code))||null};
const allowedInstitutionalDomains=code=>institutionalDomains.filter(x=>x.parent_code===campusParent(code));
const institutionVerified=p=>p?.verification_status==="institutional"||p?.verification_status==="student_domain";
const cleanError=e=>{const m=e?.message||"";if(/already registered|user already exists/i.test(m))return "Ese correo ya está registrado. Inicia sesión.";if(/email address not authorized/i.test(m))return "Los correos externos aún no están habilitados. Necesitamos configurar el SMTP de la plataforma.";if(/email not confirmed/i.test(m))return "Revisa tu correo y confirma tu cuenta antes de ingresar.";if(/provider is not enabled|unsupported provider/i.test(m))return "Google aún no está activado en la configuración del proyecto.";return m||"Ocurrió un error. Intenta nuevamente."};
function Initial({name}){return <span className="avatar">{(name||"P").split(" ").filter(Boolean).slice(0,2).map(s=>s[0]).join("").toUpperCase()}</span>}
function Score({value=0,compact=false}){return <span className={"score "+(value>=4?"score-good":value>0&&value<3?"score-low":"")}><Star size={compact?14:18} fill="currentColor"/>{value?fmt(value):"—"}</span>}
function Stars({value,onChange,large=false}){return <div className={"stars "+(large?"stars-large":"")}>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={n+" estrellas"} onClick={()=>onChange?.(n)} disabled={!onChange} className={n<=value?"picked":""}><Star size={large?30:23} fill={n<=value?"currentColor":"none"}/></button>)}</div>}
function UniversityPicker({value,onChange,id="university-picker"}){
 const [term,setTerm]=useState(""),[open,setOpen]=useState(false);
 const selected=universities.find(u=>u.code===value);
 const options=universities.filter(u=>normalize(u.name+" "+u.city+" "+u.department+" "+u.code).includes(normalize(term))).slice(0,9);
 const choose=u=>{onChange(u.code);setTerm("");setOpen(false)};
 return <div className="uni-picker">
  <div className="uni-picker-input"><School size={17}/><input id={id} aria-label="Buscar y seleccionar mi universidad" autoComplete="off" required placeholder="Busca tu universidad o sede..." value={open?term:selected?selected.name+" · "+selected.city:""} onFocus={()=>{setOpen(true);setTerm("")}} onChange={e=>{setTerm(e.target.value);onChange("");setOpen(true)}} onKeyDown={e=>{if(e.key==="Enter"&&open&&options.length){e.preventDefault();choose(options[0])}if(e.key==="Escape")setOpen(false)}}/></div>
  {open&&<div className="uni-picker-results" role="listbox" aria-label="Resultados de universidades">{options.length?options.map(u=><button key={u.code} type="button" role="option" aria-selected={u.code===value} onClick={()=>choose(u)}><span><b>{u.name}</b><small>{u.city||u.department} · {u.campus||"Sede"}</small></span><Check size={u.code===value?16:0}/></button>):<div className="no-uni">No encontramos esa universidad. Prueba con otra palabra.</div>}</div>}
  {selected&&<small className="picked-university"><Check size={14}/> Seleccionada: {selected.name} — {selected.city}</small>}
 </div>
}
function Modal({title,subtitle,onClose,children,wide=false}){return <div className="backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div role="dialog" aria-modal="true" aria-label={title} className={"modal "+(wide?"modal-wide":"")}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20}/></button></div>{children}</div></div>}
function Field({label,children,hint}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>}
function Notice({type="info",children}){return <div className={"notice notice-"+type}><AlertCircle size={18}/><div>{children}</div></div>}
const cardScore=(p,ratings)=>{const r=ratings.filter(x=>x.professor_id===p.id);return{count:r.length,rating:r.length?r.reduce((s,x)=>s+Number(x.score),0)/r.length:0,recommend:r.length?Math.round(100*r.filter(x=>x.would_take_again).length/r.length):0,difficulty:r.length?r.reduce((s,x)=>s+Number(x.difficulty),0)/r.length:0}};
function ProfessorCard({professor,ratings,onClick}){const s=cardScore(professor,ratings);return <button className="prof-card" onClick={onClick}><div className="prof-top"><Initial name={professor.name}/><div className="prof-identity"><h3>{professor.name}</h3><p><School size={13}/>{professor.university_name}</p></div><ChevronRight size={19} className="prof-chevron"/></div><div className="prof-divider"/><div className="prof-bottom"><div><Score value={s.rating}/><span>{s.count===1?"1 opinión":s.count+" opiniones"}</span></div><div className="recommend"><ThumbsUp size={15}/>{s.count?s.recommend+"% recomiendan":"Sin calificar"}</div></div>{professor.campus&&<div className="campus"><MapPin size={12}/>{professor.campus}</div>}</button>}
export default function App(){
 const [user,setUser]=useState(null),[inPlatform,setInPlatform]=useState(()=>window.location.pathname.startsWith("/plataforma")),[boot,setBoot]=useState(true),[teachers,setTeachers]=useState([]),[ratings,setRatings]=useState([]),[loading,setLoading]=useState(false),[q,setQ]=useState(""),[tab,setTab]=useState("profesores"),[uni,setUni]=useState(""),[showAllUnis,setShowAllUnis]=useState(false),[sort,setSort]=useState("relevancia"),[modal,setModal]=useState(""),[selected,setSelected]=useState(null),[authMode,setAuthMode]=useState("login"),[feedback,setFeedback]=useState(null),[busy,setBusy]=useState(false),[menu,setMenu]=useState(false),[adminData,setAdminData]=useState({professors:[],reviews:[],reports:[],students:[]}),[adminTab,setAdminTab]=useState("professors");
 const [authForm,setAuthForm]=useState({email:"",password:"",university_code:"",study_program:"",semester:""}),[registerEmailMode,setRegisterEmailMode]=useState("institutional"),[institutionalEmail,setInstitutionalEmail]=useState(""),[academicCode,setAcademicCode]=useState(""),[academicSent,setAcademicSent]=useState(false),[academicMessage,setAcademicMessage]=useState(""),[pendingEmail,setPendingEmail]=useState(""),[profileForm,setProfileForm]=useState({university_code:"",study_program:"",semester:""}),[studentProfile,setStudentProfile]=useState(null),[profileChecked,setProfileChecked]=useState(false),[newProf,setNewProf]=useState({name:"",university_code:"",campus:""}),[uniTerm,setUniTerm]=useState(""),[review,setReview]=useState({course:"",period:"2026-2",score:0,difficulty:0,would_take_again:null,comment:"",tags:[]}),[report,setReport]=useState({review_id:"",reason:"Información falsa",detail:""}),[accepted,setAccepted]=useState(false);
 const admin=user?.app_metadata?.role==="admin"||user?.app_metadata?.role==="moderator";
 const sortedUnis=useMemo(()=>[...universities].sort((a,b)=>a.name.localeCompare(b.name,"es")) ,[]);
 const uniOptions=useMemo(()=>sortedUnis.filter(x=>normalize(x.name+" "+x.city).includes(normalize(uniTerm))).slice(0,8),[uniTerm,sortedUnis]);
 const similarProfessors=useMemo(()=>{
   const typed=normName(newProf.name);
   if(!newProf.university_code||typed.length<3)return [];
   const words=typed.split(" ").filter(w=>w.length>=3);
   return teachers.filter(p=>p.university_code===newProf.university_code&&
     (normName(p.name).includes(typed)||words.some(w=>normName(p.name).includes(w))))
      .sort((a,b)=>Number(normName(a.name)===typed)-Number(normName(b.name)===typed)).reverse().slice(0,5);
  },[teachers,newProf.name,newProf.university_code]);
 const duplicateProfessor=similarProfessors.some(p=>normName(p.name)===normName(newProf.name));
 const matches=useMemo(()=>{let t=teachers.filter(p=>(!q||normalize(p.name+" "+p.university_name+" "+(p.campus||"")).includes(normalize(q)))&&(!uni||p.university_code===uni));return t.sort((a,b)=>sort==="nombre"?a.name.localeCompare(b.name):sort==="calificacion"?cardScore(b,ratings).rating-cardScore(a,ratings).rating:cardScore(b,ratings).count-cardScore(a,ratings).count)},[teachers,ratings,q,uni,sort]);
 const matchingUnis=useMemo(()=>sortedUnis.filter(x=>normalize(x.name+" "+x.city+" "+x.department).includes(normalize(q))).slice(0,showAllUnis?500:12),[sortedUnis,q,showAllUnis]);
 const selectedRatings=selected?ratings.filter(x=>x.professor_id===selected.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[];
 const selectedScore=selected?cardScore(selected,ratings):{rating:0,count:0,recommend:0,difficulty:0};
 async function loadAll(){if(!db)return;setLoading(true);const [p,r]=await Promise.all([db.from("professors").select("id,name,university_code,university_name,campus,created_at").order("name",{ascending:true}).limit(3000),db.from("public_reviews").select("review_id,professor_id,course,period,score,difficulty,would_take_again,comment,tags,created_at").order("created_at",{ascending:false}).limit(4000)]);if(!p.error)setTeachers(p.data||[]);else setFeedback({type:"error",text:cleanError(p.error)});if(!r.error)setRatings(r.data||[]);setLoading(false)}
 async function loadAdmin(){if(!db||!admin)return;const [p,r,g,s]=await Promise.all([db.from("professor_requests").select("*").order("created_at",{ascending:false}).limit(200),db.from("review_entries").select("id,professor_id,course,period,score,difficulty,would_take_again,comment,tags,status,created_at").order("created_at",{ascending:false}).limit(200),db.from("reports").select("*").order("created_at",{ascending:false}).limit(200),db.from("university_student_counts").select("university_code,university_name,city,student_count").order("student_count",{ascending:false}).limit(500)]);setAdminData({professors:p.data||[],reviews:r.data||[],reports:g.data||[],students:s.data||[]});if(s.error)toast("No pudimos cargar las estadísticas universitarias: "+cleanError(s.error),"error")}
 useEffect(()=>{let alive=true;if(!db){setBoot(false);return;}db.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setBoot(false)}});const{data:{subscription}}=db.auth.onAuthStateChange((_e,s)=>setUser(s?.user||null));loadAll();return()=>{alive=false;subscription.unsubscribe()}},[]);
 useEffect(()=>{if(admin&&modal==="admin")loadAdmin()},[admin,modal]);
 useEffect(()=>{
  let live=true;
  if(!db||!user?.id){setStudentProfile(null);setProfileForm({university_code:"",study_program:"",semester:""});setProfileChecked(false);return;}
  setStudentProfile(null);setProfileChecked(false);
  db.from("student_profiles").select("user_id,university_code,study_program,semester,verification_status,verified_domain,verified_at").eq("user_id",user.id).maybeSingle().then(({data,error})=>{
   if(!live)return;
   if(error){setFeedback({type:"error",text:"No se pudo consultar tu perfil académico: "+cleanError(error)});setProfileChecked(true);return;}
   setStudentProfile(data||null);setProfileForm({university_code:data?.university_code||"",study_program:data?.study_program||"",semester:data?.semester?String(data.semester):""});setProfileChecked(true);
   if(!data)setModal(m=>m==="auth"||m===""?"completeProfile":m);
  });
  return()=>{live=false};
 },[user?.id,user?.email,user?.email_confirmed_at]);
 useEffect(()=>{function syncRoute(){setInPlatform(window.location.pathname.startsWith("/plataforma"));setMenu(false);setModal("");}window.addEventListener("popstate",syncRoute);return()=>window.removeEventListener("popstate",syncRoute)},[]);
 function navigateHome(){if(window.location.pathname!=="/")window.history.pushState(null,"","/");setInPlatform(false);setMenu(false);setModal("");setFeedback(null);window.scrollTo({top:0,behavior:"smooth"});}
 function navigatePlatform(nextTab="profesores",search=""){setTab(nextTab);setQ(search);setUni("");setShowAllUnis(false);setMenu(false);setModal("");setFeedback(null);if(window.location.pathname!=="/plataforma")window.history.pushState(null,"","/plataforma");setInPlatform(true);window.scrollTo({top:0,behavior:"smooth"});}
 function scrollLanding(section){setMenu(false);const el=document.getElementById(section);el?.scrollIntoView({behavior:"smooth",block:"start"});}
 function toast(text,type="success"){setFeedback({text,type});window.scrollTo({top:0,behavior:"smooth"});}
 function openLogin(mode="login"){setAuthMode(mode);setModal("auth");setFeedback(null)}
 function needsAuth(next){if(!configured){toast("El servicio de cuentas no está disponible todavía.","error");return;}if(!user){openLogin("register");return;}if(!profileChecked||!studentProfile){setModal("completeProfile");toast("Selecciona tu universidad antes de participar.");return;}if(!institutionVerified(studentProfile)){setModal("verification");toast("Para enviar opiniones debes confirmar un correo institucional de la universidad que elegiste.","error");return;}setModal(next)}
 function enterProf(p){setSelected(p);setModal("profile");window.history.replaceState(null,"","#profe-"+p.id)}
 function close(){setModal("");setAccepted(false);if(window.location.hash.startsWith("#profe-"))window.history.replaceState(null,"",window.location.pathname)}
 async function submitAuth(e){
 e.preventDefault();if(!db)return;
 if(authMode==="register"&&!universities.some(u=>u.code===authForm.university_code&&u.status!=="Inactiva"))return toast("Debes seleccionar una institución activa del listado oficial.","error");
 if(authMode==="register"&&registerEmailMode==="institutional"&&!matchUniversityEmail(authForm.email,authForm.university_code))return toast("El correo debe pertenecer a un dominio universitario que hayamos validado para esa institución.","error");
 setBusy(true);const email=authForm.email.trim(),password=authForm.password;
 const data={university_code:authForm.university_code,study_program:authForm.study_program.trim(),semester:authForm.semester||null};
 const r=authMode==="register"?await db.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/plataforma",data}}):await db.auth.signInWithPassword({email,password});
 setBusy(false);if(r.error)return toast(cleanError(r.error),"error");
 if(authMode==="register"){
  setPendingEmail(email);
  if(r.data?.session){navigatePlatform("profesores","");toast("¡Cuenta creada! Ya puedes entrar a la plataforma.");}
  else setModal("checkEmail");
 }else{
  navigatePlatform("profesores","");toast("Ingresaste correctamente. Bienvenido a la plataforma: tu universidad nunca aparecerá junto a tus comentarios públicos.");
 }
}
 async function resendSignupEmail(){
  if(!db||!pendingEmail)return;
  setBusy(true);
  const {error}=await db.auth.resend({type:"signup",email:pendingEmail,options:{emailRedirectTo:window.location.origin+"/plataforma"}});
  setBusy(false);
  if(error)return toast("No se pudo reenviar el correo: "+cleanError(error),"error");
  toast("Solicitud recibida. Revisa la bandeja de entrada y spam. Si tu cuenta ya fue confirmada, puedes iniciar sesión.");
 }
 async function signInWithGoogle(){
 if(!googleOAuthConfigured)return toast("El acceso Google está pendiente de activar en Google Cloud y Supabase.","error");
 if(!db)return toast("El servicio de inicio de sesión no está listo.","error");
 setBusy(true);
 const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/plataforma",scopes:"openid email profile"}});
 setBusy(false);if(error)toast("No se pudo iniciar con Google: "+cleanError(error),"error");
}
 async function saveStudentProfile(e){
 e.preventDefault();if(!db||!user)return;
 if(!universities.some(u=>u.code===profileForm.university_code))return toast("Selecciona una institución válida.","error");
 setBusy(true);
 const {data,error}=await db.from("student_profiles").upsert({user_id:user.id,university_code:profileForm.university_code,study_program:profileForm.study_program.trim(),semester:profileForm.semester?Number(profileForm.semester):null},{onConflict:"user_id"}).select("user_id,university_code,study_program,semester,verification_status,verified_domain,verified_at").single();
 setBusy(false);if(error)return toast(cleanError(error),"error");
 setStudentProfile(data);setProfileChecked(true);close();toast(institutionVerified(data)?"Universidad guardada y correo institucional confirmado.":"Universidad guardada. Confirma tu correo institucional para poder publicar; tus opiniones seguirán siendo públicas sin tu identidad.");
}
 async function explainAcademicError(error,reply){
  if(reply?.error)return reply.error;
  try{
   if(error?.context&&typeof error.context.json==="function"){
    const details=await error.context.json();
    return details?.error||details?.message||"No pudimos verificar el correo.";
   }
  }catch{}
  return error?.message||"No pudimos completar la verificación académica.";
 }
 async function requestInstitutionalEmailVerification(e){
  e.preventDefault();
  if(!db||!user||!studentProfile)return;
  const email=institutionalEmail.trim().toLowerCase();
  if(!matchUniversityEmail(email,studentProfile.university_code)){
   setAcademicMessage("Ese dominio académico no corresponde a la universidad elegida.");
   return;
  }
  setBusy(true);setAcademicMessage("");
  try{
   const {data,error}=await db.functions.invoke("academic-email-verification",{body:{action:"request",academic_email:email}});
   if(error||!data?.ok){setAcademicMessage(await explainAcademicError(error,data));return;}
   setAcademicSent(true);setAcademicCode("");setAcademicMessage(data.message||"Revisa tu correo universitario.");
  }catch{setAcademicMessage("No pudimos contactar el servicio de verificación.");}
  finally{setBusy(false);}
 }
 async function confirmAcademicCode(e){
  e.preventDefault();
  if(!db||!user||academicCode.length!==8)return;
  setBusy(true);setAcademicMessage("");
  try{
   const {data,error}=await db.functions.invoke("academic-email-verification",{body:{action:"confirm",code:academicCode}});
   if(error||!data?.ok){setAcademicMessage(await explainAcademicError(error,data));return;}
   setAcademicSent(false);setAcademicCode("");setAcademicMessage(data.message||"Correo académico confirmado.");
   const {data:profile,error:refreshError}=await db.from("student_profiles").select("user_id,university_code,study_program,semester,verification_status,verified_domain,verified_at,verified_academic_email").eq("user_id",user.id).maybeSingle();
   if(!refreshError){setStudentProfile(profile||null);setProfileChecked(true);}
  }catch{setAcademicMessage("No pudimos comprobar el código. Inténtalo nuevamente.");}
  finally{setBusy(false);}
 }
 async function refreshVerification(){
 if(!db||!user)return;
 const {data,error}=await db.from("student_profiles").select("user_id,university_code,study_program,semester,verification_status,verified_domain,verified_at").eq("user_id",user.id).maybeSingle();
 if(error)return toast(cleanError(error),"error");
 setStudentProfile(data||null);toast(institutionVerified(data)?"Tu correo institucional está verificado.":"Todavía no se ha confirmado el correo institucional de esta cuenta.",institutionVerified(data)?"success":"error");
}
 async function submitProfessor(e){e.preventDefault();if(!db||!user)return;if(duplicateProfessor)return toast("Este profesor ya aparece registrado en esta universidad. Entra a su ficha en lugar de duplicarlo.","error");const found=universities.find(u=>u.code===newProf.university_code);if(!found)return toast("Selecciona una institución del listado oficial.","error");if(newProf.name.trim().length<5)return toast("Escribe el nombre completo del profesor.","error");setBusy(true);const{error}=await db.from("professor_requests").insert({name:newProf.name.trim(),university_code:found.code,university_name:found.name,campus:newProf.campus.trim(),submitted_by:user.id});setBusy(false);if(error)return toast(error.code==="23505"?"Ese profesor ya está registrado o existe una solicitud pendiente para la misma universidad.":"No se pudo crear la solicitud: "+cleanError(error),"error");close();setNewProf({name:"",university_code:"",campus:""});setUniTerm("");toast("¡Gracias! Revisaremos los datos antes de publicar al profesor.");}
 async function submitReview(e){e.preventDefault();if(!db||!user||!selected)return;if(!review.score||!review.difficulty||review.would_take_again===null)return toast("Completa las calificaciones y si volverías a tomar su clase.","error");if(review.comment.trim().length<40)return toast("Tu opinión debe tener al menos 40 caracteres.","error");if(/(?:https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b3\d{9}\b)/i.test(review.comment))return toast("Evita enlaces, emails y números de teléfono.","error");if(!accepted)return toast("Debes aceptar las reglas de la comunidad.","error");setBusy(true);const{error}=await db.from("review_entries").insert({professor_id:selected.id,author_id:user.id,course:review.course.trim(),period:review.period.trim(),score:review.score,difficulty:review.difficulty,would_take_again:review.would_take_again,comment:review.comment.trim(),tags:review.tags,status:"pending"});setBusy(false);if(error)return toast(error.code==="23505"?"Ya opinaste sobre este profesor en esa materia.":cleanError(error),"error");close();setReview({course:"",period:"2026-2",score:0,difficulty:0,would_take_again:null,comment:"",tags:[]});toast("Tu opinión se envió anónimamente. Aparecerá tras su revisión.");}
 async function submitReport(e){e.preventDefault();if(!db||!user)return;setBusy(true);const{error}=await db.from("reports").insert({review_id:report.review_id,user_id:user.id,reason:report.reason,detail:report.detail.trim()});setBusy(false);if(error)return toast(cleanError(error),"error");close();toast("Recibimos tu reporte. Nuestro equipo lo revisará.");}
 async function moderate(table,id,status){setBusy(true);const{error}=await db.from(table).update({status}).eq("id",id);setBusy(false);if(error)return toast(cleanError(error),"error");await Promise.all([loadAdmin(),loadAll()]);toast(status==="approved"?"Contenido aprobado.":"Contenido actualizado.");}
 function startReview(){if(!selected)return;needsAuth("review")}
 const noStats=teachers.length===0;
 return <div className={"app "+(inPlatform?"workspace-view":"landing-view")}>
 <header className="nav"><div className="nav-inner">
  <button className="brand" onClick={navigateHome} aria-label="Qué Tal Mi Profe, volver al inicio"><span className="brand-mark"><GraduationCap size={25} strokeWidth={2.5}/></span><span>qué tal <b>mi profe<span className="brand-dot">.</span></b></span></button>
  <nav className={menu?"nav-links show":"nav-links"} aria-label="Navegación principal">
   {inPlatform?<><button onClick={navigateHome}>Inicio</button><button className={tab==="profesores"?"nav-current":""} onClick={()=>navigatePlatform("profesores","")}>Profesores</button><button className={tab==="universidades"?"nav-current":""} onClick={()=>navigatePlatform("universidades","")}>Universidades</button></>:<><button onClick={()=>scrollLanding("como-funciona")}>Cómo funciona</button><button onClick={()=>navigatePlatform("universidades","")}>Universidades</button><button onClick={()=>navigatePlatform("profesores","")}>Explorar profesores</button></>}
   {user&&<><button onClick={()=>{setModal("completeProfile");setMenu(false)}}>Mi universidad</button><button className="mobile-only" onClick={async()=>{await db.auth.signOut();setMenu(false)}}>Salir</button></>}
   {!user&&<><button className="mobile-only" onClick={()=>{openLogin("login");setMenu(false)}}>Iniciar sesión</button><button className="mobile-only" onClick={()=>{openLogin("register");setMenu(false)}}>Crear cuenta</button></>}
   {admin&&<button onClick={()=>{setModal("admin");setMenu(false)}}>Moderación</button>}
  </nav>
  <div className="nav-actions">
   {user?<><span className="signed-user">{user.email?.split("@")[0]}</span><button className="btn btn-ghost desktop-btn" onClick={()=>setModal("completeProfile")}><School size={15}/>Mi universidad</button><button className="btn btn-ghost desktop-btn" onClick={async()=>{await db.auth.signOut();toast("Sesión cerrada.")}}><LogOut size={16}/>Salir</button></>:
    <><button className="btn btn-ghost desktop-btn" onClick={()=>openLogin("login")}>Iniciar sesión</button><button className="btn btn-light desktop-btn" onClick={()=>openLogin("register")}>Registrarme <ArrowRight size={16}/></button></>}
   <button className="icon-button mobile-menu" aria-label={menu?"Cerrar menú":"Abrir menú"} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X size={23}/>:<Menu size={23}/>}</button>
  </div></div></header>
 {feedback&&<div className={"global-feedback "+(feedback.type==="error"?"error":"")}><span>{feedback.text}</span><button aria-label="Cerrar aviso" onClick={()=>setFeedback(null)}><X size={16}/></button></div>}
 {inPlatform?<>
 <section className="platform-intro"><div className="platform-intro-inner"><button className="platform-breadcrumb" onClick={navigateHome}>Inicio <ChevronRight size={14}/> Plataforma</button><div className="platform-intro-heading"><div><span className="platform-kicker"><Sparkles size={14}/> TU COMUNIDAD ACADÉMICA</span><h1>Encuentra tu próximo <em>profe.</em></h1><p>Busca universidades y profesores. Lee experiencias reales y comparte tu opinión de forma anónima para el público.</p></div><div className="platform-intro-art"><GraduationCap size={67}/><span><Star size={19} fill="currentColor"/> Tu experiencia importa</span></div></div></div></section>

 <main><div className="search-shell"><div className="search-heading"><div><div className="overline"><Sparkles size={14}/> ENCUENTRA LO QUE BUSCAS</div><h2>¿Qué profe te toca?</h2><p>Conoce las experiencias que otros estudiantes han compartido.</p></div><button className="btn btn-dark add-prof" onClick={()=>needsAuth("add")}><Plus size={17}/>Agregar profesor</button></div><div className="search-box"><div className="search-tabs"><button className={tab==="profesores"?"active":""} onClick={()=>{setTab("profesores");setQ("")}}><GraduationCap size={17}/>Profesores</button><button className={tab==="universidades"?"active":""} onClick={()=>{setTab("universidades");setQ("")}}><School size={17}/>Universidades</button></div><div className="search-row"><label className="main-search"><Search size={22}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={tab==="profesores"?"Escribe el nombre del profesor o la universidad":"Busca tu universidad, ciudad o departamento"} aria-label="Buscar"/></label>{tab==="profesores"&&<select className="uni-filter" value={uni} onChange={e=>setUni(e.target.value)} aria-label="Filtrar por universidad"><option value="">Todas las universidades</option>{sortedUnis.map(u=><option value={u.code} key={u.code}>{u.name}</option>)}</select>}</div><div className="search-bottom"><span><ShieldCheck size={14}/> Opiniones revisadas antes de publicarse</span><span>{universities.length} sedes e instituciones en nuestro directorio</span></div></div></div>
 <section className="content-section">{tab==="profesores"?<><div className="list-head"><div><div className="overline coral">EXPLORA LA COMUNIDAD</div><h2>{q?"Resultados de tu búsqueda":"Profesores de la comunidad"}</h2><p>{loading?"Cargando profesores...":matches.length+" profesores encontrados"}</p></div><div className="sort"><Filter size={16}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Ordenar profesores"><option value="relevancia">Más opiniones</option><option value="calificacion">Mejor calificados</option><option value="nombre">Nombre A-Z</option></select></div></div>{loading?<div className="empty-state"><Loader2 className="spin" size={36}/><h3>Cargando profesores</h3></div>:matches.length?<div className="prof-grid">{matches.map(p=><ProfessorCard key={p.id} professor={p} ratings={ratings} onClick={()=>enterProf(p)}/>)}</div>:<div className="empty-state"><div className="empty-icon"><BookOpen size={34}/></div><h3>{q||uni?"Aún no encontramos ese profesor":"Construyamos esta comunidad juntos"}</h3><p>{q||uni?"Prueba con otro nombre o agrégalo para que los estudiantes puedan encontrarlo.":"Todavía no hay profesores publicados. Sé de los primeros en aportar a la comunidad."}</p><button className="btn btn-dark" onClick={()=>needsAuth("add")}><Plus size={17}/>Agregar un profesor</button></div>}</>:<><div className="list-head"><div><div className="overline coral">DIRECTORIO NACIONAL</div><h2>Universidades de Colombia</h2><p>Instituciones del Ministerio de Educación y sedes contrastadas con fuentes oficiales universitarias.</p></div></div><div className="universities-grid">{matchingUnis.map(u=><button className="university-row" key={u.code} onClick={()=>{setUni(u.code);setTab("profesores");setQ("")}}><span className="uni-icon"><School size={20}/></span><span className="uni-name"><b>{u.name}</b><small><MapPin size={13}/>{u.city||u.department||"Colombia"}</small></span><ChevronRight size={18}/></button>)}</div>{!matchingUnis.length&&<div className="empty-state"><h3>No encontramos esa institución</h3><p>Intenta buscarla por otro nombre o ciudad.</p></div>}{!showAllUnis&&sortedUnis.length>12&&<button className="show-more" onClick={()=>setShowAllUnis(true)}>Ver todas las instituciones <ArrowRight size={16}/></button>}</>}</section>
 <section className="values-strip"><div><span className="value-icon orange"><MessageSquare size={22}/></span><div><h3>Tu voz vale</h3><p>Comparte tu experiencia para ayudar a otros.</p></div></div><div><span className="value-icon lavender"><LockKeyhole size={22}/></span><div><h3>Anonimato público</h3><p>Tu nombre no se publica junto a tu reseña.</p></div></div><div><span className="value-icon mint"><ShieldCheck size={22}/></span><div><h3>Opiniones responsables</h3><p>Moderamos contenido y atendemos reportes.</p></div></div></section>
 <section className="cta"><div><span className="overline">LA U SE VIVE MEJOR ENTRE TODOS</span><h2>¿Tu profe todavía no está aquí?</h2><p>Agrégalo y ayuda a que más estudiantes tomen decisiones informadas.</p></div><button className="btn btn-light" onClick={()=>needsAuth("add")}>Sumar un profesor <ArrowRight size={18}/></button></section>
 </main>
 </>:<Landing user={user} universityCount={universities.length} professorCount={teachers.length} onExplore={navigatePlatform} onRegister={()=>user?setModal("completeProfile"):openLogin("register")} onLogin={()=>openLogin("login")} onSearch={navigatePlatform} onOpenPrivacy={()=>setModal("privacy")}/>}<footer className="footer"><div className="footer-inner"><div><div className="footer-brand"><GraduationCap size={23}/> qué tal mi profe<span>.</span></div><p>Una comunidad estudiantil independiente de las universidades.</p></div><div className="footer-links"><button onClick={()=>setModal("about")}>Cómo funciona</button><button onClick={()=>setModal("rules")}>Reglas de la comunidad</button><button onClick={()=>setModal("privacy")}>Privacidad</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Qué Tal Mi Profe · Colombia</span><span>Fuentes: Ministerio de Educación Nacional y sitios oficiales de universidades.</span></div></footer>
 {!configured&&<div className="setup-banner"><Settings2 size={18}/><div><b>Versión de demostración.</b> El directorio funciona, pero el registro y las opiniones requieren conectar la base de datos Supabase.</div></div>}
 {modal==="auth"&&<Modal title={authMode==="register"?"Únete a la comunidad":"¡Qué bueno verte!"} subtitle={authMode==="register"?"Regístrate con Google o correo. Tus opiniones serán públicas, pero tu identidad no.":"Inicia sesión y sigue ayudando a otros estudiantes."} onClose={close}>
 <div className="anon-privacy"><ShieldCheck size={21}/><div><b>Tus comentarios son siempre anónimos para otros usuarios</b><span>Tu nombre, correo y universidad NO se muestran junto a tus reseñas. Los moderadores pueden consultar datos internos para proteger la comunidad.</span></div></div>
 <button type="button" className="google-auth-button" disabled={busy||!configured||!googleOAuthConfigured} onClick={signInWithGoogle}><span className="google-g">G</span> Continuar con Google <ArrowRight size={16}/></button>
 {!googleOAuthConfigured&&<p className="provider-note">Google está preparado, pero su activación está pendiente de conectar credenciales OAuth al proyecto.</p>}
 <div className="auth-separator"><span>o continúa con tu correo</span></div>
 <div className="auth-tabs"><button className={authMode==="login"?"active":""} onClick={()=>setAuthMode("login")}>Ingresar</button><button className={authMode==="register"?"active":""} onClick={()=>setAuthMode("register")}>Crear cuenta</button></div>
 <form onSubmit={submitAuth} className="form">
 {authMode==="register"&&<div className="email-signup-switch" role="group" aria-label="Tipo de correo para registrarte">
  <button type="button" className={registerEmailMode==="institutional"?"active":""} onClick={()=>setRegisterEmailMode("institutional")}><ShieldCheck size={16}/> Correo universitario</button>
  <button type="button" className={registerEmailMode==="personal"?"active":""} onClick={()=>setRegisterEmailMode("personal")}><LockKeyhole size={16}/> Correo personal</button>
 </div>}
 <Field label={authMode==="register"&&registerEmailMode==="institutional"?"Correo de tu universidad":"Correo electrónico"}><input type="email" required autoComplete="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="tu.correo@ejemplo.com"/></Field>
 <Field label="Contraseña"><input type="password" required minLength={8} autoComplete={authMode==="register"?"new-password":"current-password"} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="Mínimo 8 caracteres"/></Field>
 {authMode==="register"&&<>
 <Field label="¿De qué universidad eres? *"><UniversityPicker id="register-university" value={authForm.university_code} onChange={v=>setAuthForm(a=>({...a,university_code:v}))}/><small>Selecciona tu sede. Solo declararla no verifica que seas estudiante.</small></Field>
 {registerEmailMode==="institutional"&&<div className="university-verify-preview">
  {authForm.university_code?<>
   {allowedInstitutionalDomains(authForm.university_code).length?<><b><ShieldCheck size={16}/> Dominios institucionales reconocidos</b><p>{allowedInstitutionalDomains(authForm.university_code).map(x=>"@"+x.domain).join(" · ")}</p><small>{matchUniversityEmail(authForm.email,authForm.university_code)?"El dominio coincide. Falta confirmar el mensaje de Supabase para quedar verificado.":"Escribe tu dirección completa con uno de estos dominios y confirma el correo que recibas."}</small></>:<><b><LockKeyhole size={16}/> Dominio todavía no validado</b><p>Esta universidad aparece en el directorio, pero aún no hemos comprobado su dominio de correo. Puedes registrarte con correo personal para explorar; para publicar, primero debemos verificar el dominio.</p></>}
  </>:<p>Selecciona tu universidad para ver sus dominios de correo aceptados.</p>}
 </div>}
 {registerEmailMode==="personal"&&<div className="university-verify-preview"><b><LockKeyhole size={15}/> Explora sin verificación</b><p>Con correo personal puedes consultar profesores. Para agregar profesores o calificar deberás confirmar luego un correo institucional válido.</p></div>}
 <Field label="Programa académico (opcional)"><input maxLength={120} value={authForm.study_program} onChange={e=>setAuthForm({...authForm,study_program:e.target.value})} placeholder="Ej. Ingeniería Civil"/></Field>
 <Field label="Semestre (opcional)"><select value={authForm.semester} onChange={e=>setAuthForm({...authForm,semester:e.target.value})}><option value="">Prefiero no indicarlo</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}° semestre</option>)}</select></Field>
 </>}
 <button disabled={busy||!configured||(authMode==="register"&&(!authForm.university_code||(registerEmailMode==="institutional"&&!matchUniversityEmail(authForm.email,authForm.university_code))))} className="btn btn-dark submit" type="submit">{busy?<Loader2 className="spin" size={18}/>:authMode==="register"?"Registrarme por correo":"Ingresar con correo"}<ArrowRight size={17}/></button>
 </form></Modal>}
 {modal==="checkEmail"&&<Modal title="¡Revisa tu correo!" subtitle="Ya recibimos tu registro. Solo falta confirmar tu cuenta." onClose={close}>
 <div className="signup-mail-state">
  <div className="signup-mail-icon"><ShieldCheck size={32}/></div>
  <p>Enviamos un enlace de confirmación a <b>{pendingEmail}</b>. Abre el mensaje de <b>Qué Tal Mi Profe</b> y confirma desde allí.</p>
  <div className="soft-note"><LockKeyhole size={18}/>No necesitas crear una segunda cuenta. Si el enlace ya se utilizó, intenta iniciar sesión con la contraseña que elegiste.</div>
  <button type="button" className="btn btn-dark submit" disabled={busy} onClick={resendSignupEmail}>{busy?<Loader2 className="spin" size={17}/>:<Send size={17}/>}Reenviar correo de confirmación</button>
  <button type="button" className="signup-login-instead" onClick={()=>openLogin("login")}>Ya confirmé mi correo · Iniciar sesión <ArrowRight size={16}/></button>
 </div>
 </Modal>}
 {modal==="completeProfile"&&<Modal title={studentProfile?"Mi perfil universitario":"¿De qué universidad eres?"} subtitle="Tu universidad se guarda en tu cuenta, pero jamás aparece junto a tus reseñas públicas." onClose={close}>
 <div className="anon-privacy"><LockKeyhole size={21}/><div><b>Tu identidad queda oculta en las opiniones públicas</b><span>La universidad es privada y solo se utiliza para estadísticas de la comunidad y moderación autorizada. Declarar tu universidad no equivale a verificar matrícula.</span></div></div>
 <form onSubmit={saveStudentProfile} className="form">
 <Field label="Universidad o institución *"><UniversityPicker id="profile-university" value={profileForm.university_code} onChange={v=>setProfileForm(a=>({...a,university_code:v}))}/></Field>
 <Field label="Programa académico (opcional)"><input maxLength={120} value={profileForm.study_program} onChange={e=>setProfileForm({...profileForm,study_program:e.target.value})} placeholder="Ej. Derecho"/></Field>
 <Field label="Semestre actual (opcional)"><select value={profileForm.semester} onChange={e=>setProfileForm({...profileForm,semester:e.target.value})}><option value="">Prefiero no indicarlo</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}° semestre</option>)}</select></Field>
 {studentProfile&&<div className={institutionVerified(studentProfile)?"verification-success":"verification-pending"}>
  {institutionVerified(studentProfile)?<ShieldCheck size={19}/>:<LockKeyhole size={19}/>}
  <div><b>{institutionVerified(studentProfile)?"Correo institucional confirmado":"Vínculo universitario pendiente"}</b><span>{institutionVerified(studentProfile)?"Tienes control de un correo asociado a la institución declarada. Esto no certifica matrícula vigente.":"Verifica tu correo universitario para enviar reseñas y solicitar docentes."}</span></div>
  {!institutionVerified(studentProfile)&&<button type="button" onClick={()=>setModal("verification")}>Verificar</button>}
 </div>}
 <button type="submit" disabled={busy||!user||!profileForm.university_code} className="btn btn-dark submit">{busy?<Loader2 className="spin" size={18}/>:<Check size={17}/>}Guardar mi universidad</button>
 </form></Modal>}
 {modal==="verification"&&<Modal title="Verifica tu correo académico" subtitle="Tu correo personal seguirá siendo el acceso a tu cuenta. La confirmación académica es independiente." onClose={close}>
  <div className="anon-privacy"><ShieldCheck size={20}/><div><b>Solo enviamos el código al correo universitario</b><span>No enviamos confirmaciones académicas al correo personal ni modificamos el correo con el que inicias sesión. Tu identidad seguirá oculta en las reseñas públicas.</span></div></div>
  {studentProfile?<div className="verification-info">
   <p><b>Universidad:</b> {universities.find(x=>x.code===studentProfile.university_code)?.name||"Tu universidad"} · {universities.find(x=>x.code===studentProfile.university_code)?.city||""}</p>
   <p><b>Estado:</b> {institutionVerified(studentProfile)?"Correo universitario confirmado":"Correo de acceso confirmado; vínculo universitario pendiente"}</p>
   {institutionVerified(studentProfile)?<div className="verification-success"><ShieldCheck size={20}/>Tu correo académico ya está validado. Puedes publicar reseñas y proponer profesores conforme a las reglas.</div>:
   <>
    <form className="form" onSubmit={requestInstitutionalEmailVerification}>
     <Field label="Dirección de correo universitario"><input required type="email" autoComplete="off" value={institutionalEmail} onChange={e=>{setInstitutionalEmail(e.target.value);setAcademicSent(false);setAcademicCode("");setAcademicMessage("")}} placeholder={allowedInstitutionalDomains(studentProfile.university_code)[0]?"tuusuario@"+allowedInstitutionalDomains(studentProfile.university_code)[0].domain:"correo@universidad.edu.co"}/></Field>
     <div className="university-verify-preview">
      <b>Dominios universitarios reconocidos</b>
      <p>{allowedInstitutionalDomains(studentProfile.university_code).length?allowedInstitutionalDomains(studentProfile.university_code).map(x=>"@"+x.domain).join(" · "):"Todavía falta verificar el dominio institucional de esta universidad."}</p>
      <small>Al enviar el código no se cambia tu dirección personal de acceso. Solo se solicita una prueba de control del correo universitario. El código vence en 15 minutos.</small>
     </div>
     <button className="btn btn-dark submit" type="submit" disabled={busy||!matchUniversityEmail(institutionalEmail,studentProfile.university_code)}>{busy?<Loader2 className="spin" size={18}/>:<Send size={17}/>}Enviar código únicamente al académico</button>
    </form>
    {academicSent&&<form className="form academic-code-form" onSubmit={confirmAcademicCode}>
     <Field label="Código de 8 dígitos del correo académico"><input required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={academicCode} onChange={e=>setAcademicCode(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="12345678" /></Field>
     <button className="btn btn-dark submit" disabled={busy||academicCode.length!==8} type="submit">{busy?<Loader2 className="spin" size={18}/>:<ShieldCheck size={18}/>}Confirmar mi correo académico</button>
    </form>}
    {academicMessage&&<div className={academicSent?"academic-info":"academic-error"} role="status">{academicMessage}</div>}
   </>}
   <button type="button" className="verification-refresh" onClick={refreshVerification}><Check size={16}/>Consultar mi estado de verificación</button>
   <p className="verification-disclaimer">Importante: tener acceso a un correo universitario es una señal de vinculación institucional, pero no confirma matrícula vigente. No compartas nunca el código. Los correos de cambio de dirección enviados por el sistema anterior ya no son necesarios para este proceso.</p>
  </div>:<div className="soft-note"><LockKeyhole size={18}/>Primero completa tu perfil indicando tu universidad.</div>}
 </Modal>}
 {modal==="add"&&<Modal title="Agregar un profesor" subtitle="Ayuda a completar nuestro directorio. Revisaremos los datos antes de publicarlos." onClose={close}><form className="form" onSubmit={submitProfessor}><Field label="Nombre completo del profesor"><input required minLength={5} maxLength={120} value={newProf.name} onChange={e=>setNewProf({...newProf,name:e.target.value})} placeholder="Ej. María Fernanda Rodríguez"/></Field><Field label="Universidad o institución"><input value={uniTerm} onChange={e=>{setUniTerm(e.target.value);setNewProf({...newProf,university_code:""})}} placeholder="Escribe para buscar una institución..." required/>{uniTerm&&<div className="suggestions">{uniOptions.map(x=><button type="button" key={x.code} onClick={()=>{setUniTerm(x.name+" · "+(x.city||x.department));setNewProf({...newProf,university_code:x.code})}}><School size={16}/><span>{x.name}<small>{x.city||x.department}</small></span></button>)}</div>}{newProf.university_code&&<div className="selected-note"><Check size={14}/>Institución seleccionada</div>}</Field>{newProf.university_code&&normName(newProf.name).length>=3&&<div className="teacher-suggestions"><div className="teacher-suggestions-head"><Search size={16}/><b>{similarProfessors.length?"¿Es alguno de estos profesores?":"No encontramos coincidencias publicadas"}</b></div>
 {similarProfessors.map(p=><button type="button" key={p.id} className="teacher-suggestion" onClick={()=>enterProf(p)}><Initial name={p.name}/><span><b>{p.name}</b><small>{p.university_name} · Ver perfil y calificar</small></span><ArrowRight size={18}/></button>)}
 {duplicateProfessor&&<div className="duplicate-warning"><AlertCircle size={16}/>Ese nombre ya existe en la universidad seleccionada. No puedes solicitar otro registro igual.</div>}
 {!similarProfessors.length&&<small>Si tu profesor todavía no aparece, continúa con la solicitud. Se revisará antes de publicarla.</small>}
 </div>}
 <Field label="Sede o campus (opcional)"><input value={newProf.campus} maxLength={100} onChange={e=>setNewProf({...newProf,campus:e.target.value})} placeholder="Ej. Valledupar"/></Field><Notice>Evita duplicados y usa el nombre real del docente. No incluyas datos de contacto ni información privada.</Notice><button type="submit" className="btn btn-dark submit" disabled={busy||!newProf.university_code||duplicateProfessor}>{busy?<Loader2 className="spin" size={18}/>:<Plus size={18}/>}Enviar a revisión</button></form></Modal>}
 {modal==="profile"&&selected&&<Modal title={selected.name} subtitle={selected.university_name+(selected.campus?" · "+selected.campus:"")} onClose={close} wide><div className="profile-heading"><Initial name={selected.name}/><div className="profile-grade"><Score value={selectedScore.rating}/><span>{selectedScore.count} opiniones publicadas</span></div><div className="profile-stat"><b>{selectedScore.count?selectedScore.recommend+"%":"—"}</b><span>Lo volverían a elegir</span></div><div className="profile-stat"><b>{selectedScore.count?fmt(selectedScore.difficulty):"—"}/5</b><span>Dificultad promedio</span></div></div><button className="btn btn-dark" onClick={startReview}><Star size={17}/>Calificar a este profesor</button><div className="section-subtitle">Experiencias de estudiantes</div>{selectedRatings.length?selectedRatings.map(r=><article className="review-card" key={r.review_id}><div className="review-top"><div><Score value={r.score} compact/><b>{r.course}</b></div><span>{r.period} · {new Date(r.created_at).toLocaleDateString("es-CO")}</span></div><p>{r.comment}</p><div className="tag-list">{r.tags?.map(t=><span key={t}>{t}</span>)}</div><div className="review-footer"><span><ThumbsUp size={14}/>{r.would_take_again?"Volvería a tomar su clase":"No volvería a tomarla"} · Dificultad {r.difficulty}/5</span><button onClick={()=>{setReport({...report,review_id:r.review_id});needsAuth("report")}}><Flag size={14}/> Reportar</button></div></article>):<div className="profile-empty"><MessageCircle size={25}/><h3>Aún no hay opiniones</h3><p>Comparte tu experiencia y ayuda a que esta comunidad crezca.</p></div>}</Modal>}
 {modal==="review"&&selected&&<Modal title="Califica a tu profe" subtitle={"Tu opinión sobre "+selected.name+" se publicará sin tu nombre."} onClose={close} wide><div className="anon-privacy"><ShieldCheck size={21}/><div><b>Tu reseña será anónima para toda la comunidad</b><span>No mostraremos tu nombre, correo, universidad, carrera ni identificador de cuenta. El equipo de moderación puede acceder a datos internos para prevenir abusos.</span></div></div><form className="form" onSubmit={submitReview}><div className="form-two"><Field label="Materia que cursaste"><input required maxLength={100} value={review.course} onChange={e=>setReview({...review,course:e.target.value})} placeholder="Ej. Cálculo diferencial"/></Field><Field label="Periodo académico"><select value={review.period} onChange={e=>setReview({...review,period:e.target.value})}><option value="2026-2">2026-2</option><option value="2026-1">2026-1</option><option value="2025-2">2025-2</option><option value="2025-1">2025-1</option><option value="Otro periodo">Otro periodo</option></select></Field></div><div className="rating-block"><b>¿Cómo calificas su enseñanza?</b><Stars value={review.score} onChange={v=>setReview({...review,score:v})} large/><small>1 = Muy mala · 5 = Excelente</small></div><div className="rating-block"><b>¿Qué tan difícil es su materia?</b><Stars value={review.difficulty} onChange={v=>setReview({...review,difficulty:v})}/><small>1 = Muy fácil · 5 = Muy difícil</small></div><div className="rating-block"><b>¿Volverías a matricular una materia con este profesor?</b><div className="choice-row"><button type="button" className={review.would_take_again===true?"chosen":""} onClick={()=>setReview({...review,would_take_again:true})}><ThumbsUp size={17}/> Sí</button><button type="button" className={review.would_take_again===false?"chosen":""} onClick={()=>setReview({...review,would_take_again:false})}>No</button></div></div><Field label="Etiquetas que lo describen"><div className="tag-choices">{TAGS.map(t=><button type="button" className={review.tags.includes(t)?"active":""} key={t} onClick={()=>setReview({...review,tags:review.tags.includes(t)?review.tags.filter(a=>a!==t):review.tags.length<4?[...review.tags,t]:review.tags})}>{t}</button>)}</div><small>Selecciona hasta 4 etiquetas.</small></Field><Field label="Cuéntanos tu experiencia"><textarea required minLength={40} maxLength={800} rows={5} value={review.comment} onChange={e=>setReview({...review,comment:e.target.value})} placeholder="¿Cómo explica? ¿Cómo evalúa? ¿Qué consejos darías a otros estudiantes?"/><small>{review.comment.length}/800 caracteres. Describe hechos y experiencias, no rumores.</small></Field><label className="consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Confirmo que es mi experiencia y acepto las <button type="button" onClick={()=>setModal("rules")}>reglas de la comunidad</button>. No publicaré insultos, acusaciones delictivas, datos personales ni información falsa.</span></label><button className="btn btn-dark submit" disabled={busy} type="submit">{busy?<Loader2 className="spin" size={18}/>:<Send size={18}/>}Enviar opinión anónima</button></form></Modal>}
 {modal==="report"&&<Modal title="Reportar una opinión" subtitle="Ayúdanos a mantener conversaciones respetuosas." onClose={close}><form className="form" onSubmit={submitReport}><Field label="Motivo"><select value={report.reason} onChange={e=>setReport({...report,reason:e.target.value})}>{["Información falsa","Datos personales","Insultos o acoso","Discriminación","Suplantación","Spam u otro"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Cuéntanos qué ocurrió"><textarea rows={4} maxLength={600} value={report.detail} onChange={e=>setReport({...report,detail:e.target.value})} placeholder="Información útil para la revisión"/></Field><button type="submit" className="btn btn-dark submit" disabled={busy}>Enviar reporte</button></form></Modal>}
 {modal==="admin"&&admin&&<Modal title="Panel de moderación" subtitle="Gestiona docentes, reseñas y estadísticas de usuarios registrados." onClose={close} wide>
 <div className="admin-tabs">{[["students","Estudiantes"],["professors","Profesores"],["reviews","Reseñas"],["reports","Reportes"]].map(([id,n])=><button key={id} className={adminTab===id?"active":""} onClick={()=>setAdminTab(id)}>{n}</button>)}</div>
 {adminTab==="students"?<div className="student-stats">
 <div className="stat-intro"><div><h3>Estudiantes registrados por universidad</h3><p>Estos recuentos corresponden a universidades declaradas en los perfiles. No verifican matrícula ni revelan la autoría de reseñas.</p></div><div className="stat-big"><b>{(adminData.students||[]).reduce((total,u)=>total+Number(u.student_count),0)}</b><small>Cuentas con universidad</small></div></div>
 {(adminData.students||[]).length?<div className="student-stats-list">{adminData.students.map((item,index)=><div className="student-stat-row" key={item.university_code}><span className="stat-number">{index+1}</span><div className="stat-university"><b>{item.university_name}</b><small>{item.city}</small><div className="stat-track"><i style={{width:Math.max(3,100*Number(item.student_count)/Math.max(1,Number(adminData.students[0].student_count)))+"%"}}/></div></div><strong>{item.student_count}</strong></div>)}</div>:<div className="profile-empty">Aún no hay estudiantes que hayan declarado su universidad.</div>}
 <div className="soft-note"><LockKeyhole size={18}/>Por privacidad, este panel no vincula opiniones públicas con cuentas o universidades individuales.</div></div>
 :<>{(adminData[adminTab]||[]).filter(x=>x.status!=="rejected").map(item=><div className="admin-item" key={item.id}><div><b>{item.name||item.reason||item.course}</b><small>{item.university_name||item.comment||item.detail}</small><span>{item.status||"pendiente"}</span></div><div>{item.status!=="approved"&&<button disabled={busy} onClick={()=>moderate(adminTab==="professors"?"professor_requests":adminTab==="reviews"?"review_entries":"reports",item.id,adminTab==="reports"?"resolved":"approved")}>Aprobar</button>}<button disabled={busy} onClick={()=>moderate(adminTab==="professors"?"professor_requests":adminTab==="reviews"?"review_entries":"reports",item.id,"rejected")}>Rechazar</button></div></div>)}{!adminData[adminTab]?.length&&<div className="profile-empty">No hay elementos en esta sección.</div>}</>}
 </Modal>}
 {modal==="about"&&<Modal title="¿Cómo funciona?" subtitle="La comunidad que te hubiera gustado tener antes de matricular." onClose={close}><div className="info-steps"><p><b>1. Busca</b> una universidad o un profesor en nuestro directorio colombiano.</p><p><b>2. Lee</b> las opiniones de quienes ya cursaron sus materias.</p><p><b>3. Contribuye</b> con una cuenta gratuita y comparte tu experiencia sin mostrar tu nombre públicamente.</p><p><b>4. Revisamos</b> las publicaciones antes de hacerlas visibles y atendemos reportes de la comunidad.</p></div><Notice>La plataforma es independiente. Las opiniones representan experiencias individuales, no hechos certificados ni aval institucional.</Notice></Modal>}
 {modal==="rules"&&<Modal title="Reglas de la comunidad" onClose={close}><div className="info-steps"><p>Publica únicamente experiencias académicas propias y verificables. Enfócate en claridad, evaluaciones, metodología, puntualidad y acompañamiento.</p><p>Evita insultos, amenazas, discriminación, acusaciones de delitos o conductas privadas, rumores, datos de contacto y nombres de estudiantes. Las denuncias graves deben dirigirse a las autoridades competentes.</p><p>La moderación podrá rechazar, ocultar o retirar contenido; profesores y terceros pueden pedir revisión mediante el canal de soporte que se habilitará antes del lanzamiento definitivo.</p></div></Modal>}
 {modal==="privacy"&&<Modal title="Tu privacidad" onClose={close}><div className="info-steps"><p>Para publicar se requiere una cuenta de Google o correo. Tu nombre, correo, universidad, programa, semestre e identificador de cuenta no aparecen en la ficha pública ni junto a los comentarios.</p><p>Tu institución se guarda de forma privada. Para participar se exige confirmar un correo institucional que corresponda a ella. Este control demuestra que tienes acceso a ese correo, pero no confirma matrícula vigente, pues también existen cuentas de egresados y personal universitario. No publicamos el dominio ni el correo junto con tus opiniones.</p><p>Los moderadores autorizados pueden revisar los datos necesarios para prevenir abusos, atender solicitudes y aplicar las reglas. El anonimato es público, no una promesa de imposibilidad técnica de identificación.</p><p>Antes del lanzamiento general se debe completar la política de tratamiento de datos, el responsable y un canal de derechos de los titulares, de acuerdo con la legislación colombiana.</p></div></Modal>}
 </div>
}