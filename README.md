# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Déploiement continu (CI/CD) via GitHub Actions → SSH

Ce projet est configuré pour builder l'application et déployer le contenu de `dist/` sur un serveur distant via SSH à chaque push sur la branche `master`.

### 1) Secrets à configurer dans le dépôt GitHub (Settings → Secrets and variables → Actions)

- `SSH_HOST` : nom de domaine ou IP du serveur (ex. `example.com`).
- `SSH_USER` : utilisateur SSH sur le serveur (ex. `deploy`).
- `SSH_PRIVATE_KEY` : clé privée au format OpenSSH correspondant à la clé publique autorisée sur le serveur (évitez les passphrases pour l'automatisation).
- `SSH_PORT` : port SSH (optionnel, défaut `22`).
- `DEPLOY_PATH` : chemin distant cible où publier les fichiers (ex. `/var/www/beh`).
- `POST_DEPLOY_CMD` : commande distante optionnelle exécutée après le déploiement (ex. `sudo systemctl reload nginx`).

### 2) Préparation côté serveur

- Ajoutez la clé publique correspondante à `~/.ssh/authorized_keys` pour l'utilisateur défini par `SSH_USER`.
- Assurez-vous que `DEPLOY_PATH` existe et que l'utilisateur a les droits d'écriture.
- Si vous servez des fichiers statiques, configurez votre serveur web (Nginx/Apache) pour pointer sur ce répertoire.

### 3) Déclencheur

Le workflow s'exécute sur tout `push` vers `master`. Si votre branche par défaut est `main`, modifiez `on.push.branches` dans `.github/workflows/deploy.yml`.

### 4) Ce que fait le workflow

1. Checkout du code
2. Installation des dépendances (`npm ci`)
3. Build (`npm run build`) → génère `dist/`
4. Déploiement de `dist/` vers le serveur via `rsync` sur SSH
5. Exécution éventuelle d'une commande de post-déploiement

