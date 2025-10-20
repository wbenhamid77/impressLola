import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageCache = new Map<string, string>();

  constructor() { }

  /**
   * Obtient le chemin complet de l'image avec gestion du cache
   * @param imagePath Chemin de l'image ou nom du fichier
   * @returns URL complète de l'image
   */
  getImagePath(imagePath: string | undefined): string {
    if (!imagePath) {
      return '/assets/images/morocco-can2025/morocco-flag.png';
    }

    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      this.imageCache.set(imagePath, imagePath);
      return imagePath;
    }
    
    // Si c'est un chemin de fichier local
    if (imagePath.startsWith('/')) {
      this.imageCache.set(imagePath, imagePath);
      return imagePath;
    }
    
    // Si c'est une image base64
    if (imagePath.startsWith('data:image/')) {
      this.imageCache.set(imagePath, imagePath);
      return imagePath;
    }
    
    // Si c'est un chemin Windows
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      const convertedPath = `file:///${imagePath.replace(/\\/g, '/')}`;
      this.imageCache.set(imagePath, convertedPath);
      return convertedPath;
    }
    
    // Essayer l'API locale d'abord
    const apiPath = `http://localhost:8080/api/images/${imagePath}`;
    this.imageCache.set(imagePath, apiPath);
    return apiPath;
  }

  /**
   * Gère les erreurs de chargement d'images
   * @param event Event d'erreur de l'image
   */
  onImageError(event: Event): void {
    console.log('Erreur de chargement d\'image, utilisation de l\'icône par défaut');
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      // Trouver le div de fallback et l'afficher
      const fallbackDiv = img.nextElementSibling as HTMLElement;
      if (fallbackDiv) {
        fallbackDiv.style.display = 'flex';
      }
    }
  }

  /**
   * Gère le chargement réussi des images
   * @param event Event de chargement de l'image
   */
  onImageLoad(event: Event): void {
    console.log('Image chargée avec succès');
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'block';
      // Cacher le div de fallback s'il existe
      const fallbackDiv = img.nextElementSibling as HTMLElement;
      if (fallbackDiv) {
        fallbackDiv.style.display = 'none';
      }
    }
  }

  /**
   * Vide le cache des images
   */
  clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Préchage une image pour améliorer les performances
   * @param imagePath Chemin de l'image à précharger
   */
  preloadImage(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Erreur de chargement de l'image: ${imagePath}`));
      img.src = this.getImagePath(imagePath);
    });
  }
}
