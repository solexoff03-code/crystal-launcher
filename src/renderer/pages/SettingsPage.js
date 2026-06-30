import React,{useState,useEffect} from 'react';
import {useApp} from '../App';
import './SettingsPage.css';
const ipc=window.electron;
export default function SettingsPage(){
  const {settings,setSettings}=useApp();
  const [javaInfo,setJavaInfo]=useState(null);
  const [saved,setSaved]=useState(false);
  const [ver,setVer]=useState('');
  const s=settings||{};
  useEffect(()=>{ipc.java.detect().then(setJavaInfo);ipc.app.version().then(setVer);},[]);
  let t;
  const flash=()=>{clearTimeout(t);setSaved(true);t=setTimeout(()=>setSaved(false),2000)};
  const upd=(k,v)=>{setSettings({[k]:v});flash()};
  const updN=(p,k,v)=>{setSettings({[p]:{...(s[p]||{}),[k]:v}});flash()};
  const selDir=async()=>{const d=await ipc.fs.selectDir();if(d)upd('gameDir',d)};
  const selJava=async()=>{const d=await ipc.fs.selectDir();if(d)upd('javaPath',d)};
  const ramPct=Math.min(100,((s.ram?.max||2048)/16384)*100);
  return(
    <div className="settings-page">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <div className="page-header" style={{margin:0}}><h1>Paramètres</h1><p>Configuration du lanceur</p></div>
        {saved&&<span className="settings-saved">✓ Sauvegardé</span>}
      </div>
      <div className="s-card">
        <div className="s-card-head">Java</div>
        <div className="s-row">
          <div><div className="s-lbl">Java détecté</div><div className="s-desc" style={{color:javaInfo?.found?'var(--green)':'var(--red)'}}>{javaInfo===null?'Vérification…':javaInfo.found?`✓ Java ${javaInfo.version||''}`:'✗ Java non trouvé'}</div></div>
          <button className="btn btn-ghost" onClick={()=>ipc.app.openExternal('https://adoptium.net/')}>Télécharger</button>
        </div>
        <div className="s-row">
          <div><div className="s-lbl">Chemin personnalisé</div><div className="s-desc">Vide = Java système</div></div>
          <div style={{display:'flex',gap:8}}>
            <input className="input" style={{width:180}} value={s.javaPath||''} readOnly placeholder="Automatique"/>
            <button className="btn btn-ghost" onClick={selJava}>Choisir</button>
          </div>
        </div>
      </div>
      <div className="s-card">
        <div className="s-card-head">Mémoire</div>
        <div className="s-row"><div><div className="s-lbl">RAM minimale (Mo)</div></div><input className="s-num" type="number" min="512" max="8192" step="256" value={s.ram?.min||1024} onChange={e=>updN('ram','min',parseInt(e.target.value))}/></div>
        <div className="s-row"><div><div className="s-lbl">RAM maximale (Mo)</div></div><input className="s-num" type="number" min="512" max="32768" step="256" value={s.ram?.max||2048} onChange={e=>updN('ram','max',parseInt(e.target.value))}/></div>
        <div className="ram-bar-row"><div className="ram-bar"><div className="ram-fill" style={{width:`${ramPct}%`}}/></div><span className="ram-lbl">{((s.ram?.max||2048)/1024).toFixed(1)} Go</span></div>
      </div>
      <div className="s-card">
        <div className="s-card-head">Affichage</div>
        <div className="s-row">
          <div><div className="s-lbl">Résolution</div></div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input className="s-num" type="number" value={s.resolution?.width||854} onChange={e=>updN('resolution','width',parseInt(e.target.value))}/>
            <span style={{color:'var(--txt2)'}}>×</span>
            <input className="s-num" type="number" value={s.resolution?.height||480} onChange={e=>updN('resolution','height',parseInt(e.target.value))}/>
          </div>
        </div>
        <div className="s-row"><div><div className="s-lbl">Plein écran</div><div className="s-desc">Lancer en mode plein écran</div></div><label className="toggle"><input type="checkbox" checked={!!s.fullscreen} onChange={e=>upd('fullscreen',e.target.checked)}/><div className="toggle-track"/></label></div>
      </div>
      <div className="s-card">
        <div className="s-card-head">Lanceur</div>
        <div className="s-row"><div><div className="s-lbl">Fermer au lancement</div><div className="s-desc">Réduire le lanceur quand Minecraft démarre</div></div><label className="toggle"><input type="checkbox" checked={!!s.closeOnLaunch} onChange={e=>upd('closeOnLaunch',e.target.checked)}/><div className="toggle-track"/></label></div>
        <div className="s-row">
          <div><div className="s-lbl">Dossier de jeu</div><div className="s-desc">{s.gameDir||'Dossier par défaut'}</div></div>
          <button className="btn btn-ghost" onClick={selDir}>Choisir…</button>
        </div>
      </div>
      <div className="s-card">
        <div className="s-card-head">À propos</div>
        <div className="about-row">
          <span className="about-icon">⬡</span>
          <div><div style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:15}}>Crystal Launcher</div><div style={{color:'var(--txt2)',fontSize:12}}>Version {ver||'1.0.0'}</div></div>
        </div>
        <div className="s-row"><div><div className="s-lbl">Code source</div></div><button className="btn btn-ghost" onClick={()=>ipc.app.openExternal('https://github.com/solexoff03-code/crystal-launcher')}>GitHub →</button></div>
      </div>
    </div>
  );
}
