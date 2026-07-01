const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Store
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },

  // Filesystem
  fs: {
    selectDir: () => ipcRenderer.invoke('fs:selectDir'),
    exists: (p) => ipcRenderer.invoke('fs:exists', p),
    readdir: (p) => ipcRenderer.invoke('fs:readdir', p),
    getGameDir: () => ipcRenderer.invoke('fs:getGameDir'),
  },

  // Minecraft
  minecraft: {
    getVersions: () => ipcRenderer.invoke('minecraft:getVersions'),
    launch: (opts) => ipcRenderer.invoke('minecraft:launch', opts),
  },

  // Auth
  auth: {
    getMicrosoftURL: () => ipcRenderer.invoke('auth:getMicrosoftURL'),
    microsoftCallback: (code) => ipcRenderer.invoke('auth:microsoftCallback', code),
    offline: (username) => ipcRenderer.invoke('auth:offline', username),
    remove: (id) => ipcRenderer.invoke('auth:remove', id),
  },

  // Java
  java: {
    detect: () => ipcRenderer.invoke('java:detect'),
  },

  // App
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    openExternal: (url) => ipcRenderer.send('open:external', url),
  },

  // Event listeners
  on: (channel, callback) => {
    const allowed = ['launcher:log', 'launcher:progress', 'launcher:closed'];
    if (allowed.includes(channel)) {
      const sub = (_, ...args) => callback(...args);
      ipcRenderer.on(channel, sub);
      return () => ipcRenderer.removeListener(channel, sub);
    }
  },
});
