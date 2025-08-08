import { Injectable } from '@angular/core';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleMapService {
  private map: any = null;
  private marker: any = null;
  private mapInitialized = false;

  constructor() {}

  /**
   * Initialise une carte simple avec OpenStreetMap
   */
  initMap(containerId: string, options: {
    center?: { lat: number; lng: number };
    zoom?: number;
  } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
        zoom: 12
      };

      const mapOptions = { ...defaultOptions, ...options };

      try {
        const container = document.getElementById(containerId);
        if (!container) {
          reject(new Error(`Container ${containerId} not found`));
          return;
        }

        // Créer une carte simple avec OpenStreetMap
        this.createOpenStreetMap(container, mapOptions);
        
        // Simuler une carte interactive
        this.simulateInteractiveMap(container, mapOptions);
        
        resolve(this.map);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Crée une carte avec OpenStreetMap
   */
  private createOpenStreetMap(container: HTMLElement, options: any): void {
    const { center, zoom } = options;
    
    container.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
      ">
        <!-- Carte OpenStreetMap -->
        <iframe 
          src="https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.01},${center.lat-0.01},${center.lng+0.01},${center.lat+0.01}&layer=mapnik&marker=${center.lat},${center.lng}"
          style="
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 12px;
          "
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          title="Carte OpenStreetMap"
        ></iframe>
        
        <!-- Marqueur interactif -->
        <div class="custom-marker" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          width: 40px;
          height: 40px;
          cursor: pointer;
          z-index: 1000;
          pointer-events: none;
        ">
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #C1272D 0%, #E53E3E 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(193, 39, 45, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            animation: pulse 2s infinite;
          ">
            <i class="fas fa-map-marker-alt"></i>
          </div>
        </div>
        
        <!-- Contrôles de zoom -->
        <div style="
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          z-index: 1001;
        ">
          <button onclick="window.open('https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}&zoom=${zoom}', '_blank')" style="
            display: block;
            width: 36px;
            height: 36px;
            border: none;
            background: white;
            color: #4a5568;
            font-size: 16px;
            cursor: pointer;
            border-bottom: 1px solid #e2e8f0;
          " title="Ouvrir dans OpenStreetMap">🗺️</button>
          <button onclick="this.parentElement.parentElement.querySelector('iframe').src = this.parentElement.parentElement.querySelector('iframe').src" style="
            display: block;
            width: 36px;
            height: 36px;
            border: none;
            background: white;
            color: #4a5568;
            font-size: 16px;
            cursor: pointer;
          " title="Actualiser">🔄</button>
        </div>
        
        <!-- Informations de localisation -->
        <div style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          max-width: 250px;
        ">
          <div style="
            font-size: 12px;
            color: #718096;
            margin-bottom: 4px;
          ">Coordonnées actuelles :</div>
          <div style="
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2d3748;
            font-weight: 600;
          ">
            Lat: ${center.lat.toFixed(6)}<br>
            Lng: ${center.lng.toFixed(6)}
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles CSS pour l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Simule une carte interactive
   */
  private simulateInteractiveMap(container: HTMLElement, options: any): void {
    const mapDiv = container.querySelector('div') as HTMLElement;
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    
    if (mapDiv && iframe) {
      // Permettre le clic sur la carte pour centrer
      mapDiv.addEventListener('click', (e) => {
        const rect = mapDiv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculer les nouvelles coordonnées (approximation)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const deltaX = (x - centerX) / centerX * 0.01;
        const deltaY = (centerY - y) / centerY * 0.01;
        
        const newLat = options.center.lat + deltaY;
        const newLng = options.center.lng + deltaX;
        
        // Mettre à jour l'iframe
        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${newLng-0.01},${newLat-0.01},${newLng+0.01},${newLat+0.01}&layer=mapnik&marker=${newLat},${newLng}`;
        
        // Mettre à jour les coordonnées affichées
        const coordsDiv = container.querySelector('div[style*="position: absolute; bottom: 20px"]') as HTMLElement;
        if (coordsDiv) {
          const coordsText = coordsDiv.querySelector('div[style*="font-family: Courier New"]') as HTMLElement;
          if (coordsText) {
            coordsText.innerHTML = `Lat: ${newLat.toFixed(6)}<br>Lng: ${newLng.toFixed(6)}`;
          }
        }
        
        // Émettre un événement personnalisé
        const event = new CustomEvent('mapClicked', {
          detail: { lat: newLat, lng: newLng }
        });
        container.dispatchEvent(event);
      });
    }
  }

  /**
   * Ajoute un marqueur sur la carte
   */
  addMarker(location: MapLocation, options: {
    draggable?: boolean;
    title?: string;
  } = {}): any {
    // Le marqueur est déjà créé dans createOpenStreetMap
    return {
      setPosition: (position: any) => {
        // Mettre à jour la position du marqueur
        const marker = document.querySelector('.custom-marker') as HTMLElement;
        if (marker) {
          // Le marqueur reste au centre de la carte
          marker.style.top = '50%';
          marker.style.left = '50%';
        }
      },
      addListener: (event: string, callback: Function) => {
        // Écouter les événements de clic sur la carte
        if (event === 'dragend' || event === 'click') {
          const container = document.getElementById('map');
          if (container) {
            container.addEventListener('mapClicked', (e: any) => {
              callback({ target: { getPosition: () => ({ lat: () => e.detail.lat, lng: () => e.detail.lng }) } });
            });
          }
        }
      }
    };
  }

  /**
   * Centre la carte sur une position
   */
  centerOnLocation(lat: number, lng: number, zoom: number = 15): void {
    // Mettre à jour l'iframe OpenStreetMap
    const container = document.getElementById('map');
    if (container) {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
      }
      
      // Mettre à jour les coordonnées affichées
      const coordsDiv = container.querySelector('div[style*="position: absolute; bottom: 20px"]') as HTMLElement;
      if (coordsDiv) {
        const coordsText = coordsDiv.querySelector('div[style*="font-family: Courier New"]') as HTMLElement;
        if (coordsText) {
          coordsText.innerHTML = `Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`;
        }
      }
    }
  }

  /**
   * Recherche d'adresse (simulée)
   */
  async searchAddress(query: string): Promise<MapLocation[]> {
    // Simulation de recherche d'adresse
    return [
      {
        lat: 48.8566,
        lng: 2.3522,
        address: `${query}, Paris, France`
      }
    ];
  }

  /**
   * Obtient l'adresse à partir des coordonnées (simulé)
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
    // Simulation de reverse geocoding
    return `Adresse à ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Met à jour la position du marqueur
   */
  updateMarkerPosition(lat: number, lng: number, address?: string): void {
    const marker = this.addMarker({ lat, lng });
    marker.setPosition({ lat, lng });
  }

  /**
   * Nettoie la carte
   */
  destroy(): void {
    this.map = null;
    this.marker = null;
  }

  /**
   * Obtient la carte actuelle
   */
  getMap(): any {
    return this.map;
  }

  /**
   * Obtient le marqueur actuel
   */
  getMarker(): any {
    return this.marker;
  }
} 