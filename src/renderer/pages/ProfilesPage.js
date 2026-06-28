import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../App';
import './ProfilesPage.css';

const ipc = window.electron;

const DEFAULT_PROFILE = {
  name: '',
  version: 'latest-release',
  ram: { min: 1024, max: 2048 },
  jvmArgs: '-XX:+UseG1GC -XX:+ParallelRefProcEnabled',
  gameDir: '',
  resolution: { width: 854, height: 480 },
  icon: '⬡',
};

const ICONS = ['⬡', '🌊', '🔥', '⚡', '🌿', '❄️', '🌙', '⭐', '🎮', '🏔️', '🌋', '🦅'];

export default function ProfilesPage() {
  const { profiles, activeProfile, setActiveProfileState, refreshProfiles } = useApp();
  const [editing, setEditing] = useState(null); // null | 'new' | profile object
  const [form, setForm] = useState(DEFAULT_PROFILE);

  const saveProfiles = async (newProfiles) => {
    await ipc.store.set('profiles', newProfiles);
    await refreshProfiles();
  };

  const startNew = () => {
    setForm({ ...DEFAULT_PROFILE, name: `Profil ${profiles.length + 1}` });
    setEditing('new');
  };

  const startEdit = (profile) => {
    setForm({ ...profile });
    setEditing(profile);
  };

  const saveForm = async () => {
    if (!form.name.trim()) return;
    let newProfiles;
    if (editing === 'new') {
      newProfiles = [...profiles, { ...form, id: uuidv4() }];
    } else {
      newProfiles = profiles.map(p => p.id === editing.id ? { ...form, id: p.id } : p);
    }
    await saveProfiles(newProfiles);
    setEditing(null);
  };

  const deleteProfile = async (id) => {
    const newProfiles = profiles.filter(p => p.id !== id);
    await saveProfiles(newProfiles);
    if (activeProfile === id) setActiveProfileState(null);
  };

  const setActive = async (id) => {
    setActiveProfileState(id === activeProfile ? null : id);
    await ipc.store.set('activeProfile', id === activeProfile ? null : id);
  };

  const selectDir = async () => {
    const dir = await ipc.fs.selectDir();
    if (dir) setForm(f => ({ ...f, gameDir: dir }));
  };

  if (editing !== null) {
    return (
      <div className="profiles-page">
        <div className="page-header">
          <h1>{editing === 'new' ? 'Nouveau profil' : 'Modifier le profil'}</h1>
          <p>Configurez les options de lancement</p>
        </div>

        <div className="profile-form card">
          {/* Icon */}
          <div className="form-group">
            <label className="form-label">Icône</label>
            <div className="icon-picker">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  className={`icon-option${form.icon === icon ? ' icon-option--active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom du profil *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mon profil" />
          </div>

          <div className="form-group">
            <label className="form-label">Version Minecraft</label>
            <input className="input" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="ex: 1.21.4 ou latest-release" />
            <p className="form-hint">Laissez "latest-release" pour toujours utiliser la dernière version stable.</p>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">RAM minimale (Mo)</label>
              <input className="input" type="number" min="512" max="16384" step="256"
                value={form.ram.min} onChange={e => setForm(f => ({ ...f, ram: { ...f.ram, min: parseInt(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">RAM maximale (Mo)</label>
              <input className="input" type="number" min="512" max="32768" step="256"
                value={form.ram.max} onChange={e => setForm(f => ({ ...f, ram: { ...f.ram, max: parseInt(e.target.value) } }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Arguments JVM</label>
            <input className="input" value={form.jvmArgs} onChange={e => setForm(f => ({ ...f, jvmArgs: e.target.value }))}
              placeholder="-XX:+UseG1GC -XX:+ParallelRefProcEnabled" />
            <p className="form-hint">Paramètres Java supplémentaires pour optimiser les performances.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Dossier de jeu (optionnel)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={form.gameDir} readOnly placeholder="Dossier par défaut" />
              <button className="btn btn-ghost" onClick={selectDir} style={{ whiteSpace: 'nowrap' }}>Choisir…</button>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Largeur fenêtre</label>
              <input className="input" type="number" value={form.resolution.width}
                onChange={e => setForm(f => ({ ...f, resolution: { ...f.resolution, width: parseInt(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Hauteur fenêtre</label>
              <input className="input" type="number" value={form.resolution.height}
                onChange={e => setForm(f => ({ ...f, resolution: { ...f.resolution, height: parseInt(e.target.value) } }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={saveForm} disabled={!form.name.trim()}>
              {editing === 'new' ? 'Créer le profil' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profiles-page">
      <div className="page-header">
        <h1>Profils</h1>
        <p>Configurez différents environnements de lancement</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={startNew}>+ Nouveau profil</button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <h3>Aucun profil</h3>
          <p>Créez un profil pour personnaliser vos sessions de jeu (RAM, version, arguments JVM…)</p>
        </div>
      ) : (
        <div className="profiles-list">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`profile-card card${activeProfile === profile.id ? ' profile-card--active' : ''}`}
            >
              <div className="profile-icon">{profile.icon}</div>
              <div className="profile-info">
                <div className="profile-name">{profile.name}</div>
                <div className="profile-meta">
                  <span>Version : {profile.version}</span>
                  <span>RAM : {profile.ram?.max} Mo</span>
                  {profile.gameDir && <span>📁 Dossier custom</span>}
                </div>
              </div>
              <div className="profile-actions">
                <button
                  className={`btn ${activeProfile === profile.id ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => setActive(profile.id)}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  {activeProfile === profile.id ? '✓ Actif' : 'Activer'}
                </button>
                <button className="btn-icon" onClick={() => startEdit(profile)} title="Modifier"><EditIcon /></button>
                <button className="btn-icon" onClick={() => deleteProfile(profile.id)} title="Supprimer"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
