import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import './HomePage.css';
const ipc = window.electron;

export default function HomePage() {
  const { activeAccount, settings, profiles, activeProfile, setActiveProfileState,
          launching, gameRunning, launchGame, launchProgress } = useApp();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [versionType, setVersionType] = useState('release');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const news = [
    {id:1,tag:'MISE À JOUR',title:'Minecraft 1.21.4',date:'2024-12-03'},
    {id:2,tag:'MISE À JOUR',title:'1.21 — Tricky Trials',date:'2024-06-13'},
    {id:3,tag:'ÉVÉNEMENT',title:'Minecraft Live 2024',date:'2024-10-13'},
  ];

  useEffect(()=>{
    ipc.minecraft.getVersions().then(data=>{
      if(!data.error){
        setVersions(data.versions);
        setSelectedVersion(data.latest.release);
      }
      setLoading(false);
    });
  },[]);

  const filtered = versions.filter(v=>
    versionType==='all'||v.type===versionType
  );

  const handleLaunch = async()=>{
    setError('');
    const r = await launchGame(selectedVersion);
    if(!r.success) setError(r.error||'Erreur inconnue');
  };

  const pct = launchProgress ? Math.round((launchProgress.task/launchProgress.total)*100) : 0;

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-particles">
          {['p1','p2','p3','p4','p5','p6'].map(c=><div key={c} className={`particle ${c}`}/>)}
        </div>

        <div className="hero-top">
          <div className="hero-icon-wrap">
            <span className="hero-icon">⬡</span>
            <div className="hero-ring"/>
          </div>
          <div className="hero-info">
            <h1>Crystal Launcher</h1>
            <p>Lanceur Minecraft personnalisé</p>
            <span className="hero-badge">
              <span className="hero-badge-dot"/>EN LIGNE
            </span>
          </div>
        </div>

        <div className="hero-controls">
          <div className="selectors-row">
            <div>
              <div className="form-label">Version</div>
              {loading
                ? <div className="input" style={{color:'var(--txt2)'}}>Chargement…</div>
                : <select className="input select" value={selectedVersion}
                    onChange={e=>setSelectedVersion(e.target.value)}
                    disabled={launching||gameRunning}>
                    {filtered.slice(0,60).map(v=>(
                      <option key={v.id} value={v.id}>{v.id}</option>
                    ))}
                  </select>
              }
            </div>
            <div>
              <div className="form-label">Type</div>
              <select className="input select" value={versionType}
                onChange={e=>setVersionType(e.target.value)}
                disabled={launching||gameRunning}>
                <option value="release">Release</option>
                <option value="snapshot">Snapshot</option>
                <option value="all">Toutes</option>
              </select>
            </div>
          </div>

          <div className="info-strip">
            <div className="info-chip">
              <div className="chip-dot" style={{background:activeAccount?'var(--green)':'var(--red)'}}/>
              {activeAccount ? activeAccount.username : 'Non connecté'}
            </div>
            <div className="info-chip">
              <div className="chip-dot" style={{background:'var(--cyan)'}}/>
              {settings?.ram?.max||2048} Mo RAM
            </div>
          </div>

          {launching && launchProgress && (
            <div className="play-progress">
              <div className="play-progress-top">
                <span className="play-progress-label">{launchProgress.type||'Téléchargement…'}</span>
                <span className="play-progress-pct">{pct}%</span>
              </div>
              <div className="play-progress-bar">
                <div className="play-progress-fill" style={{width:`${pct}%`}}/>
              </div>
            </div>
          )}

          {error && <div className="error-box">⚠️ {error}</div>}

          {!activeAccount ? (
            <Link to="/accounts" className="btn btn-primary" style={{width:'100%',padding:'15px 0',fontSize:15,borderRadius:'var(--r16)',justifyContent:'center'}}>
              Connecter un compte →
            </Link>
          ) : gameRunning ? (
            <div className="play-wrap">
              <button className="play-btn" disabled>
                <div className="play-btn-inner">
                  <span className="spin">⟳</span> Minecraft en cours…
                </div>
              </button>
            </div>
          ) : (
            <div className="play-wrap">
              <div className="play-glow"/>
              <button className="play-btn" onClick={handleLaunch}
                disabled={launching||!selectedVersion}>
                <div className="play-btn-inner">
                  {launching
                    ? <><span className="spin">⟳</span>Lancement…</>
                    : <>▶ Jouer — {selectedVersion}</>}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-num">{versions.filter(v=>v.type==='release').length||'—'}</div>
          <div className="stat-label">Versions release</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-num">{profiles.length}</div>
          <div className="stat-label">Profils créés</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-num" style={{color:activeAccount?'var(--green)':'var(--red)',fontSize:20}}>
            {activeAccount?'Connecté':'Déconnecté'}
          </div>
          <div className="stat-label">Compte</div>
        </div>
      </div>

      <div>
        <div className="section-hdr">
          <span className="section-lbl">Actualités</span>
        </div>
        <div className="news-grid">
          {news.map(n=>(
            <div key={n.id} className="news-card">
              <span className="news-pill">{n.tag}</span>
              <div className="news-title">{n.title}</div>
              <div className="news-date">{n.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
