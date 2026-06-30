import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import VersionsPage from './pages/VersionsPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilesPage from './pages/ProfilesPage';
import ConsolePage from './pages/ConsolePage';
import ShadersPage from './pages/ShadersPage';
import './App.css';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
const ipc = window.electron;

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccountState] = useState(null);
  const [settings, setSettingsState] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [launchProgress, setLaunchProgress] = useState(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function load() {
      const [accs, activeId, s, profs, activeProf] = await Promise.all([
        ipc.store.get('accounts'),
        ipc.store.get('activeAccount'),
        ipc.store.get('settings'),
        ipc.store.get('profiles'),
        ipc.store.get('activeProfile'),
      ]);
      setAccounts(accs || []);
      setActiveAccountState(activeId ? (accs || []).find(a => a.id === activeId) || null : null);
      setSettingsState(s || {});
      setProfiles(profs || []);
      setActiveProfileState(activeProf || null);
      setInitialized(true);
    }
    load();

    const u1 = ipc.on('launcher:log', (msg) => setConsoleLogs(p => [...p.slice(-500), { type: 'log', text: msg, time: Date.now() }]));
    const u2 = ipc.on('launcher:progress', (data) => setLaunchProgress(data));
    const u3 = ipc.on('launcher:closed', (code) => {
      setGameRunning(false); setLaunching(false); setLaunchProgress(null);
      setConsoleLogs(p => [...p, { type: 'info', text: `Jeu fermé (code ${code})`, time: Date.now() }]);
    });
    return () => { u1?.(); u2?.(); u3?.(); };
  }, []);

  const setActiveAccount = async (account) => {
    setActiveAccountState(account);
    await ipc.store.set('activeAccount', account?.id || null);
  };

  const setSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettingsState(merged);
    await ipc.store.set('settings', merged);
  };

  const refreshAccounts = async () => {
    const accs = await ipc.store.get('accounts');
    const activeId = await ipc.store.get('activeAccount');
    setAccounts(accs || []);
    setActiveAccountState(activeId ? (accs || []).find(a => a.id === activeId) || null : null);
  };

  const refreshProfiles = async () => {
    const profs = await ipc.store.get('profiles');
    setProfiles(profs || []);
  };

  const launchGame = async (version) => {
    if (!activeAccount) return { error: 'Aucun compte sélectionné' };
    setLaunching(true);
    setConsoleLogs([{ type: 'info', text: `Démarrage de Minecraft ${version}...`, time: Date.now() }]);
    const result = await ipc.minecraft.launch({
      account: activeAccount, version, settings,
      profile: profiles.find(p => p.id === activeProfile),
    });
    if (result.success) setGameRunning(true);
    else { setLaunching(false); setConsoleLogs(p => [...p, { type: 'error', text: `Erreur: ${result.error}`, time: Date.now() }]); }
    return result;
  };

  const ctx = {
    accounts, activeAccount, setActiveAccount, refreshAccounts,
    settings, setSettings,
    profiles, activeProfile, setActiveProfileState, refreshProfiles,
    launching, gameRunning, launchGame, consoleLogs, launchProgress,
  };

  if (!initialized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080B12', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48, background: 'linear-gradient(135deg,#00D4FF,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬡</div>
      <span style={{ color: '#475569', fontSize: 13 }}>Chargement…</span>
    </div>
  );

  return (
    <AppContext.Provider value={ctx}>
      <Router>
        <div className="app-root">
          <TitleBar />
          <div className="app-body">
            <Sidebar />
            <main className="app-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/versions" element={<VersionsPage />} />
                <Route path="/profiles" element={<ProfilesPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/shaders" element={<ShadersPage />} />
                <Route path="/console" element={<ConsolePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AppContext.Provider>
  );
}
