import { useState } from "react";
import { supabase } from "../lib/supabase.js";
export default function AuthPage({ mode, onAuthenticated }) {
 const register=mode==="register"; const [role,setRole]=useState("student"); const [show,setShow]=useState(false);
 const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [error,setError]=useState("");
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [regNo,setRegNo]=useState(""); const [department,setDepartment]=useState("");
 const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState("");
 async function submit(e){e.preventDefault();setError("");setNotice("");
  if(!supabase){setError("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in Complaint Portal/.env.");return;}
  if(register&&password!==confirm){setError("Passwords do not match.");return;} setBusy(true);
  try{
   if(register){const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim(),phone:phone.trim(),crn_number:regNo.trim(),department}}});
    if(error)throw error; if(data.session)onAuthenticated?.(data.session);else setNotice("Account created. Check your email to confirm it, then sign in.");
   }else{const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
    const {data:profile,error:pe}=await supabase.from("profiles").select("role,full_name").eq("id",data.user.id).single();
    if(pe)throw pe;if(profile.role!==role){await supabase.auth.signOut();throw new Error(role==="admin"?"This account is not an administrator. Ask the project owner to grant the admin role.":"This account has admin role. Select Admin / Staff.");}
    onAuthenticated?.(data.session,profile);
   }
  }catch(err){setError(err?.message||"Authentication failed.");}finally{setBusy(false);}
 }
 return <section className="auth-page"><div className="auth-heading"><span className="eyebrow">COLLEGE COMPLAINT PORTAL</span><h1>{register?"Create your account":"Welcome back"}</h1><p>Your Voice Matters · Report · Track · Resolve</p></div>
 <div className="auth-panel"><aside className="auth-aside"><h2>{register?"Join your campus community.":"Choose your sign-in role."}</h2><p>{register?"Register as a student to raise complaints.":"Your role is verified against the database after sign-in."}</p>
 {[["student","♙","Student","Raise complaints and track progress."],...(!register?[["admin","⚙","Admin / Staff","Review complaints and manage statuses."]]:[])].map(([v,i,t,d])=><button type="button" className={"role-option "+(role===v?"selected":"")} key={v} onClick={()=>setRole(v)}><span>{i}</span><div><strong>{t}</strong><small>{d}</small></div><b>{role===v?"●":"○"}</b></button>)}
 <div className="campus-tag">▥ &nbsp; Together for a <strong>Better Campus</strong></div></aside>
 <form className="auth-form" onSubmit={submit}><div className="auth-tabs"><a className={!register?"selected":""} href="#login">Login</a><a className={register?"selected":""} href="#register">Register</a></div><h3>{register?"Student registration":role==="admin"?"Admin / Staff login":"Student login"}</h3>
 {register&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" placeholder="Enter your full name"/></label>}
 {register&&<label>Contact number<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required autoComplete="tel" inputMode="tel" pattern="[0-9+() -]{7,20}" placeholder="Enter your contact number"/></label>}
 <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@college.edu"/></label>
 {register&&<div className="two-fields"><label>CRN Number<input value={regNo} onChange={e=>setRegNo(e.target.value)} required placeholder="Enter CRN number"/></label><label>Department<select value={department} onChange={e=>setDepartment(e.target.value)} required><option value="" disabled>Select department</option><option>Computer Science</option><option>Management</option><option>Engineering</option><option>Other</option></select></label></div>}
 <label>Password<div className="password-input"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={register?"new-password":"current-password"} placeholder={register?"Create a password (8+ characters)":"Enter password"}/><button type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></div></label>
 {register&&<label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Confirm password"/></label>}
 {register&&<label className="terms"><input type="checkbox" required/> I agree to the portal terms and privacy policy.</label>}
 {!register&&<div className="forgot-row"><label><input type="checkbox"/> Remember me</label><button type="button" className="auth-link-button" onClick={async()=>{setError("");setNotice("");if(!supabase||!email.trim()){setError("Enter your email address first.");return;}const {error}=await supabase.auth.resetPasswordForEmail(email.trim());if(error)setError(error.message);else setNotice("If the email is registered, a reset link will be sent.");}}>Forgot password?</button></div>}
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="info" role="status">{notice}</p>}
 <button className="btn btn-primary auth-submit" disabled={busy}>{busy?"Please wait…":register?"Create account →":"Sign in →"}</button><p className="auth-switch">{register?"Already have an account?":"Don’t have an account?"} <a href={register?"#login":"#register"}>{register?"Login here":"Register here"}</a></p></form></div></section>;
}