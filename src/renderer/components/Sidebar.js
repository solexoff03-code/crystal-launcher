import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../App';
import './Sidebar.css';

export default function Sidebar() {
  const { accounts, gameRunning } = useApp();
  const firstAccount = accounts[0];
  const initial = firstAccount?.username?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <nav className="sb-nav">
        <SbLink to="/" icon={<HomeIcon/>} label="Accueil" end/>
        <SbLink to="/versions" icon={<CubeIcon/>} label="Versions"/>
        <SbLink to="/profiles" icon={<SlidersIcon/>} label="Profils"/>
        <SbLink to="/accounts" icon={<PersonIcon/>} label="Comptes" dot={accounts.length===0?"red":null}/>
        <SbLink to="/console" icon={<TermIcon/>} label="Console" dot={gameRunning?"green":null}/>
        <div className="sb-sep"/>
        <SbLink to="/settings" icon={<GearIcon/>} label="Paramètres"/>
      </nav>
      <NavLink to="/accounts" className="sb-avatar" title={firstAccount?.username||'Aucun compte'}>
        {initial}
      </NavLink>
    </aside>
  );
}

function SbLink({to,icon,label,end,dot}){
  return(
    <NavLink to={to} end={end} title={label}
      className={({isActive})=>`sb-link${isActive?' active':''}`}>
      {icon}
      {dot && <span className={`sb-dot sb-dot-${dot}`}/>}
    </NavLink>
  );
}

function HomeIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
function CubeIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12"y1="22.08"x2="12"y2="12"/></svg>}
function PersonIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12"cy="7"r="4"/></svg>}
function GearIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><circle cx="12"cy="12"r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
function TermIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12"y1="19"x2="20"y2="19"/></svg>}
function SlidersIcon(){return<svg fill="none"stroke="currentColor"viewBox="0 0 24 24"><line x1="4"y1="6"x2="20"y2="6"/><line x1="4"y1="12"x2="20"y2="12"/><line x1="4"y1="18"x2="20"y2="18"/><circle cx="8"cy="6"r="2"fill="currentColor"stroke="none"/><circle cx="16"cy="12"r="2"fill="currentColor"stroke="none"/><circle cx="10"cy="18"r="2"fill="currentColor"stroke="none"/></svg>}
