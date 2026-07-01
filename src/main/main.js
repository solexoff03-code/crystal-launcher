const { app, BrowserWindow, ipcMain, shell, dialog, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs-extra');

const store = new Store({
  name: 'crystal-launcher-config',
  defaults: {
    settings: {
      gameDir: path.join(app.getPath('appData'), '.crystal-launcher'),
      ram: { min: 1024, max: 2048 },
      javaPath: '',
      resolution: { width: 854, height: 480 },
      fullscreen: false,
      closeOnLaunch: false,
    },
    profiles: [],
    accounts: [],
    activeAccount: null,
    activeProfile: null,
  },
});

const gameDir = store.get('settings.gameDir');
fs.ensureDirSync(gameDir);
fs.ensureDirSync(path.join(gameDir, 'versions'));
fs.ensureDirSync(path.join(gameDir, 'mods'));
fs.ensureDirSync(path.join(gameDir, 'resourcepacks'));
fs.ensureDirSync(path.join(gameDir, 'shaderpacks'));
fs.ensureDirSync(path.join(gameDir, 'skins'));

let mainWindow;
let authWindow;
let launchProcess = null;

// ─── Microsoft OAuth via embedded browser window ───────────────────────────
// Uses the official Xbox/Minecraft OAuth flow with a real redirect capture
const MS_CLIENT_ID = '00000000402b5328'; // Official Xbox Live client ID
const REDIRECT_URI = 'https://login.live.com/oauth20_desktop.srf';
const AUTH_URL = `https://login.live.com/oauth20_authorize.srf?client_id=${MS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin%20offline_access&prompt=select_account`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#080B12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: process.env.NODE_ENV === 'development',
    },
    show: false,
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'build', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (!isDev) {
      const fallback = path.join(app.getAppPath(), 'build', 'index.html');
      mainWindow.loadFile(fallback);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (launchProcess) launchProcess.kill();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window controls ───────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// ─── Store ─────────────────────────────────────────────────────────────────
ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, value) => { store.set(key, value); return true; });
ipcMain.handle('store:delete', (_, key) => { store.delete(key); return true; });

