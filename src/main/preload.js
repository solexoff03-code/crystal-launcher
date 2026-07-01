const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },

  fs: {
    selectDir: () => ipcRenderer.invoke('fs:selectDir'),
    selectFile: (filters) => ipcRenderer.invoke('fs:selectFile', filters),
    exists: (p) => ipcRenderer.invoke('fs:exists', p),
    readdir: (p) => ipcRenderer.invoke('fs:readdir', p),
    getGameDir: () => ipcRenderer.invoke('fs:getGameDir'),
    copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
  },

  auth: {
    openMicrosoftLogin: () => ipcRenderer.invoke('auth:openMicrosoftLogin'),
    offline: (username) => ipcRenderer.invoke('auth:offline', username),
    remove: (id) => ipcRenderer.invoke('auth:remove', id),
  },

  skin: {
    import: (accountId) => ipcRenderer.invoke('skin:import', accountId),
    getPath: (accountId) => ipcRenderer.invoke('skin:getPath', accountId),
  },

  shaders: {
    list: () => ipcRenderer.invoke('shaders:list'),
    install: () => ipcRenderer.invoke('shaders:install'),
    delete: (name) => ipcRenderer.invoke('shaders:delete', name),
    openFolder: () => ipcRenderer.invoke('shaders:openFolder'),
  },

  minecraft: {
    getVersions: () => ipcRenderer.invoke('minecraft:getVersions'),
    launch: (opts) => ipcRenderer.invoke('minecraft:launch', opts),
  },

  java: { detect: () => ipcRenderer.invoke('java:detect') },

  app: {
    version: () => ipcRenderer.invoke('app:version'),
    openExternal: (url) => ipcRenderer.send('open:external', url),
  },

  on: (channel, callback) => {
    const allowed = ['launcher:log', 'launcher:progress', 'launcher:closed'];
    if (allowed.includes(channel)) {
      const sub = (_, ...args) => callback(...args);
      ipcRenderer.on(channel, sub);
      return () => ipcRenderer.removeListener(channel, sub);
    }
  },
});
