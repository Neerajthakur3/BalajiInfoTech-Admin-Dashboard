import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, UserRound, Power, X,
  WalletCards, Eye, Upload, ShieldCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "balaji_admin_token";

const ROLES = [
  ["manager","Manager"],["developer","Developer"],["designer","Designer"],
  ["seo","SEO"],["social_media","Social Media"],["support","Support"],["staff","Staff"]
];

const PERMISSIONS = [
  ["dashboard.view","Dashboard"],
  ["projects.view","View Projects"],["projects.manage","Manage Projects"],
  ["clients.view","View Clients"],["clients.manage","Manage Clients"],
  ["enquiries.view","View Enquiries"],["enquiries.manage","Manage Enquiries"],
  ["services.view","View Services"],["services.manage","Manage Services"],
  ["packages.view","View Packages"],["packages.manage","Manage Packages"],
  ["invoices.view","View Invoices"],["invoices.manage","Manage Invoices"],
  ["payments.view","View Payments"],["payments.manage","Manage Payments"],
  ["tasks.view","View Tasks"],["tasks.manage","Manage Tasks"],
  ["messages.view","View Messages"],["messages.manage","Manage Messages"],
  ["reports.view","View Reports"],["seo.view","View SEO"],["seo.manage","Manage SEO"],
  ["social.view","View Social Media"],["social.manage","Manage Social Media"],
  ["team.view","View Team"],["team.manage","Manage Team"],
  ["calendar.view","View Calendar"],["calendar.manage","Manage Calendar"]
];

const emptyProfile = {
  fullName:"", phone:"", designation:"", department:"", dateOfBirth:"",
  joiningDate:"", address:"", city:"", state:"", pincode:"",
  emergencyContactName:"", emergencyContactPhone:"", avatarUrl:"",
  bank:{accountHolder:"",bankName:"",accountNumber:"",ifsc:"",upiId:""}
};

const emptyForm = {
  name:"", email:"", password:"", role:"staff", permissions:[],
  profile:{...emptyProfile}
};

