# 🎨 Système de Design Professionnel Marocain - CAN 2025

## 📋 Vue d'ensemble

Ce système de design unifié offre une expérience utilisateur cohérente et professionnelle pour l'application CAN 2025. Il combine l'élégance du design marocain avec les meilleures pratiques UX/UI modernes.

## 🎯 Objectifs

- **Cohérence** : Design uniforme à travers tous les composants
- **Professionnalisme** : Interface moderne et crédible
- **Accessibilité** : Respect des standards WCAG
- **Performance** : CSS optimisé et réutilisable
- **Responsive** : Adaptation parfaite à tous les écrans

## 🏗️ Architecture

```
src/app/styles/
├── variables.css          # Variables CSS globales
├── components.css         # Composants réutilisables
└── globals.css           # Styles globaux et utilitaires
```

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Maroc Rouge** : `#C1272D` - Couleur principale, actions importantes
- **Maroc Vert** : `#006233` - Couleur secondaire, succès
- **Maroc Dor** : `#D4AF37` - Accent, highlights
- **Maroc Ocre** : `#CD853F` - Accent secondaire
- **Maroc Bleu** : `#1E3A8A` - Informations, liens

### Couleurs Neutres
- **Blanc** : `#FFFFFF` - Arrière-plans, texte sur fond coloré
- **Gris 50** : `#F9FAFB` - Arrière-plan principal
- **Gris 100** : `#F3F4F6` - Bordures légères
- **Gris 200** : `#E5E7EB` - Bordures
- **Gris 500** : `#6B7280` - Texte secondaire
- **Gris 900** : `#111827` - Texte principal

### Couleurs Sémantiques
- **Succès** : `#10B981` - Confirmations, validations
- **Avertissement** : `#F59E0B` - Alertes, notifications
- **Erreur** : `#EF4444` - Erreurs, problèmes
- **Info** : `#3B82F6` - Informations, liens

## 🔤 Typographie

### Familles de Polices
- **Sans-serif** : `Inter` - Texte principal, interface
- **Serif** : `Georgia` - Titres, contenu éditorial
- **Monospace** : `SF Mono` - Code, données techniques

### Hiérarchie des Tailles
- **XS** : `0.75rem` (12px) - Labels, annotations
- **SM** : `0.875rem` (14px) - Texte petit
- **Base** : `1rem` (16px) - Texte principal
- **LG** : `1.125rem` (18px) - Sous-titres
- **XL** : `1.25rem` (20px) - Titres de section
- **2XL** : `1.5rem` (24px) - Titres moyens
- **3XL** : `1.875rem` (30px) - Titres grands
- **4XL** : `2.25rem` (36px) - Titres très grands
- **5XL** : `3rem` (48px) - Titres principaux
- **6XL** : `3.75rem` (60px) - Titres héro

### Poids des Polices
- **Light** : 300 - Texte léger
- **Normal** : 400 - Texte standard
- **Medium** : 500 - Texte moyen
- **Semibold** : 600 - Titres, éléments importants
- **Bold** : 700 - Titres principaux
- **Extrabold** : 800 - Titres héro

## 📏 Espacement

### Système d'Échelle
- **XS** : `0.25rem` (4px) - Espacement minimal
- **SM** : `0.5rem` (8px) - Espacement petit
- **MD** : `1rem` (16px) - Espacement standard
- **LG** : `1.5rem` (24px) - Espacement moyen
- **XL** : `2rem` (32px) - Espacement grand
- **2XL** : `3rem` (48px) - Espacement très grand
- **3XL** : `4rem` (64px) - Espacement énorme
- **4XL** : `6rem` (96px) - Espacement maximum

## 🔲 Rayons de Bordure

- **None** : `0` - Pas de bordure arrondie
- **SM** : `0.125rem` (2px) - Bordure légère
- **MD** : `0.375rem` (6px) - Bordure standard
- **LG** : `0.5rem` (8px) - Bordure moyenne
- **XL** : `0.75rem` (12px) - Bordure grande
- **2XL** : `1rem` (16px) - Bordure très grande
- **3XL** : `1.5rem` (24px) - Bordure énorme
- **Full** : `9999px` - Bordure circulaire

