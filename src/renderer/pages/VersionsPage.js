import React,{useState,useEffect} from 'react';
import './VersionsPage.css';
const ipc = window.electron;
export default function VersionsPage(){
  const [versions,setVersions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('release');
  const [search,setSearch]=useState('');
  const [installed,setInstalled]=useState([]);
  useEffect(()=>{
    ipc.minecraft.getVersions().then(d=>{if(!d.error)setVersions(d.versions);setLoading(false)});
    ipc.fs.getGameDir().then(dir=>ipc.fs.readdir(dir+'/versions').then(d=>setInstalled(d||[])));
  },[]);
  const filtered=versions.filter(v=>{
    const t=filter==='all'||(filter==='release'&&v.type==='release')||(filter==='snapshot'&&v.type==='snapshot')||(filter==='old'&&(v.type==='old_alpha'||v.type==='old_beta'));
    return t&&(!search||v.id.toLowerCase().includes(search.toLowerCase()));
  });
  return(
    <div className="versions-page">
      <div className="page-header">
        <h1>Versions</h1>
        <p>{versions.filter(v=>v.type==='release').length} releases · {versions.filter(v=>v.type==='snapshot').length} snapshots</p>
      </div>
      <div className="toolbar">
        <input className="input" style={{maxWidth:240}} placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="pills">
          {[['release','Release'],['snapshot','Snapshot'],['old','Ancienne'],['all','Toutes']].map(([v,l])=>(
            <button key={v} className={`pill${filter===v?' active':''}`} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      {loading?<div className="empty-state"><div className="spin" style={{fontSize:28}}>⟳</div></div>:(
        <div className="versions-grid">
          {filtered.slice(0,100).map(v=>(
            <div key={v.id} className={`ver-card${installed.includes(v.id)?' installed':''}`}>
              <div className="ver-top">
                <span className="ver-id">{v.id}</span>
                {installed.includes(v.id)&&<span className="ver-dot"/>}
              </div>
              <div className="ver-bottom">
                <span className={`badge badge-${v.type==='release'?'release':v.type==='snapshot'?'snapshot':'old'}`}>{v.type}</span>
                <span className="ver-date">{new Date(v.releaseTime).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
