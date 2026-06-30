import React,{useEffect,useRef} from 'react';
import {useApp} from '../App';
import './ConsolePage.css';
export default function ConsolePage(){
  const {consoleLogs,gameRunning,launching}=useApp();
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:'smooth'});},[consoleLogs]);
  const fmt=ts=>{const d=new Date(ts);return`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`};
  const copy=()=>navigator.clipboard.writeText(consoleLogs.map(l=>`[${fmt(l.time)}] ${l.text}`).join('\n'));
  return(
    <div className="console-page">
      <div className="page-header console-toolbar">
        <div><h1>Console</h1><p>{gameRunning?'Minecraft en cours':launching?'Démarrage…':'En attente'}</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {(gameRunning||launching)&&<div className="c-status"><div className={`c-status-dot${gameRunning?' green':' gray'}`}/>{gameRunning?'En jeu':'Démarrage…'}</div>}
          <button className="btn btn-ghost" onClick={copy} disabled={!consoleLogs.length}>Copier</button>
        </div>
      </div>
      <div className="console-box">
        {consoleLogs.length===0
          ?<div className="console-empty">En attente du lancement…</div>
          :consoleLogs.map((l,i)=>(
            <div key={i} className={`log-line log-${l.type}`}>
              <span className="log-time">[{fmt(l.time)}]</span>
              <span className="log-txt">{l.text}</span>
            </div>
          ))
        }
        <div ref={ref}/>
      </div>
    </div>
  );
}
