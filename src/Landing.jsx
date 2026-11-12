import React,{useState} from "react";
import {Search,GraduationCap,School,ShieldCheck,ArrowRight,Star,Quote,BookOpen,Heart,CheckCircle2,MessageSquareText,Sparkles,MapPin,LockKeyhole,UserRoundPlus,ChevronRight,ArrowUpRight,Check,MousePointerClick} from "lucide-react";
import universities from "./universities.json";
import "./landing.css";

const cities=["Valledupar","Bogotá","Medellín","Barranquilla","Cali"];
const featured=[
 ...universities.filter(u=>u.name.toLowerCase().includes("universidad popular del cesar")&&u.city==="Valledupar").slice(0,1),
 ...universities.filter(u=>u.code==="areandina-valledupar"),
 ...universities.filter(u=>u.name.toLowerCase().includes("universidad nacional de colombia")&&u.city.toLowerCase().includes("bogot")).slice(0,1),
 ...universities.filter(u=>u.name.toLowerCase().includes("universidad de antioquia")&&u.city==="Medellín").slice(0,1),
 ...universities.filter(u=>u.name.toLowerCase().includes("universidad del norte")).slice(0,1),
 ...universities.filter(u=>u.name.toLowerCase().includes("universidad popular del cesar")&&u.city==="Aguachica").slice(0,1)
].filter((u,i,a)=>a.findIndex(v=>v.code===u.code)===i).slice(0,6);