## 🌈 Dégradés

### Dégradés Principaux
- **Primary** : Rouge marocain → Vert marocain
- **Secondary** : Dor marocain → Ocre marocain
- **Accent** : Bleu marocain → Rouge marocain
- **Light** : Gris 50 → Gris 100

## 📱 Composants

### Cartes
```css
.card {
  background: var(--white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  transition: all var(--transition-normal);
}
```

### Boutons
```css
.btn-primary {
  background: var(--gradient-primary);
  color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  font-weight: var(--font-weight-semibold);
}
```

### Formulaires
```css
.form-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}
```

## 🎭 Animations

### Transitions
- **Fast** : `150ms` - Interactions rapides
- **Normal** : `250ms` - Transitions standard
- **Slow** : `350ms` - Animations lentes
- **Slower** : `500ms` - Animations très lentes

### Keyframes
- **fadeIn** : Apparition en fondu
- **slideInLeft/Right** : Glissement latéral
- **scaleIn** : Apparition en zoom
- **float** : Flottement vertical
- **pulse** : Pulsation

## 📱 Responsive Design

### Breakpoints
- **SM** : `640px` - Mobile large
- **MD** : `768px` - Tablette
- **LG** : `1024px` - Desktop petit
- **XL** : `1280px` - Desktop moyen
- **2XL** : `1536px` - Desktop large

### Classes Utilitaires
- `.d-sm-none` : Masqué sur mobile
- `.d-lg-flex` : Flexbox sur desktop
- `.col-6` : 50% de largeur
- `.col-12` : 100% de largeur

## 🎨 Classes Utilitaires

### Couleurs
- `.text-primary` : Texte rouge marocain
- `.bg-secondary` : Fond vert marocain
- `.border-success` : Bordure verte

### Espacement
- `.mt-4` : Marge supérieure
- `.pb-2` : Padding inférieur
- `.px-3` : Padding horizontal

### Layout
- `.d-flex` : Display flexbox
- `.justify-center` : Centrage horizontal
- `.items-center` : Centrage vertical

## 🚀 Utilisation

### 1. Import des Styles
```css
@import url('./app/styles/variables.css');
@import url('./app/styles/components.css');
```

### 2. Utilisation des Variables
```css
.my-component {
  background: var(--gradient-primary);
  color: var(--white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-2xl);
}
```

### 3. Classes Utilitaires
```html
<div class="card p-4 m-2">
  <h2 class="text-primary mb-3">Titre</h2>
  <button class="btn btn-primary">Action</button>
</div>
```

## 🔧 Personnalisation

### Ajout de Nouvelles Couleurs
```css
:root {
  --custom-color: #FF6B6B;
  --custom-gradient: linear-gradient(135deg, var(--custom-color) 0%, #4ECDC4 100%);
}
```

### Création de Nouveaux Composants
```css
.custom-component {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
}
```

## 📚 Ressources

### Outils de Design
- **Figma** : Maquettes et prototypes
- **Adobe Color** : Palette de couleurs
- **Coolors** : Générateur de palettes

### Documentation
- **CSS Variables** : MDN Web Docs
- **Design Systems** : Design System Handbook
- **Accessibility** : WCAG Guidelines

## 🤝 Contribution

### Standards de Code
- Utiliser les variables CSS existantes
- Respecter la hiérarchie des composants
- Tester sur tous les breakpoints
- Vérifier l'accessibilité

### Processus
1. Créer une branche feature
2. Implémenter les changements
3. Tester sur différents appareils
4. Créer une pull request
5. Code review et validation

## 📝 Changelog

### Version 1.0.0 (2025-01-XX)
- ✅ Système de variables CSS
- ✅ Composants de base
- ✅ Classes utilitaires
- ✅ Responsive design
- ✅ Animations et transitions

---

**Maintenu par** : Équipe de développement CAN 2025  
**Dernière mise à jour** : Janvier 2025  
**Version** : 1.0.0 