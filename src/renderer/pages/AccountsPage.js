import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import './AccountsPage.css';
const ipc = window.electron;

export default function AccountsPage() {
  const { accounts, activeAccount, setActiveAccount, refreshAccounts } = useApp();
  const [offline, setOffline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skinPaths, setSkinPaths] = useState({});
  const [avatarErrors, setAvatarErrors] = useState({});

  useEffect(() => {
    // Load local skin paths for all accounts
    accounts.forEach(async acc => {
      const p = await ipc.skin.getPath(acc.id);
      if (p) setSkinPaths(prev => ({ ...prev, [acc.id]: p }));
    });
  }, [accounts]);

  const loginMicrosoft = async () => {
    setLoading(true);
    setError('');
    const result = await ipc.auth.openMicrosoftLogin();
    if (result.success) {
      await refreshAccounts();
    } else {
      setError(result.error || 'Connexion annulée');
    }
    setLoading(false);
  };

  const addOffline = async () => {
    if (!offline.trim() || offline.length < 3) { setError('Pseudo trop court (min 3 car.)'); return; }
    setLoading(true); setError('');
    const r = await ipc.auth.offline(offline.trim());
    if (r.success) { setOffline(''); await refreshAccounts(); }
    else setError(r.error);
    setLoading(false);
  };

  const remove = async (acc) => {
    await ipc.auth.remove(acc.id);
    await refreshAccounts();
  };

  const select = async (acc) => {
    await setActiveAccount(acc);
  };

  const importSkin = async (acc) => {
    const r = await ipc.skin.import(acc.id);
    if (r.success) {
      setSkinPaths(prev => ({ ...prev, [acc.id]: r.skinPath }));
    }
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h1>Comptes</h1>
        <p>Gérez vos identités de jeu</p>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Aucun compte</h3>
          <p>Connectez-vous avec Microsoft ou ajoutez un compte hors-ligne</p>
        </div>
      ) : (
        <div className="acc-list">
          {accounts.map(acc => (
            <div key={acc.id} className={`acc-card${activeAccount?.id === acc.id ? ' acc-card--active' : ''}`}>
              {/* Avatar / Skin */}
              <div className="acc-avatar" onClick={() => select(acc)}>
                {skinPaths[acc.id] ? (
                  // Skin local importé — fonctionne toujours, en ligne ou hors-ligne
                  <img src={`file://${skinPaths[acc.id]}`} alt="skin" className="acc-skin-img"/>
                ) : acc.type === 'msa' && acc.uuid && !avatarErrors[acc.id] ? (
                  // Avatar en ligne (crafatar) — si ça échoue (pas d'internet), on bascule sur l'icône
                  <img
                    src={`https://crafatar.com/avatars/${acc.uuid}?size=44&overlay`}
                    alt={acc.username}
                    className="acc-skin-img"
                    onError={() => setAvatarErrors(prev => ({ ...prev, [acc.id]: true }))}
                  />
                ) : (
                  <span>{acc.type === 'offline' ? '⚡' : '👤'}</span>
                )}
              </div>

              {/* Info */}
              <div className="acc-info" onClick={() => select(acc)}>
                <div className="acc-name">{acc.username}</div>
                <div className="acc-meta">
                  <span className={`badge badge-${acc.type === 'msa' ? 'msa' : 'offline'}`}>
                    {acc.type === 'msa' ? 'Microsoft' : 'Hors-ligne'}
                  </span>
                  {activeAccount?.id === acc.id && <span className="acc-active">✓ Actif</span>}
                  {acc.type === 'msa' && !skinPaths[acc.id] && avatarErrors[acc.id] && (
                    <span className="acc-meta-hint" title="Avatar en ligne indisponible — importez un skin local pour qu'il s'affiche hors-ligne">
                      📡 hors-ligne
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="acc-actions">
                <button className="acc-action-btn" onClick={() => importSkin(acc)} title="Importer un skin">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                  Skin
                </button>
                <button className="acc-action-btn acc-action-btn--danger" onClick={() => remove(acc)} title="Supprimer">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-box">⚠️ {error}</div>}

      <div className="add-row">
        {/* Microsoft */}
        <div className="add-card">
          <div className="add-card-head">
            <span className="add-card-icon">🪟</span>
            <div>
              <div className="add-card-title">Compte Microsoft</div>
              <div className="add-card-sub">Officiel — multijoueur en ligne</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={loginMicrosoft} disabled={loading}>
            {loading ? <><span className="spin">⟳</span> Connexion…</> : 'Se connecter avec Microsoft'}
          </button>
          <p className="form-hint">Une fenêtre Microsoft va s'ouvrir pour vous authentifier.</p>
        </div>

        {/* Offline */}
        <div className="add-card">
          <div className="add-card-head">
            <span className="add-card-icon">⚡</span>
            <div>
              <div className="add-card-title">Hors-ligne</div>
              <div className="add-card-sub">Solo uniquement</div>
            </div>
          </div>
          <input
            className="input"
            placeholder="Votre pseudo (3–16 car.)"
            value={offline}
            onChange={e => setOffline(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addOffline()}
            maxLength={16}
          />
          <button className="btn btn-ghost" onClick={addOffline} disabled={loading || !offline.trim()}>
            Ajouter
          </button>
          <p className="form-hint">⚠️ Serveurs en ligne non accessibles en mode hors-ligne.</p>
        </div>
      </div>
    </div>
  );
}