function AnonymousVisual(){
 return <div className="lp-art" aria-hidden="true">
 <div className="lp-art-orbit orbit-a"/><div className="lp-art-orbit orbit-b"/>
 <div className="lp-art-spark spark-a">✳</div><div className="lp-art-spark spark-b">✦</div>
 <div className="lp-art-card card-main">
 <div className="lp-art-card-header"><div className="lp-art-prof-icon"><GraduationCap size={27}/></div><span className="lp-art-pill">LA VIDA EN LA U</span></div>
 <div className="lp-art-lines"><span/><span/><span/></div>
 <div className="lp-art-divider"/>
 <div className="lp-art-stars"><Star/><Star/><Star/><Star/><Star/></div>
 <div className="lp-art-caption">Conoce experiencias reales de clase</div>
 </div>
 <div className="lp-art-card card-anon"><div className="lp-art-anon-icon"><ShieldCheck size={22}/></div><div><b>Tu voz cuenta.</b><small>Tu nombre no aparece.</small></div><CheckCircle2 size={19} className="lp-art-check"/></div>
 <div className="lp-art-float">COMUNIDAD UNIVERSITARIA <Heart size={13} fill="currentColor"/></div>
 </div>
}
function Flow({number,icon:Icon,title,description,tint}){
 return <div className="lp-flow-card"><div className={"lp-flow-icon "+tint}><Icon size={25} strokeWidth={2}/><small>0{number}</small></div><h3>{title}</h3><p>{description}</p></div>
}
export default function Landing({onExplore,onRegister,onLogin,onSearch,onOpenPrivacy,user,universityCount=361,professorCount=0}){
 const [searchMode,setSearchMode]=useState("universidades"),[query,setQuery]=useState("");
 const submit=e=>{e.preventDefault();onSearch(searchMode,query.trim())};
 const choose=u=>onExplore("universidades",u.name+" "+u.city);
 return <div className="lp">
   <section className="lp-hero" id="inicio">
    <div className="lp-hero-noise"/>
    <div className="lp-wrap lp-hero-grid">
     <div className="lp-hero-text">
      <div className="lp-kicker"><span className="lp-kicker-dot"/> LA COMUNIDAD UNIVERSITARIA DE COLOMBIA <span className="lp-kicker-arrow">↗</span></div>
      <h1>La mejor clase empieza <em>antes de elegir profe.</em></h1>
      <p className="lp-hero-sub">Descubre lo que otros estudiantes opinan de sus profesores, explora universidades de Colombia y comparte tu experiencia sin mostrar tu identidad al público.</p>
      <div className="lp-hero-actions">
       <button className="lp-btn lp-btn-ink" onClick={()=>onExplore("profesores","")}>Explorar la plataforma <ArrowUpRight size={19}/></button>
       <button className="lp-btn lp-btn-outline" onClick={onRegister}>{user?"Mi cuenta":"Crear cuenta gratis"} <ArrowRight size={18}/></button>
      </div>
      <div className="lp-social-proof"><span className="lp-proof-avatars"><i><GraduationCap size={15}/></i><i><BookOpen size={14}/></i><i><Star size={14}/></i></span><span>Hecho para estudiantes, pensado para todos.</span></div>
     </div>
     <AnonymousVisual/>
    </div>
    <div className="lp-wrap">
     <form className="lp-search" onSubmit={submit}>
      <div className="lp-search-title"><div className="lp-search-title-icon"><Search size={21}/></div><div><strong>¿Qué estás buscando?</strong><span>Empieza por tu universidad o busca un profesor directamente.</span></div></div>
      <div className="lp-search-controls">
       <div className="lp-search-switch" role="group" aria-label="Tipo de búsqueda"><button type="button" className={searchMode==="universidades"?"active":""} onClick={()=>setSearchMode("universidades")}><School size={16}/> Universidades</button><button type="button" className={searchMode==="profesores"?"active":""} onClick={()=>setSearchMode("profesores")}><GraduationCap size={16}/> Profesores</button></div>
       <label className="lp-search-input"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchMode==="universidades"?"Ej. Universidad Popular del Cesar":"Ej. Nombre de tu profesor"} aria-label="Buscar universidad o profesor"/></label>
       <button type="submit" className="lp-search-submit">Buscar <ArrowRight size={19}/></button>
      </div>
      <div className="lp-search-bottom"><ShieldCheck size={15}/> Puedes explorar sin registrarte. Necesitarás una cuenta para publicar.</div>
     </form>
    </div>
   </section>

   <div className="lp-proof-strip"><div className="lp-wrap lp-proof-grid">
    <div><b>{universityCount}</b><span>instituciones y sedes en el directorio</span></div>
    <div><b>100%</b><span>reseñas sin identidad pública</span></div>
    <div><b>Gratis</b><span>explorar y compartir experiencias</span></div>
   </div></div>

   <section className="lp-section lp-how" id="como-funciona"><div className="lp-wrap">
    <div className="lp-section-heading"><div><span className="lp-overline">FÁCIL, ÚTIL Y ANÓNIMO</span><h2>Todo lo que necesitas saber <br/><em>antes de matricular.</em></h2></div><p>Una comunidad donde las experiencias académicas ayudan a otros a tomar decisiones más informadas.</p></div>
    <div className="lp-flow-grid">
     <Flow number={1} icon={Search} tint="mint" title="Encuentra tu universidad" description="Busca entre instituciones y sedes colombianas y encuentra el profesor que necesitas."/>
     <Flow number={2} icon={MessageSquareText} tint="yellow" title="Conoce otras experiencias" description="Consulta calificaciones, dificultad de las clases y comentarios de estudiantes."/>
     <Flow number={3} icon={ShieldCheck} tint="violet" title="Deja tu opinión anónima" description="Regístrate, elige tu universidad y publica de forma responsable sin mostrar quién eres."/>
    </div>
   </div></section>

   <section className="lp-section lp-platform" id="la-plataforma"><div className="lp-wrap lp-platform-grid">
    <div className="lp-platform-copy"><span className="lp-overline">TU CAMPUS, EN UN SOLO LUGAR</span><h2>La plataforma que te hubiera gustado tener <em>desde primer semestre.</em></h2><p>Encuentra profesores, compara experiencias y aporta a una comunidad que crece con cada estudiante.</p>
     <div className="lp-feature-list"><div><span><Check size={17}/></span><div><b>Opiniones sobre profesores</b><small>Calidad de enseñanza, dificultad y recomendaciones.</small></div></div><div><span><Check size={17}/></span><div><b>Universidades de toda Colombia</b><small>Explora el catálogo nacional por institución y ciudad.</small></div></div><div><span><Check size={17}/></span><div><b>Tu universidad en tu perfil</b><small>Guarda tu institución para participar. No aparece en las reseñas públicas.</small></div></div></div>
     <button className="lp-text-link" onClick={()=>onExplore("profesores","")}>Entrar a la plataforma <ArrowUpRight size={19}/></button>
    </div>
    <div className="lp-app-preview">
     <div className="lp-window-bar"><span className="lp-dots"><i/><i/><i/></span><span>quetalmiprofe-colombia.vercel.app/plataforma</span><span className="lp-window-icon"><MousePointerClick size={16}/></span></div>
     <div className="lp-window-content">
      <div className="lp-preview-top"><div className="lp-preview-logo"><GraduationCap size={19}/></div><div><strong>qué tal mi profe<span>.</span></strong><small>Tu comunidad estudiantil</small></div><span className="lp-preview-live">PLATAFORMA</span></div>
      <div className="lp-preview-heading">Busca. Descubre. Decide.</div>
      <div className="lp-preview-search"><Search size={18}/> Busca profesores o universidades... <span><ArrowRight size={16}/></span></div>
      <div className="lp-preview-card"><div className="lp-preview-avatar"><GraduationCap size={24}/></div><div className="lp-preview-copy"><div className="lp-preview-placeholder"/><div className="lp-preview-placeholder short"/><small>Experiencias estudiantiles</small></div><div className="lp-preview-rating"><Star size={17}/><span>1–5</span></div></div>
      <div className="lp-preview-card"><div className="lp-preview-avatar second"><BookOpen size={24}/></div><div className="lp-preview-copy"><div className="lp-preview-placeholder long"/><div className="lp-preview-placeholder short"/><small>Calificaciones de clase</small></div><div className="lp-preview-rating"><Star size={17}/><span>1–5</span></div></div>
      <div className="lp-preview-note"><LockKeyhole size={15}/> Vista ilustrativa; no son reseñas de personas reales.</div>
     </div>
    </div>
   </div></section>

   <section className="lp-section lp-universities" id="universidades"><div className="lp-wrap">
    <div className="lp-section-heading"><div><span className="lp-overline">ENCUENTRA TU CAMPUS</span><h2>¿Tu universidad ya <em>está aquí?</em></h2></div><p>El directorio incluye {universityCount} registros de instituciones y sedes colombianas, a partir de datos del Ministerio de Educación y páginas oficiales de universidades.</p></div>
    <div className="lp-uni-grid">{featured.map((u,i)=><button className="lp-uni-card" key={u.code} onClick={()=>choose(u)}><span className={"lp-uni-badge color-"+i}><School size={22}/></span><span className="lp-uni-card-main"><b>{u.name}</b><small><MapPin size={13}/> {u.city}</small></span><ArrowUpRight size={19}/></button>)}</div>
    <div className="lp-all-unis"><button onClick={()=>onExplore("universidades","")}>Ver todas las universidades <ArrowRight size={18}/></button></div>
   </div></section>

   <section className="lp-section lp-privacy" id="anonimato"><div className="lp-wrap lp-privacy-grid"><div className="lp-privacy-icon"><LockKeyhole size={49}/><span><ShieldCheck size={25}/></span></div><div><span className="lp-overline">TU PRIVACIDAD, PRIMERO</span><h2>Tu experiencia es pública. <em>Tu identidad, no.</em></h2><p>Al comentar, no mostramos tu nombre, correo, universidad, carrera ni identificador de usuario. La plataforma conserva información privada de la cuenta para seguridad y moderación; el anonimato es frente a otros estudiantes, no frente al operador.</p><button className="lp-text-link" onClick={onOpenPrivacy}>Así protegemos tus datos <ArrowRight size={17}/></button></div></div></section>

   <section className="lp-section lp-faq" id="preguntas"><div className="lp-wrap"><div className="lp-faq-intro"><span className="lp-overline">RESOLVEMOS TUS DUDAS</span><h2>Preguntas frecuentes<span>.</span></h2><p>Todo claro antes de empezar.</p></div><div className="lp-faq-list">
    <details><summary>¿Es gratis usar Qué Tal Mi Profe? <span>+</span></summary><p>Sí. Explorar universidades, buscar profesores y compartir opiniones es gratuito en esta primera versión.</p></details>
    <details><summary>¿Pueden ver quién escribió mi comentario? <span>+</span></summary><p>Los demás usuarios no pueden ver tu nombre, correo ni universidad junto a tu reseña. El operador conserva datos internos para prevenir abusos o atender obligaciones legales.</p></details>
    <details><summary>¿Tengo que crear una cuenta para buscar? <span>+</span></summary><p>No. Puedes explorar el directorio sin iniciar sesión. Para agregar profesores o enviar reseñas sí necesitarás registrarte y declarar tu universidad.</p></details>
    <details><summary>¿Ya aparecen todos los profesores de Colombia? <span>+</span></summary><p>No. La comunidad irá construyendo el catálogo. Las propuestas de nuevos profesores se revisan antes de publicarse.</p></details>
    <details><summary>¿Qué pasa si un comentario no cumple las reglas? <span>+</span></summary><p>Las reseñas se moderan antes de hacerse visibles. También puedes reportar contenido; el equipo revisará las solicitudes conforme a las reglas de la comunidad.</p></details>
   </div></div></section>

   <section className="lp-cta"><div className="lp-wrap lp-cta-inner"><div><span>UNA COMUNIDAD QUE EMPIEZA CONTIGO</span><h2>La próxima buena decisión <em>empieza aquí.</em></h2><p>Explora, comparte y ayuda a otro estudiante a escoger mejor.</p></div><div className="lp-cta-actions"><button className="lp-btn lp-btn-ink" onClick={onRegister}>{user?"Mi cuenta":"Crear cuenta gratis"} <ArrowUpRight size={19}/></button><button className="lp-btn lp-btn-outline" onClick={()=>onExplore("profesores","")}>Explorar ahora <ArrowRight size={18}/></button></div></div></section>
 </div>;
}
