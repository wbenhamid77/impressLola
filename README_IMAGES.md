# Guide d'Utilisation des Images

## 🖼️ Comment Ajouter des Images à une Annonce

### **1. Via le Formulaire d'Ajout d'Annonce**

1. **Accédez au formulaire** : Dashboard → Ajouter une annonce
2. **Section Images** : Trouvez la section "Images du logement"
3. **Upload des images** :
   - **Glisser-déposer** : Glissez vos images dans la zone
   - **Clic pour sélectionner** : Cliquez sur la zone pour ouvrir l'explorateur
4. **Validation** :
   - Formats acceptés : JPG, PNG, GIF
   - Taille maximale : 5MB par image
   - Nombre maximum : 10 images

### **2. Affichage des Images**

Les images sont automatiquement :
- ✅ **Converties en base64** : Stockage sécurisé dans la base de données
- ✅ **Affichées dans les détails** : Galerie avec image principale et secondaires
- ✅ **Responsive** : Adaptation mobile/desktop
- ✅ **Gestion d'erreur** : Placeholder si image non trouvée

### **3. Formats Supportés**

```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // Base64
    "C:\\Users\\...\\image.png", // Chemin local (non recommandé)
    "https://example.com/image.jpg" // URL externe
  ]
}
```

### **4. Bonnes Pratiques**

- ✅ **Utilisez des images de qualité** : Résolution recommandée 1200x800px
- ✅ **Optimisez la taille** : Compressez avant upload (max 5MB)
- ✅ **Ajoutez au moins une image principale** : Pour attirer les locataires
- ✅ **Utilisez des formats web** : JPG pour photos, PNG pour graphiques

### **5. Résolution des Problèmes**

**Problème** : "Cannot GET /image.png"
**Solution** : Les images sont maintenant stockées en base64, plus de problème de CORS

**Problème** : Images qui ne s'affichent pas
**Solution** : Vérifiez que les images sont bien uploadées via le formulaire

**Problème** : Images trop lentes à charger
**Solution** : Optimisez la taille des images avant upload

## 🎯 Avantages du Système

- ✅ **Sécurisé** : Pas d'accès direct aux fichiers système
- ✅ **Portable** : Images stockées dans la base de données
- ✅ **Rapide** : Chargement direct sans serveur intermédiaire
- ✅ **Compatible** : Fonctionne sur tous les navigateurs 