# Interface Newsletter - Version Vanilla

Interface web **100% vanilla** pour le traitement de newsletters et données conseillers, sans aucune dépendance externe.

## 🚀 Fonctionnalités

- **Drag & Drop** pour les fichiers HTML et Excel
- **Validation** automatique des types de fichiers
- **Interface professionnelle** avec design sobre
- **JavaScript pur** sans framework
- **Responsive** design

## 📁 Structure

```
vanilla-interface/
├── index.html      # Page principale
├── style.css       # Styles CSS
├── app.js          # Logique JavaScript
└── README.md       # Documentation
```

## 🛠️ Installation

**Aucune installation requise !** L'interface fonctionne directement dans le navigateur.

### Option 1 : Serveur local simple
```bash
# Dans le dossier vanilla-interface
python -m http.server 8000
# Puis ouvrir http://localhost:8000
```

### Option 2 : Live Server (VS Code)
- Installer l'extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

### Option 3 : Double-clic
- Double-cliquer sur `index.html` pour l'ouvrir directement

## 🎯 Utilisation

### Étape 1 : Upload des fichiers
1. **Glissez-déposez** ou **cliquez** pour sélectionner :
   - Un fichier **HTML** (newsletter)
   - Un fichier **Excel** (données conseillers)
2. Cliquez sur **"Traiter les fichiers"**

### Étape 2 : Sélection du conseiller
1. Choisissez un conseiller dans la liste
2. Cliquez sur **"Continuer"**

### Étape 3 : Workflow (simulé)
- Les données sont sauvegardées dans `localStorage`
- Interface prête pour les étapes suivantes

## 🎨 Design

- **Palette sobre** : Blanc, bleu (#3498db), gris
- **Angles droits** : Pas de border-radius
- **Design professionnel** et moderne
- **Responsive** : S'adapte aux mobiles

## 🔧 Personnalisation

### Modifier les couleurs
Dans `style.css`, changer les variables CSS :
```css
.btn-primary {
    background: #3498db; /* Couleur principale */
}
```

### Ajouter des fonctionnalités
Dans `app.js`, étendre la classe `NewsletterInterface` :
```javascript
class NewsletterInterface {
    // Ajouter vos méthodes ici
}
```

## 📱 Compatibilité

- ✅ **Chrome** 60+
- ✅ **Firefox** 55+
- ✅ **Safari** 12+
- ✅ **Edge** 79+

## 🔄 Différences avec la version Flask

| Fonctionnalité | Version Flask | Version Vanilla |
|----------------|---------------|-----------------|
| Backend | Flask + Python | Aucun |
| Traitement fichiers | Réel | Simulé |
| Stockage | Fichiers système | localStorage |
| Dépendances | Python + packages | Aucune |
| Déploiement | Serveur requis | Navigateur uniquement |

## 🚀 Avantages de la version Vanilla

1. **Zéro dépendance** : Fonctionne partout
2. **Déploiement simple** : Juste des fichiers statiques
3. **Performance** : Rapide et léger
4. **Maintenance** : Code simple et direct
5. **Portabilité** : Fonctionne sur n'importe quel serveur web

## 🔮 Prochaines étapes

Pour compléter le workflow :
1. Créer les pages suivantes (resume.html, conseiller.html, final.html)
2. Implémenter la logique de génération de prompts
3. Ajouter la gestion des réponses utilisateur
4. Intégrer avec un vrai backend si nécessaire

---

**Interface créée avec ❤️ en JavaScript vanilla** 