async function api(path, options={}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers:{
      "Content-Type":"application/json",
      ...(token ? {Authorization:`Bearer ${token}`} : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function idOf(member){ return member?._id || member?.id; }
function roleLabel(role){ return ROLES.find(x=>x[0]===role)?.[1] || role || "Staff"; }
function mergeProfile(profile={}) {
  return {...emptyProfile,...profile,bank:{...emptyProfile.bank,...(profile.bank||{})}};
}

export default function Team() {
  const [members,setMembers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [role,setRole] = useState("all");
  const [modal,setModal] = useState(null);
  const [details,setDetails] = useState(null);
  const [earnings,setEarnings] = useState({data:[],totals:{total:0,earned:0,pending:0,paid:0}});
  const [earningForm,setEarningForm] = useState({project:"",projectTitle:"",amount:"",status:"earned",notes:""});
  const [earningSaving,setEarningSaving] = useState(false);

  async function load(){
    setLoading(true);
    try{
      const result = await api("/team");
      setMembers(Array.isArray(result) ? result : result.data || []);
    }catch(e){ alert(e.message); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase();
    return members.filter(m=>{
      const text=[m.name,m.email,m.role,m.profile?.designation,m.profile?.department].join(" ").toLowerCase();
      return (!q || text.includes(q)) && (role==="all" || m.role===role);
    });
  },[members,search,role]);

  function openCreate(){
    setModal({mode:"create",data:JSON.parse(JSON.stringify(emptyForm))});
  }
  function openEdit(member){
    setModal({
      mode:"edit",
      data:{
        ...emptyForm,
        name:member.name||"", email:member.email||"",
        password:"", role:member.role||"staff",
        permissions:Array.isArray(member.permissions)?member.permissions:[],
        profile:mergeProfile(member.profile),
        _id:idOf(member)
      }
    });
  }
  function update(field,value){
    setModal(m=>({...m,data:{...m.data,[field]:value}}));
  }
  function updateProfile(field,value){
    setModal(m=>({...m,data:{...m.data,profile:{...m.data.profile,[field]:value}}}));
  }
  function updateBank(field,value){
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        profile: {
          ...m.data.profile,
          bank: {
            ...m.data.profile.bank,
            [field]: value
          }
        }
      }
    }));
  }
  function togglePermission(value){
    setModal(m=>{
      const current=m.data.permissions||[];
      return {...m,data:{...m.data,permissions:current.includes(value)?current.filter(x=>x!==value):[...current,value]}};
    });
  }
  function handleImage(event){
    const file=event.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/"))return alert("Select a valid image.");
    if(file.size>2*1024*1024)return alert("Image must be under 2 MB.");
    const reader=new FileReader();
    reader.onload=()=>updateProfile("avatarUrl",String(reader.result||""));
    reader.readAsDataURL(file);
  }

  async function saveMember(event){
    event.preventDefault();
    const d=modal.data;
    if(!d.name.trim()||!d.email.trim())return alert("Name and email are required.");
    if(modal.mode==="create" && d.password.length<8)return alert("Password must be at least 8 characters.");
    try{
      const result=await api(modal.mode==="edit"?`/team/${d._id}`:"/team",{
        method:modal.mode==="edit"?"PUT":"POST",
        body:JSON.stringify({
          name:d.name.trim(),email:d.email.trim().toLowerCase(),
          password:d.password||undefined,role:d.role,permissions:d.permissions,
          profile:d.profile
        })
      });
      const saved=result.data;
      if(modal.mode==="edit")setMembers(cur=>cur.map(m=>idOf(m)===idOf(saved)?{...m,...saved}:m));
      else setMembers(cur=>[saved,...cur]);
      setModal(null);
    }catch(e){alert(e.message);}
  }

  async function toggleStatus(member){
    try{
      const result=await api(`/team/${idOf(member)}/status`,{method:"PATCH"});
      setMembers(cur=>cur.map(m=>idOf(m)===idOf(member)?{...m,...result.data}:m));
    }catch(e){alert(e.message);}
  }

  async function remove(member){
    if(!confirm(`Delete ${member.name}?`))return;
    try{await api(`/team/${idOf(member)}`,{method:"DELETE"});setMembers(cur=>cur.filter(m=>idOf(m)!==idOf(member)));setDetails(null);}
    catch(e){alert(e.message);}
  }

  async function openDetails(member){
    setDetails(member);
    try{
      const result=await api(`/team/${idOf(member)}/earnings`);
      setEarnings({data:result.data||[],totals:result.totals||{}});
    }catch(e){alert(e.message);}
  }

  async function addEarning(event){
    event.preventDefault();
    if(!details)return;
    setEarningSaving(true);
    try{
      await api(`/team/${idOf(details)}/earnings`,{
        method:"POST",
        body:JSON.stringify(earningForm)
      });
      setEarningForm({project:"",projectTitle:"",amount:"",status:"earned",notes:""});
      await openDetails(details);
    }catch(e){alert(e.message);}
    finally{setEarningSaving(false);}
  }

  return (
    <section className="content team-admin-page">
      <style>{`
        .team-admin-page{display:grid;gap:16px}
        .team-head{display:flex;justify-content:space-between;align-items:end;gap:14px}
        .team-head small{color:#ff5a00;font-weight:900;letter-spacing:.16em}.team-head h1{margin:5px 0 0}
        .team-toolbar{display:flex;gap:10px}.team-toolbar input,.team-toolbar select{background:#0d0f12;color:#fff;border:1px solid #30353d;border-radius:10px;padding:11px 12px}
        .team-add{border:0;background:#ff5a00;color:#fff;border-radius:10px;padding:11px 15px;font-weight:900;cursor:pointer}
        .team-list{display:grid;gap:10px}.team-row{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;background:#15181d;border:1px solid #2b3139;border-radius:16px;padding:14px}
        .team-main{display:flex;align-items:center;gap:12px;min-width:0}.team-avatar{width:52px;height:52px;border-radius:14px;background:#242a31;overflow:hidden;display:grid;place-items:center;color:#ff5a00;font-weight:900;font-size:20px}.team-avatar img{width:100%;height:100%;object-fit:cover}
        .team-info strong{display:block}.team-info span{display:block;color:#8f98a5;font-size:12px;margin-top:3px}.team-actions{display:flex;gap:7px;align-items:center}.team-actions button{width:38px;height:38px;border-radius:10px;border:1px solid #30353d;background:#111418;color:#cbd2da;display:grid;place-items:center;cursor:pointer}.team-actions button:hover{border-color:#ff5a00;color:#ff5a00}
        .team-status{font-size:10px;font-weight:900;padding:7px 9px;border-radius:999px}.active-status{color:#55e58d;background:rgba(34,197,94,.1)}.inactive-status{color:#ff8b67;background:rgba(255,90,0,.1)}
        .team-perms{color:#8f98a5;font-size:11px;margin-left:auto}
        .tm-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:18px;z-index:9999}.tm-modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:#15181d;border:1px solid #30353d;border-radius:18px;padding:20px}.tm-head{display:flex;justify-content:space-between;align-items:center}.tm-head button{background:transparent;border:0;color:#fff;cursor:pointer}.tm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tm-grid .full{grid-column:1/-1}.tm-field{display:grid;gap:6px}.tm-field label{font-size:10px;font-weight:900;color:#8f98a5;letter-spacing:.08em}.tm-field input,.tm-field textarea,.tm-field select{width:100%;box-sizing:border-box;background:#0d0f12;color:#fff;border:1px solid #30353d;border-radius:10px;padding:10px}.tm-field textarea{min-height:70px}.tm-section{margin-top:18px;padding-top:16px;border-top:1px solid #2b3139}.tm-section h3{font-size:13px;margin:0 0 12px}.tm-perms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tm-perm{font-size:11px;padding:9px;background:#0d0f12;border:1px solid #292f37;border-radius:9px}.tm-perm input{margin-right:7px}.tm-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}.tm-primary{background:#ff5a00;border:0;color:#fff;padding:11px 16px;border-radius:10px;font-weight:900}.tm-secondary{background:#111418;border:1px solid #30353d;color:#fff;padding:11px 16px;border-radius:10px}
        .detail-profile{display:flex;gap:16px;align-items:center;padding:14px;background:#0d0f12;border-radius:14px}.detail-avatar{width:84px;height:84px;border-radius:50%;overflow:hidden;background:#242a31;display:grid;place-items:center;color:#ff5a00;font-size:28px;font-weight:900}.detail-avatar img{width:100%;height:100%;object-fit:cover}.detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.detail-box{padding:12px;background:#0d0f12;border:1px solid #252b33;border-radius:11px}.detail-box span{display:block;color:#8f98a5;font-size:10px}.detail-box strong{display:block;margin-top:5px;font-size:13px}.earning-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.earning-stat{padding:12px;background:#0d0f12;border-radius:10px}.earning-stat span{display:block;color:#8f98a5;font-size:10px}.earning-stat strong{display:block;margin-top:5px}.earning-table{width:100%;border-collapse:collapse;font-size:11px}.earning-table th,.earning-table td{text-align:left;padding:9px;border-bottom:1px solid #292f37}
        @media(max-width:800px){.team-toolbar{flex-direction:column}.tm-grid,.detail-grid{grid-template-columns:1fr}.tm-perms{grid-template-columns:1fr 1fr}.earning-stats{grid-template-columns:1fr 1fr}.team-row{grid-template-columns:1fr}.team-actions{justify-content:flex-end}}
      `}</style>

      <div className="team-head"><div><small>ACCESS CONTROL</small><h1>Team Members</h1></div><button className="team-add" onClick={openCreate}><Plus size={15}/> ADD TEAM MEMBER</button></div>
      <div className="team-toolbar"><input placeholder="Search team..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={role} onChange={e=>setRole(e.target.value)}><option value="all">All Roles</option>{ROLES.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}</select></div>

      <div className="team-list">
        {!loading && !filtered.length && <div className="dashboard-card">No team members found.</div>}
        {filtered.map(member=>{
          const avatar=member.profile?.avatarUrl;
          return <article className="team-row" key={idOf(member)}>
            <div className="team-main">
              <div className="team-avatar">{avatar?<img src={avatar} alt={member.name}/>:member.name?.charAt(0).toUpperCase()}</div>
              <div className="team-info"><strong>{member.name}</strong><span>{member.email} · {roleLabel(member.role)} · {member.profile?.designation||"Team Member"}</span></div>
              <span className="team-perms">{(member.permissions||[]).length} permissions</span>
              <span className={`team-status ${member.isActive?"active-status":"inactive-status"}`}>{member.isActive?"ACTIVE":"INACTIVE"}</span>
            </div>
            <div className="team-actions">
              <button title="View details" onClick={()=>openDetails(member)}><Eye size={16}/></button>
              <button title="Edit" onClick={()=>openEdit(member)}><Pencil size={16}/></button>
              <button title={member.isActive?"Deactivate":"Activate"} onClick={()=>toggleStatus(member)}><Power size={16}/></button>
              <button title="Delete" onClick={()=>remove(member)}><Trash2 size={16}/></button>
            </div>
          </article>
        })}
      </div>

      {modal && <div className="tm-backdrop" onMouseDown={()=>setModal(null)}><div className="tm-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="tm-head"><h2>{modal.mode==="edit"?"EDIT TEAM MEMBER":"ADD TEAM MEMBER"}</h2><button onClick={()=>setModal(null)}><X/></button></div>
        <form onSubmit={saveMember}>
          <div className="tm-grid">
            <div className="tm-field"><label>LOGIN NAME</label><input value={modal.data.name} onChange={e=>update("name",e.target.value)} required/></div>
            <div className="tm-field"><label>EMAIL</label><input type="email" value={modal.data.email} onChange={e=>update("email",e.target.value)} required/></div>
            <div className="tm-field"><label>{modal.mode==="edit"?"NEW PASSWORD (OPTIONAL)":"PASSWORD"}</label><input type="password" value={modal.data.password} onChange={e=>update("password",e.target.value)} required={modal.mode==="create"}/></div>
            <div className="tm-field"><label>ROLE</label><select value={modal.data.role} onChange={e=>update("role",e.target.value)}>{ROLES.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}</select></div>
          </div>

          <div className="tm-section"><h3>PROFILE / ONBOARDING DETAILS</h3>
            <div className="detail-profile">
              <div className="detail-avatar">{modal.data.profile.avatarUrl?<img src={modal.data.profile.avatarUrl} alt="Profile"/>:(modal.data.profile.fullName||modal.data.name||"A").charAt(0).toUpperCase()}</div>
              <label className="tm-primary" style={{display:"inline-flex",gap:7,alignItems:"center",cursor:"pointer"}}><Upload size={14}/> UPLOAD PHOTO<input type="file" accept="image/*" onChange={handleImage} style={{display:"none"}}/></label>
            </div>
            <div className="tm-grid" style={{marginTop:12}}>
              {[
                ["fullName","FULL NAME"],["phone","PHONE"],["designation","DESIGNATION"],["department","DEPARTMENT"],
                ["dateOfBirth","DATE OF BIRTH"],["joiningDate","JOINING DATE"],["city","CITY"],["state","STATE"],["pincode","PINCODE"],
                ["emergencyContactName","EMERGENCY CONTACT"],["emergencyContactPhone","EMERGENCY PHONE"]
              ].map(([key,label])=><div className="tm-field" key={key}><label>{label}</label><input type={key.toLowerCase().includes("date")?"date":"text"} value={modal.data.profile[key]||""} onChange={e=>updateProfile(key,e.target.value)}/></div>)}
              <div className="tm-field full"><label>ADDRESS</label><textarea value={modal.data.profile.address||""} onChange={e=>updateProfile("address",e.target.value)}/></div>
            </div>
          </div>

          <div className="tm-section"><h3>PAYMENT DETAILS</h3><div className="tm-grid">
            {[
              ["accountHolder","ACCOUNT HOLDER"],["bankName","BANK NAME"],["accountNumber","ACCOUNT NUMBER"],["ifsc","IFSC"],["upiId","UPI ID"]
            ].map(([key,label])=><div className="tm-field" key={key}><label>{label}</label><input value={modal.data.profile.bank[key]||""} onChange={e=>updateBank(key,e.target.value)}/></div>)}
          </div></div>

          <div className="tm-section"><h3>MODULE PERMISSIONS</h3><div className="tm-perms">{PERMISSIONS.map(([value,label])=><label className="tm-perm" key={value}><input type="checkbox" checked={(modal.data.permissions||[]).includes(value)} onChange={()=>togglePermission(value)}/>{label}</label>)}</div></div>
          <div className="tm-actions"><button type="button" className="tm-secondary" onClick={()=>setModal(null)}>CANCEL</button><button className="tm-primary" type="submit">SAVE MEMBER</button></div>
        </form>
      </div></div>}

      {details && <div className="tm-backdrop" onMouseDown={()=>setDetails(null)}><div className="tm-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="tm-head"><h2>TEAM MEMBER DETAILS</h2><button onClick={()=>setDetails(null)}><X/></button></div>
        <div className="detail-profile">
          <div className="detail-avatar">{details.profile?.avatarUrl?<img src={details.profile.avatarUrl} alt={details.name}/>:details.name?.charAt(0).toUpperCase()}</div>
          <div><h2 style={{margin:"0 0 5px"}}>{details.name}</h2><div style={{color:"#8f98a5",fontSize:12}}>{details.email} · {roleLabel(details.role)}</div></div>
        </div>
        <div className="detail-grid">
          {[
            ["Phone",details.profile?.phone],["Designation",details.profile?.designation],["Department",details.profile?.department],
            ["DOB",details.profile?.dateOfBirth],["Joining",details.profile?.joiningDate],["City",details.profile?.city],
            ["State",details.profile?.state],["Pincode",details.profile?.pincode],["Emergency",details.profile?.emergencyContactName],
            ["Bank",details.profile?.bank?.bankName],["IFSC",details.profile?.bank?.ifsc],["UPI",details.profile?.bank?.upiId]
          ].map(([k,v])=><div className="detail-box" key={k}><span>{k}</span><strong>{v||"—"}</strong></div>)}
          <div className="detail-box" style={{gridColumn:"1/-1"}}><span>Address</span><strong>{details.profile?.address||"—"}</strong></div>
        </div>

        <div className="tm-section"><h3>EARNINGS / PROJECT ACCOUNTING</h3>
          <div className="earning-stats">
            {[
              ["TOTAL",earnings.totals?.total],["EARNED",earnings.totals?.earned],["PENDING",earnings.totals?.pending],["PAID",earnings.totals?.paid]
            ].map(([k,v])=><div className="earning-stat" key={k}><span>{k}</span><strong>₹{Number(v||0).toLocaleString("en-IN")}</strong></div>)}
          </div>
          <table className="earning-table" style={{marginTop:12}}><thead><tr><th>PROJECT</th><th>AMOUNT</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>{earnings.data.map(x=><tr key={x._id}><td>{x.project?.title||x.projectTitle||"Project"}</td><td>₹{Number(x.amount||0).toLocaleString("en-IN")}</td><td>{x.status}</td><td>{x.earnedAt?new Date(x.earnedAt).toLocaleDateString("en-IN"):"-"}</td></tr>)}{!earnings.data.length&&<tr><td colSpan="4">No earnings recorded.</td></tr>}</tbody></table>

          <form onSubmit={addEarning} className="tm-grid" style={{marginTop:14}}>
            <div className="tm-field"><label>PROJECT TITLE</label><input value={earningForm.projectTitle} onChange={e=>setEarningForm(f=>({...f,projectTitle:e.target.value}))}/></div>
            <div className="tm-field"><label>EARNING AMOUNT</label><input type="number" min="0" value={earningForm.amount} onChange={e=>setEarningForm(f=>({...f,amount:e.target.value}))} required/></div>
            <div className="tm-field"><label>STATUS</label><select value={earningForm.status} onChange={e=>setEarningForm(f=>({...f,status:e.target.value}))}><option value="earned">Earned</option><option value="pending">Pending</option><option value="paid">Paid</option></select></div>
            <div className="tm-field"><label>NOTES</label><input value={earningForm.notes} onChange={e=>setEarningForm(f=>({...f,notes:e.target.value}))}/></div>
            <div className="tm-actions full"><button className="tm-primary" disabled={earningSaving}>{earningSaving?"SAVING...":"ADD PROJECT EARNING"}</button></div>
          </form>
        </div>
      </div></div>}
    </section>
  );
}
