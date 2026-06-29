import React,{useState} from 'react';
import {useApp} from '../App';
import './AccountsPage.css';
const ipc=window.electron;
export default function AccountsPage(){
  const {accounts,activeAccount,setActiveAccount,refreshAccounts}=useApp();
  const [offline,setOffline]=useState('');
  const [msCode,setMsCode]=useState('');
  const [msStep,setMsStep]=useState('idle');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const addOffline=async()=>{
    if(!offline.trim()||offline.length<3)return;
    setLoading(true);setError('');
    const r=await ipc.auth.offline(offline.trim());
    if(r.success){setOffline('');await refreshAccounts();}
    else setError(r.error);
    setLoading(false);
  };
  const startMs=async()=>{setMsStep('waiting');setError('');await ipc.auth.getMicrosoftURL();setMsStep('code');};
  const submitMs=async()=>{
    if(!msCode.trim())return;
    setLoading(true);setError('');
    const r=await ipc.auth.microsoftCallback(msCode.trim());
    if(r.success){setMsCode('');setMsStep('idle');await refreshAccounts();}
    else setError('Erreur auth: '+r.error);
    setLoading(false);
  };
  const remove=async(acc)=>{await ipc.auth.remove(acc.id);await refreshAccounts();};
  const select=async(acc)=>{await setActiveAccount(acc);await ipc.store.set('activeAccount',acc.id);};
  return(
    <div className="accounts-page">
      <div className="page-header"><h1>Comptes</h1><p>Gérez vos identités Minecraft</p></div>
      <div className="section">
        <div className="section-title">Comptes ({accounts.length})</div>
        {accounts.length===0?(
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>Aucun compte</h3>
            <p>Ajoutez un compte Microsoft ou hors-ligne</p>
          </div>
        ):(
          <div className="acc-list">
            {accounts.map(acc=>(
              <div key={acc.id} className={`acc-card${activeAccount?.id===acc.id?' active':''}`} onClick={()=>select(acc)}>
                <div className="acc-avatar">
                  {acc.type!=='offline'&&acc.uuid
                    ?<img src={`https://crafatar.com/avatars/${acc.uuid}?size=44&overlay`} alt={acc.username} onError={e=>e.target.style.display='none'}/>
                    :<span>⚡</span>}
                </div>
                <div className="acc-info">
                  <div className="acc-name">{acc.username}</div>
                  <span className={`badge badge-${acc.type==='msa'?'msa':'offline'}`}>{acc.type==='msa'?'Microsoft':'Hors-ligne'}</span>
                </div>
                <div className="acc-actions">
                  {activeAccount?.id===acc.id&&<span className="acc-check">✓</span>}
                  <button className="btn-icon" onClick={e=>{e.stopPropagation();remove(acc);}} title="Supprimer">
                    <svg width="15"height="15"fill="none"stroke="currentColor"strokeWidth="2"viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error&&<div className="error-box">{error}</div>}
      <div className="add-row">
        <div className="add-card">
          <div className="add-card-head"><span className="add-card-icon">🪟</span><div><h3>Compte Microsoft</h3><p>Officiel · multijoueur</p></div></div>
          {msStep==='idle'&&<button className="btn btn-primary" onClick={startMs} disabled={loading}>Connexion Microsoft</button>}
          {msStep==='waiting'&&<div className="ms-waiting"><span className="spin">⟳</span>Ouverture du navigateur…</div>}
          {msStep==='code'&&(
            <div className="ms-code-form">
              <p className="ms-note">Connectez-vous, puis collez le code d'autorisation depuis l'URL de redirection.</p>
              <input className="input" placeholder="Code d'autorisation…" value={msCode} onChange={e=>setMsCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitMs()}/>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary" onClick={submitMs} disabled={loading||!msCode.trim()}>{loading?'Vérification…':'Valider'}</button>
                <button className="btn btn-ghost" onClick={()=>setMsStep('idle')}>Annuler</button>
              </div>
            </div>
          )}
        </div>
        <div className="add-card">
          <div className="add-card-head"><span className="add-card-icon">⚡</span><div><h3>Hors-ligne</h3><p>Sans authentification</p></div></div>
          <input className="input" placeholder="Pseudo (3–16 car.)" value={offline} onChange={e=>setOffline(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addOffline()} maxLength={16}/>
          <button className="btn btn-ghost" onClick={addOffline} disabled={loading||!offline.trim()}>Ajouter</button>
          <p className="form-hint">⚠️ Serveurs en ligne non accessibles.</p>
        </div>
      </div>
    </div>
  );
}
