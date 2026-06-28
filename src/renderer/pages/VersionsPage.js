import React, { useState, useEffect } from 'react';
import './VersionsPage.css';

const ipc = window.electron;

export default function VersionsPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('release');
  const [search, setSearch] = useState('');
  const [installedVersions, setInstalledVersions] = useState([]);

  useEffect(() => {
    load();
    checkInstalled();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await ipc.minecraft.getVersions();
    if (!data.error) setVersions(data.versions);
    setLoading(false);
  };

  const checkInstalled = async () => {
    const gameDir = await ipc.fs.getGameDir();
    const dirs = await ipc.fs.readdir(`${gameDir}/versions`);
    setInstalledVersions(dirs || []);
  };

  const filtered = versions.filter(v => {
    const matchType =
      filter === 'all' ||
      (filter === 'release' && v.type === 'release') ||
      (filter === 'snapshot' && v.type === 'snapshot') ||
      (filter === 'old' && (v.type === 'old_alpha' || v.type === 'old_beta'));
    const matchSearch = !search || v.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="versions-page">
      <div className="page-header">
        <h1>Versions</h1>
        <p>{versions.filter(v => v.type === 'release').length} releases · {versions.filter(v => v.type === 'snapshot').length} snapshots disponibles</p>
      </div>

      <div className="versions-toolbar">
        <input
          className="input"
          placeholder="Rechercher une version…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div className="filter-tabs">
          {[['release', 'Release'], ['snapshot', 'Snapshot'], ['old', 'Ancienne'], ['all', 'Toutes']].map(([val, label]) => (
            <button
              key={val}
              className={`filter-tab${filter === val ? ' filter-tab--active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spin" style={{ fontSize: 32 }}>↻</div>
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Chargement des versions…</p>
        </div>
      ) : (
        <div className="versions-grid">
          {filtered.slice(0, 100).map(v => {
            const isInstalled = installedVersions.includes(v.id);
            return (
              <div key={v.id} className={`version-card card${isInstalled ? ' version-card--installed' : ''}`}>
                <div className="version-card-top">
                  <span className="version-id">{v.id}</span>
                  {isInstalled && <span className="version-installed-dot" title="Installé" />}
                </div>
                <div className="version-card-bottom">
                  <span className={`badge badge-${v.type === 'release' ? 'release' : v.type === 'snapshot' ? 'snapshot' : 'old'}`}>
                    {v.type}
                  </span>
                  <span className="version-date">{new Date(v.releaseTime).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Aucun résultat</h3>
          <p>Essayez un autre terme de recherche</p>
        </div>
      )}
    </div>
  );
}
