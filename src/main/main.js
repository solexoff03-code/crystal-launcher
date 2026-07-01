const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs-extra');

// Initialize store
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
      theme: 'dark',
      language: 'fr',
    },
    profiles: [],
    accounts: [],
    activeAccount: null,
    activeProfile: null,
  },
});

// Ensure game directory exists
const gameDir = store.get('settings.gameDir');
fs.ensureDirSync(gameDir);
fs.ensureDirSync(path.join(gameDir, 'versions'));
fs.ensureDirSync(path.join(gameDir, 'mods'));
fs.ensureDirSync(path.join(gameDir, 'resourcepacks'));

let mainWindow;
let launchProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    show: false,
    titleBarStyle: 'hidden',
  });

  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
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

// ─── Store / Settings ──────────────────────────────────────────────────────
ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, value) => { store.set(key, value); return true; });
ipcMain.handle('store:delete', (_, key) => { store.delete(key); return true; });

// ─── File system ──────────────────────────────────────────────────────────
ipcMain.handle('fs:selectDir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('fs:exists', (_, filePath) => fs.existsSync(filePath));
ipcMain.handle('fs:readdir', (_, dirPath) => {
  try { return fs.readdirSync(dirPath); }
  catch { return []; }
});

ipcMain.handle('fs:getGameDir', () => store.get('settings.gameDir'));

// ─── Minecraft Launch ──────────────────────────────────────────────────────
ipcMain.handle('minecraft:getVersions', async () => {
  try {
    const { Client, Authenticator } = require('minecraft-launcher-core');
    // Fetch version manifest from Mojang
    const fetch = require('node-fetch');
    const res = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const data = await res.json();
    return {
      latest: data.latest,
      versions: data.versions.map(v => ({
        id: v.id,
        type: v.type,
        releaseTime: v.releaseTime,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('minecraft:launch', async (_, { account, version, settings, profile }) => {
  try {
    const { Client } = require('minecraft-launcher-core');
    const launcher = new Client();
    const gameDir = settings.gameDir || store.get('settings.gameDir');

    const opts = {
      authorization: {
        access_token: account.access_token,
        client_token: account.client_token || 'crystal-launcher',
        uuid: account.uuid,
        name: account.username,
        meta: {
          xuid: account.xuid || '',
          type: account.type || 'msa',
        },
      },
      root: gameDir,
      version: {
        number: version,
        type: 'release',
      },
      memory: {
        max: `${settings.ram?.max || 2048}M`,
        min: `${settings.ram?.min || 1024}M`,
      },
      window: settings.fullscreen
        ? undefined
        : {
            width: settings.resolution?.width || 854,
            height: settings.resolution?.height || 480,
            fullscreen: false,
          },
      javaPath: settings.javaPath || undefined,
      overrides: profile?.jvmArgs
        ? { jvm: profile.jvmArgs.split(' ') }
        : undefined,
    };

    launcher.on('debug', (e) => mainWindow?.webContents.send('launcher:log', e));
    launcher.on('data', (e) => mainWindow?.webContents.send('launcher:log', e));
    launcher.on('progress', (e) =>
      mainWindow?.webContents.send('launcher:progress', e)
    );
    launcher.on('close', (code) =>
      mainWindow?.webContents.send('launcher:closed', code)
    );
    launcher.on('package-extract', (e) =>
      mainWindow?.webContents.send('launcher:log', `Extracting: ${e}`)
    );

    launchProcess = await launcher.launch(opts);

    if (settings.closeOnLaunch) mainWindow?.hide();

    return { success: true };
  } catch (err) {
    console.error('Launch error:', err);
    return { success: false, error: err.message };
  }
});

// ─── Auth: Microsoft (device code flow) ───────────────────────────────────
ipcMain.handle('auth:getMicrosoftURL', async () => {
  // Opens the Microsoft login page in default browser
  // Real implementation uses MSAL or manual OAuth
  const clientId = 'YOUR_AZURE_CLIENT_ID'; // Dev must replace with real Azure app client ID
  const redirectUri = 'https://login.microsoftonline.com/common/oauth2/nativeclient';
  const scope = 'XboxLive.signin offline_access';
  const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&prompt=select_account`;
  shell.openExternal(url);
  return { url };
});

ipcMain.handle('auth:microsoftCallback', async (_, code) => {
  try {
    const fetch = require('node-fetch');
    const clientId = store.get('settings.azureClientId') || 'YOUR_AZURE_CLIENT_ID';
    const redirectUri = 'https://login.microsoftonline.com/common/oauth2/nativeclient';

    // Exchange code for token
    const tokenRes = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'XboxLive.signin offline_access',
      }),
    });
    const tokens = await tokenRes.json();

    // XBL auth
    const xblRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokens.access_token}` },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });
    const xbl = await xblRes.json();

    // XSTS
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
    const userHash = xsts.DisplayClaims.xui[0].uhs;

    // Minecraft token
    const mcRes = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken: `XBL3.0 x=${userHash};${xsts.Token}` }),
    });
    const mc = await mcRes.json();

    // Get profile
    const profileRes = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: `Bearer ${mc.access_token}` },
    });
    const profile = await profileRes.json();

    const account = {
      id: profile.id,
      uuid: profile.id,
      username: profile.name,
      access_token: mc.access_token,
      refresh_token: tokens.refresh_token,
      type: 'msa',
      skins: profile.skins,
    };

    // Save account
    const accounts = store.get('accounts') || [];
    const idx = accounts.findIndex(a => a.uuid === account.uuid);
    if (idx >= 0) accounts[idx] = account;
    else accounts.push(account);
    store.set('accounts', accounts);
    store.set('activeAccount', account.uuid);

    return { success: true, account };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:offline', async (_, username) => {
  const { v4: uuidv4 } = require('uuid');
  const account = {
    id: uuidv4(),
    uuid: uuidv4().replace(/-/g, ''),
    username,
    access_token: '0',
    type: 'offline',
  };
  const accounts = store.get('accounts') || [];
  accounts.push(account);
  store.set('accounts', accounts);
  store.set('activeAccount', account.id);
  return { success: true, account };
});

ipcMain.handle('auth:remove', async (_, accountId) => {
  const accounts = (store.get('accounts') || []).filter(a => a.id !== accountId);
  store.set('accounts', accounts);
  if (store.get('activeAccount') === accountId) {
    store.set('activeAccount', accounts[0]?.id || null);
  }
  return { success: true };
});

// ─── Java detection ────────────────────────────────────────────────────────
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

// ─── Open external links ───────────────────────────────────────────────────
ipcMain.on('open:external', (_, url) => shell.openExternal(url));
ipcMain.handle('app:version', () => app.getVersion());
