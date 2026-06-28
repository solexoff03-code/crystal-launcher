import React, { useState } from 'react';
import { useApp } from '../App';
import './AccountsPage.css';

const ipc = window.electron;

export default function AccountsPage() {
  const { accounts, activeAccount, setActiveAccount, refreshAccounts } = useApp();
  const [offlineUsername, setOfflineUsername] = useState('');
  const [msCode, setMsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msStep, setMsStep] = useState('idle'); // idle | waiting | code
  const [error, setError] = useState('');

  const addOffline = async () => {
    if (!offlineUsername.trim()) return;
    if (offlineUsername.length < 3 || offlineUsername.length > 16) {
      setError('Le pseudo doit faire entre 3 et 16 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await ipc.auth.offline(offlineUsername.trim());
    if (result.success) {
      setOfflineUsername('');
      await refreshAccounts();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const startMicrosoft = async () => {
    setMsStep('waiting');
    setError('');
    await ipc.auth.getMicrosoftURL();
    setMsStep('code');
  };

  const submitMsCode = async () => {
    if (!msCode.trim()) return;
    setLoading(true);
    setError('');
    const result = await ipc.auth.microsoftCallback(msCode.trim());
    if (result.success) {
      setMsCode('');
      setMsStep('idle');
      await refreshAccounts();
    } else {
      setError(`Erreur d'authentification : ${result.error}`);
    }
    setLoading(false);
  };

  const removeAccount = async (acc) => {
    await ipc.auth.remove(acc.id);
    await refreshAccounts();
  };

  const selectAccount = async (acc) => {
    await setActiveAccount(acc);
    await ipc.store.set('activeAccount', acc.id);
    await refreshAccounts();
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h1>Comptes</h1>
        <p>Gérez vos comptes Minecraft</p>
      </div>

      {/* Accounts list */}
      <div className="section">
        <div className="section-title">Comptes enregistrés ({accounts.length})</div>
        {accounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>Aucun compte</h3>
            <p>Ajoutez un compte Microsoft ou hors-ligne pour jouer</p>
          </div>
        ) : (
          <div className="accounts-list">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className={`account-card card${activeAccount?.id === acc.id ? ' account-card--active' : ''}`}
                onClick={() => selectAccount(acc)}
              >
                <div className="account-avatar">
                  {acc.type === 'offline' ? (
                    <span className="account-avatar-placeholder">⚡</span>
                  ) : (
                    <img
                      src={`https://crafatar.com/avatars/${acc.uuid}?size=48&overlay`}
                      alt={acc.username}
                      className="account-skin"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  )}
                </div>
                <div className="account-info">
                  <div className="account-name">{acc.username}</div>
                  <div className="account-meta">
                    <span className={`badge badge-${acc.type}`}>
                      {acc.type === 'msa' ? 'Microsoft' : 'Hors-ligne'}
                    </span>
                    <span className="account-uuid">{acc.uuid?.substring(0, 8)}…</span>
                  </div>
                </div>
                <div className="account-actions">
                  {activeAccount?.id === acc.id && (
                    <span className="account-active-badge">✓ Actif</span>
                  )}
                  <button
                    className="btn-icon"
                    onClick={e => { e.stopPropagation(); removeAccount(acc); }}
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add accounts */}
      <div className="grid-2">
        {/* Microsoft */}
        <div className="card add-account-card">
          <div className="add-account-header">
            <span className="add-account-icon">🪟</span>
            <div>
              <h3>Compte Microsoft</h3>
              <p>Minecraft Java Edition officiel</p>
            </div>
          </div>

          {msStep === 'idle' && (
            <button className="btn btn-primary" onClick={startMicrosoft} disabled={loading}>
              Connexion Microsoft
            </button>
          )}

          {msStep === 'waiting' && (
            <div className="ms-waiting">
              <div className="spin" style={{ fontSize: 20 }}>↻</div>
              <span>Ouverture du navigateur…</span>
            </div>
          )}

          {msStep === 'code' && (
            <div className="ms-code-form">
              <p className="ms-instructions">
                Connectez-vous dans le navigateur, puis copiez le code d'autorisation depuis l'URL de redirection et collez-le ici.
              </p>
              <input
                className="input"
                placeholder="Code d'autorisation…"
                value={msCode}
                onChange={e => setMsCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitMsCode()}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={submitMsCode} disabled={loading || !msCode.trim()}>
                  {loading ? 'Vérification…' : 'Valider'}
                </button>
                <button className="btn btn-ghost" onClick={() => setMsStep('idle')}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Offline */}
        <div className="card add-account-card">
          <div className="add-account-header">
            <span className="add-account-icon">⚡</span>
            <div>
              <h3>Compte hors-ligne</h3>
              <p>Sans authentification Mojang</p>
            </div>
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 10 }}>
            <input
              className="input"
              placeholder="Pseudo (3–16 caractères)"
              value={offlineUsername}
              onChange={e => setOfflineUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addOffline()}
              maxLength={16}
            />
            <button
              className="btn btn-ghost"
              onClick={addOffline}
              disabled={loading || !offlineUsername.trim()}
            >
              Ajouter en hors-ligne
            </button>
            <p className="form-hint">⚠️ Serveurs en ligne non accessibles en mode hors-ligne.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="launch-error" style={{ background: 'var(--red-dark)', border: '1px solid var(--red)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