// ─── FS ────────────────────────────────────────────────────────────────────
ipcMain.handle('fs:selectDir', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('fs:selectFile', async (_, filters) => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: filters || [] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('fs:exists', (_, p) => fs.existsSync(p));
ipcMain.handle('fs:readdir', (_, p) => { try { return fs.readdirSync(p); } catch { return []; } });
ipcMain.handle('fs:getGameDir', () => store.get('settings.gameDir'));
ipcMain.handle('fs:copyFile', async (_, src, dest) => {
  try { await fs.copy(src, dest); return true; } catch { return false; }
});

// ─── Microsoft Auth — embedded window ─────────────────────────────────────
ipcMain.handle('auth:openMicrosoftLogin', async () => {
  return new Promise((resolve) => {
    if (authWindow) { authWindow.focus(); return; }

    let resolved = false;
    const resolveOnce = (result) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    authWindow = new BrowserWindow({
      width: 500,
      height: 650,
      parent: mainWindow,
      modal: true,
      title: 'Connexion Microsoft',
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(AUTH_URL);
    authWindow.setMenuBarVisibility(false);

    const tryHandleRedirect = (url) => handleAuthRedirect(url, resolveOnce);

    authWindow.webContents.on('will-navigate', (event, url) => tryHandleRedirect(url));
    authWindow.webContents.on('will-redirect', (event, url) => tryHandleRedirect(url));
    authWindow.webContents.on('did-navigate', (event, url) => tryHandleRedirect(url));

    authWindow.on('closed', () => {
      authWindow = null;
      // Only treat as "cancelled" if we haven't already resolved with a real result
      resolveOnce({ success: false, error: 'Fenêtre fermée par l\'utilisateur' });
    });
  });
});

function handleAuthRedirect(url, resolveOnce) {
  if (!url.includes('login.live.com/oauth20_desktop.srf') && !url.includes('code=')) return;

  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');

    if (error) {
      if (authWindow) { authWindow.destroy(); authWindow = null; }
      resolveOnce({ success: false, error });
      return;
    }

    if (code) {
      // Show a "connecting..." state, exchange tokens FIRST, then close the window
      // so the 'closed' event fires only after we already resolved with the real result.
      exchangeCodeForTokens(code).then((result) => {
        resolveOnce(result);
        if (authWindow) { authWindow.destroy(); authWindow = null; }
      });
    }
  } catch (e) {
    // URL might not be parseable yet, ignore
  }
}

async function exchangeCodeForTokens(code) {
  try {
    const fetch = require('node-fetch');

    // 1. Exchange code for MS token
    const tokenRes = await fetch('https://login.live.com/oauth20_token.srf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return { success: false, error: 'Token Microsoft invalide: ' + JSON.stringify(tokens) };

    // 2. XBL
    const xblRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: tokens.access_token },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });
    const xbl = await xblRes.json();
    if (!xbl.Token) return { success: false, error: 'XBL auth échoué' };

    // 3. XSTS
    const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.Token] },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT',
      }),
    });
    const xsts = await xstsRes.json();
    if (!xsts.Token) return { success: false, error: 'XSTS auth échoué: ' + JSON.stringify(xsts) };
    const userHash = xsts.DisplayClaims.xui[0].uhs;

    // 4. Minecraft token
    const mcRes = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken: `XBL3.0 x=${userHash};${xsts.Token}` }),
    });
    const mc = await mcRes.json();
    if (!mc.access_token) return { success: false, error: 'Token Minecraft invalide' };

    // 5. Profile
    const profileRes = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: `Bearer ${mc.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.id) return { success: false, error: 'Pas de licence Minecraft sur ce compte' };

    const account = {
      id: profile.id,
      uuid: profile.id,
      username: profile.name,
      access_token: mc.access_token,
      refresh_token: tokens.refresh_token,
      type: 'msa',
      skins: profile.skins || [],
    };

    const accounts = store.get('accounts') || [];
    const idx = accounts.findIndex(a => a.uuid === account.uuid);
    if (idx >= 0) accounts[idx] = account;
    else accounts.push(account);
    store.set('accounts', accounts);
    store.set('activeAccount', account.id);

    return { success: true, account };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Offline auth ──────────────────────────────────────────────────────────
ipcMain.handle('auth:offline', async (_, username) => {
  const { v4: uuidv4 } = require('uuid');
  const account = {
    id: uuidv4(),
    uuid: uuidv4().replace(/-/g, ''),
    username,
    access_token: '0',
    type: 'offline',
    skins: [],
  };
  const accounts = store.get('accounts') || [];
  accounts.push(account);
  store.set('accounts', accounts);
  store.set('activeAccount', account.id);
  return { success: true, account };
});

ipcMain.handle('auth:remove', async (_, id) => {
  const accounts = (store.get('accounts') || []).filter(a => a.id !== id);
  store.set('accounts', accounts);
  if (store.get('activeAccount') === id) store.set('activeAccount', accounts[0]?.id || null);
  return { success: true };
});

// ─── Skin management ───────────────────────────────────────────────────────
ipcMain.handle('skin:import', async (_, accountId) => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Importer un skin',
    properties: ['openFile'],
    filters: [{ name: 'Image PNG', extensions: ['png'] }],
  });
  if (r.canceled) return { success: false };
  
  const skinPath = r.filePaths[0];
  const skinsDir = path.join(store.get('settings.gameDir'), 'skins');
  const destPath = path.join(skinsDir, `${accountId}.png`);
  
  try {
    await fs.copy(skinPath, destPath);
    // Update account with local skin path
    const accounts = store.get('accounts') || [];
    const idx = accounts.findIndex(a => a.id === accountId);
    if (idx >= 0) {
      accounts[idx].localSkin = destPath;
      store.set('accounts', accounts);
    }
    return { success: true, skinPath: destPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skin:getPath', (_, accountId) => {
  const skinsDir = path.join(store.get('settings.gameDir'), 'skins');
  const skinPath = path.join(skinsDir, `${accountId}.png`);
  return fs.existsSync(skinPath) ? skinPath : null;
});

// ─── Shaders ───────────────────────────────────────────────────────────────
ipcMain.handle('shaders:list', () => {
  const shadersDir = path.join(store.get('settings.gameDir'), 'shaderpacks');
  try {
    return fs.readdirSync(shadersDir).filter(f => f.endsWith('.zip') || fs.statSync(path.join(shadersDir, f)).isDirectory());
  } catch { return []; }
});

ipcMain.handle('shaders:install', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Installer un shader',
    properties: ['openFile'],
    filters: [{ name: 'Shader Pack', extensions: ['zip'] }],
  });
  if (r.canceled) return { success: false };
  
  const shadersDir = path.join(store.get('settings.gameDir'), 'shaderpacks');
  const filename = path.basename(r.filePaths[0]);
  const dest = path.join(shadersDir, filename);
  
  try {
    await fs.copy(r.filePaths[0], dest);
    return { success: true, name: filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('shaders:delete', async (_, name) => {
  const shadersDir = path.join(store.get('settings.gameDir'), 'shaderpacks');
  try {
    await fs.remove(path.join(shadersDir, name));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('shaders:openFolder', () => {
  const shadersDir = path.join(store.get('settings.gameDir'), 'shaderpacks');
  shell.openPath(shadersDir);
});

// ─── Minecraft versions ────────────────────────────────────────────────────
ipcMain.handle('minecraft:getVersions', async () => {
  try {
    const fetch = require('node-fetch');
    const res = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const data = await res.json();
    return { latest: data.latest, versions: data.versions.map(v => ({ id: v.id, type: v.type, releaseTime: v.releaseTime })) };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('minecraft:launch', async (_, { account, version, settings, profile }) => {
  try {
    const { Client } = require('minecraft-launcher-core');
    const launcher = new Client();
    const dir = settings.gameDir || store.get('settings.gameDir');

    const opts = {
      authorization: {
        access_token: account.access_token,
        client_token: 'crystal-launcher',
        uuid: account.uuid,
        name: account.username,
        meta: { xuid: account.xuid || '', type: account.type || 'msa' },
      },
      root: dir,
      version: { number: version, type: 'release' },
      memory: { max: `${settings.ram?.max || 2048}M`, min: `${settings.ram?.min || 1024}M` },
      window: settings.fullscreen ? undefined : { width: settings.resolution?.width || 854, height: settings.resolution?.height || 480, fullscreen: false },
      javaPath: settings.javaPath || undefined,
      overrides: profile?.jvmArgs ? { jvm: profile.jvmArgs.split(' ') } : undefined,
    };

    launcher.on('debug', (e) => mainWindow?.webContents.send('launcher:log', e));
    launcher.on('data', (e) => mainWindow?.webContents.send('launcher:log', e));
    launcher.on('progress', (e) => mainWindow?.webContents.send('launcher:progress', e));
    launcher.on('close', (code) => mainWindow?.webContents.send('launcher:closed', code));

    launchProcess = await launcher.launch(opts);
    if (settings.closeOnLaunch) mainWindow?.hide();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── Java ──────────────────────────────────────────────────────────────────
ipcMain.handle('java:detect', async () => {
  const { exec } = require('child_process');
  return new Promise(resolve => {
    exec('java -version', (err, stdout, stderr) => {
      const output = stderr || stdout;
      const match = output.match(/version "([^"]+)"/);
      resolve({ found: !err, version: match?.[1] || null });
    });
  });
});

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.on('open:external', (_, url) => shell.openExternal(url));
