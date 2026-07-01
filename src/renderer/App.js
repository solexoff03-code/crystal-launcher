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

// ─── Context ─────────────────────────────────────────────────────────────────
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

  // Load data from store
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

    // Launcher events
    const unsubLog = ipc.on('launcher:log', (msg) => {
      setConsoleLogs(prev => [...prev.slice(-500), { type: 'log', text: msg, time: Date.now() }]);
    });
    const unsubProgress = ipc.on('launcher:progress', (data) => {
      setLaunchProgress(data);
    });
    const unsubClose = ipc.on('launcher:closed', (code) => {
      setGameRunning(false);
      setLaunching(false);
      setLaunchProgress(null);
      setConsoleLogs(prev => [...prev, { type: 'info', text: `Game exited with code ${code}`, time: Date.now() }]);
    });

    return () => {
      unsubLog?.();
      unsubProgress?.();
      unsubClose?.();
    };
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
    if (!activeAccount) return { error: 'No account selected' };
    setLaunching(true);
    setConsoleLogs([]);
    setConsoleLogs([{ type: 'info', text: `Starting Minecraft ${version}...`, time: Date.now() }]);

    const result = await ipc.minecraft.launch({
      account: activeAccount,
      version,
      settings,
      profile: profiles.find(p => p.id === activeProfile),
    });

    if (result.success) {
      setGameRunning(true);
    } else {
      setLaunching(false);
      setConsoleLogs(prev => [...prev, { type: 'error', text: `Launch failed: ${result.error}`, time: Date.now() }]);
    }
    return result;
  };

  const ctx = {
    accounts, activeAccount, setActiveAccount, refreshAccounts,
    settings, setSettings,
    profiles, activeProfile, setActiveProfileState, refreshProfiles,
    launching, gameRunning, launchGame,
    consoleLogs, launchProgress,
  };

  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16 }}>
        <div className="crystal-logo">⬡</div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Chargement…</span>
      </div>
    );
  }

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
                <Route path="/console" element={<ConsolePage />} />
                <Route path="/shaders" element={<ShadersPage />} />
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
