# ⬡ Crystal Launcher

> Un lanceur Minecraft personnalisé, moderne et open source, construit avec Electron + React.

![Crystal Launcher Screenshot](docs/screenshot.png)

## ✨ Fonctionnalités

- 🔐 **Authentification Microsoft** (compte Minecraft officiel) + mode hors-ligne
- 📦 **Téléchargement automatique** de toutes les versions Minecraft (release, snapshot, old)
- 🎮 **Profils de lancement** — RAM, JVM args, version, résolution, dossier custom
- 📊 **Console intégrée** — logs de jeu en temps réel
- ⚙️ **Paramètres complets** — Java custom, RAM, résolution, plein écran
- 🌙 **Interface sombre** moderne et épurée
- 🖥️ **Multi-plateforme** : Windows, macOS, Linux

## 📸 Aperçu

| Accueil | Comptes | Paramètres |
|---------|---------|------------|
| ![](docs/home.png) | ![](docs/accounts.png) | ![](docs/settings.png) |

## 🚀 Installation

### Télécharger une release

Rendez-vous sur la page [Releases](https://github.com/yourusername/crystal-launcher/releases) et téléchargez l'installateur pour votre système.

| Système | Fichier |
|---------|---------|
| Windows | `Crystal-Launcher-Setup-x.x.x.exe` |
| macOS | `Crystal-Launcher-x.x.x.dmg` |
| Linux | `Crystal-Launcher-x.x.x.AppImage` |

### Prérequis

- **Java 17+** (recommandé : [Eclipse Temurin](https://adoptium.net/))
- Compte Microsoft avec Minecraft Java Edition (ou mode hors-ligne)

## 🛠️ Développement

### Prérequis

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/yourusername/crystal-launcher.git
cd crystal-launcher
npm install
```

### Lancer en mode développement

```bash
npm start
```

Cela démarre le serveur React (`localhost:3000`) et Electron simultanément.

### Construire une release

```bash
# Toutes les plateformes (si cross-platform toolchain installée)
npm run build

# Windows uniquement
npm run build:win

# macOS uniquement  
npm run build:mac

# Linux uniquement
npm run build:linux
```

Les builds sont générés dans le dossier `dist/`.

## ⚙️ Configuration de l'authentification Microsoft

Pour activer la connexion Microsoft officielle :

1. Créez une application Azure AD sur [portal.azure.com](https://portal.azure.com)
2. Dans **Authentication**, ajoutez la plateforme **Mobile and desktop applications**
3. Redirect URI : `https://login.microsoftonline.com/common/oauth2/nativeclient`
4. Notez votre **Application (client) ID**
5. Dans les paramètres du lanceur, entrez votre Client ID **ou** modifiez `src/main/main.js` :
   ```js
   const clientId = 'VOTRE_CLIENT_ID_AZURE';
   ```

> **Note** : L'application Azure doit avoir les permissions `XboxLive.signin` et `offline_access`.

## 📁 Structure du projet

```
crystal-launcher/
├── src/
│   ├── main/             # Processus principal Electron
│   │   ├── main.js       # Fenêtre, IPC handlers, lancement MC
│   │   └── preload.js    # Bridge sécurisé IPC ↔ renderer
│   └── renderer/         # Interface React
│       ├── App.js        # Router + Context global
│       ├── components/   # TitleBar, Sidebar
│       └── pages/        # HomePage, AccountsPage, VersionsPage…
├── public/               # index.html, icônes
├── package.json
└── README.md
```

## 🔧 Personnalisation

### Changer le nom et l'identité

Modifiez dans `package.json` :
```json
{
  "name": "mon-launcher",
  "build": {
    "appId": "com.monlauncher.app",
    "productName": "Mon Launcher"
  }
}
```

### Ajouter un fond personnalisé

Dans `HomePage.css`, modifiez `.launch-panel` :
```css
.launch-panel {
  background: url('./assets/background.jpg') center/cover;
}
```

### Couleur d'accent

Dans `index.css`, modifiez `--accent` :
```css
:root {
  --accent: #3fb950; /* vert Minecraft */
}
```

## 📦 Technologies

| Outil | Rôle |
|-------|------|
| [Electron](https://electronjs.org) | App desktop cross-platform |
| [React](https://react.dev) | Interface utilisateur |
| [minecraft-launcher-core](https://github.com/Pierce01/MinecraftLauncher-core) | Téléchargement et lancement MC |
| [electron-store](https://github.com/sindresorhus/electron-store) | Persistance des données |
| [MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js) | Auth Microsoft |

## 🐛 Problèmes connus

- L'authentification Microsoft nécessite un Azure Client ID valide
- Certains antivirus peuvent bloquer le lancement de Java (ajouter une exception)
- macOS : signer l'app avec un certificat Apple pour éviter les alertes Gatekeeper

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'feat: ajouter ma fonctionnalité'`)
4. Push sur la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT — voir [LICENSE](LICENSE)

## ⚠️ Avertissement légal

Crystal Launcher est un projet indépendant et n'est **pas affilié à Mojang Studios ou Microsoft**. Minecraft® est une marque déposée de Microsoft Corporation.

---

<div align="center">
Fait avec ❤️ et Electron
</div>
