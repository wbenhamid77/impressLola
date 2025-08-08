import { Injectable } from '@angular/core';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BasicMapService {
  private map: any = null;
  private marker: any = null;
  private mapInitialized = false;

  constructor() {}

  /**
   * Initialise une carte basique sans API externe
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

        // Créer une carte basique
        this.createBasicMap(container, mapOptions);
        
        resolve(this.map);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Crée une carte basique avec une grille interactive
   */
  private createBasicMap(container: HTMLElement, options: any): void {
    const { center } = options;
    
    container.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        cursor: crosshair;
      ">
        <!-- Grille de la carte -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.3;
        "></div>
        
        <!-- Points de référence -->
        <div style="
          position: absolute;
          top: 20%;
          left: 20%;
          width: 8px;
          height: 8px;
          background: #C1272D;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        " title="Point de référence"></div>
        
        <div style="
          position: absolute;
          top: 60%;
          left: 70%;
          width: 8px;
          height: 8px;
          background: #C1272D;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        " title="Point de référence"></div>
        
        <div style="
          position: absolute;
          top: 40%;
          left: 40%;
          width: 8px;
          height: 8px;
          background: #C1272D;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        " title="Point de référence"></div>
        
        <!-- Marqueur principal -->
        <div class="main-marker" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          width: 50px;
          height: 50px;
          cursor: move;
          z-index: 1000;
        ">
          <div style="
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #C1272D 0%, #E53E3E 100%);
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 6px 20px rgba(193, 39, 45, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            animation: pulse 2s infinite;
            position: relative;
          ">
            <i class="fas fa-map-marker-alt"></i>
            <!-- Ombre portée -->
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 20px;
              height: 8px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              filter: blur(2px);
            "></div>
          </div>
        </div>
        
        <!-- Contrôles -->
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
          <button onclick="this.parentElement.parentElement.style.transform = 'scale(1.1)';" style="
            display: block;
            width: 40px;
            height: 40px;
            border: none;
            background: white;
            color: #4a5568;
            font-size: 18px;
            cursor: pointer;
            border-bottom: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          " title="Zoom +" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">+</button>
          <button onclick="this.parentElement.parentElement.style.transform = 'scale(0.9)';" style="
            display: block;
            width: 40px;
            height: 40px;
            border: none;
            background: white;
            color: #4a5568;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s ease;
          " title="Zoom -" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">-</button>
        </div>
        
        <!-- Informations de localisation -->
        <div style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          max-width: 280px;
          backdrop-filter: blur(10px);
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          ">
            <i class="fas fa-map-marker-alt" style="color: #C1272D; font-size: 16px;"></i>
            <div style="
              font-size: 14px;
              color: #2d3748;
              font-weight: 600;
            ">Localisation sélectionnée</div>
          </div>
          <div style="
            font-size: 12px;
            color: #718096;
            margin-bottom: 8px;
          ">Coordonnées :</div>
          <div style="
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2d3748;
            font-weight: 600;
            background: #f7fafc;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          ">
            Lat: ${center.lat.toFixed(6)}<br>
            Lng: ${center.lng.toFixed(6)}
          </div>
          <div style="
            font-size: 11px;
            color: #a0aec0;
            margin-top: 8px;
            font-style: italic;
          ">
            Cliquez sur la carte ou déplacez le marqueur
          </div>
        </div>
        
        <!-- Instructions -->
        <div style="
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          max-width: 200px;
          backdrop-filter: blur(10px);
        ">
          <div style="
            font-size: 12px;
            color: #718096;
            font-weight: 500;
          ">
            <i class="fas fa-info-circle" style="color: #C1272D; margin-right: 4px;"></i>
            Carte interactive
          </div>
          <div style="
            font-size: 11px;
            color: #a0aec0;
            margin-top: 4px;
          ">
            Cliquez pour placer le marqueur
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles CSS pour l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    // Ajouter l'interactivité
    this.addInteractivity(container);
  }

  /**
   * Ajoute l'interactivité à la carte
   */
  private addInteractivity(container: HTMLElement): void {
    const mapDiv = container.querySelector('div') as HTMLElement;
    const marker = container.querySelector('.main-marker') as HTMLElement;
    
    if (mapDiv && marker) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      // Permettre le déplacement du marqueur
      marker.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = marker.offsetLeft;
        startTop = marker.offsetTop;
        marker.style.cursor = 'grabbing';
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          marker.style.left = (startLeft + deltaX) + 'px';
          marker.style.top = (startTop + deltaY) + 'px';
          
          // Mettre à jour les coordonnées
          this.updateCoordinates(container, startLeft + deltaX, startTop + deltaY);
        }
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          marker.style.cursor = 'move';
          
          // Émettre un événement personnalisé
          const event = new CustomEvent('markerMoved', {
            detail: { 
              lat: 48.8566 + (250 - marker.offsetTop) * 0.001,
              lng: 2.3522 + (marker.offsetLeft - 250) * 0.001
            }
          });
          container.dispatchEvent(event);
        }
      });

      // Permettre le clic sur la carte pour placer le marqueur
      mapDiv.addEventListener('click', (e) => {
        if (!isDragging) {
          const rect = mapDiv.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          marker.style.left = (x - 25) + 'px';
          marker.style.top = (y - 50) + 'px';
          
          // Mettre à jour les coordonnées
          this.updateCoordinates(container, x - 25, y - 50);
          
          // Émettre un événement personnalisé
          const event = new CustomEvent('markerMoved', {
            detail: { 
              lat: 48.8566 + (250 - (y - 50)) * 0.001,
              lng: 2.3522 + ((x - 25) - 250) * 0.001
            }
          });
          container.dispatchEvent(event);
          
          // Émettre aussi un événement dragend pour compatibilité
          const dragEvent = new CustomEvent('markerDragEnd', {
            detail: { 
              lat: 48.8566 + (250 - (y - 50)) * 0.001,
              lng: 2.3522 + ((x - 25) - 250) * 0.001
            }
          });
          container.dispatchEvent(dragEvent);
        }
      });
    }
  }

  /**
   * Met à jour l'affichage des coordonnées
   */
  private updateCoordinates(container: HTMLElement, x: number, y: number): void {
    const coordsDiv = container.querySelector('div[style*="font-family: Courier New"]') as HTMLElement;
    if (coordsDiv) {
      const lat = 48.8566 + (250 - y) * 0.001;
      const lng = 2.3522 + (x - 250) * 0.001;
      coordsDiv.innerHTML = `Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`;
    }
  }

  /**
   * Ajoute un marqueur sur la carte
   */
  addMarker(location: MapLocation, options: {
    draggable?: boolean;
    title?: string;
  } = {}): any {
    // Le marqueur est déjà créé dans createBasicMap
    return {
      setPosition: (position: any) => {
        // Mettre à jour la position du marqueur
        const marker = document.querySelector('.main-marker') as HTMLElement;
        if (marker) {
          // Convertir les coordonnées en pixels (approximation)
          const x = 250 + (position.lng - 2.3522) * 100000;
          const y = 250 - (position.lat - 48.8566) * 100000;
          
          marker.style.left = (x - 25) + 'px';
          marker.style.top = (y - 50) + 'px';
          
          // Mettre à jour les coordonnées affichées
          const container = document.getElementById('map');
          if (container) {
            this.updateCoordinates(container, x - 25, y - 50);
          }
        }
      },
      getPosition: () => {
        // Retourner la position actuelle du marqueur
        const marker = document.querySelector('.main-marker') as HTMLElement;
        if (marker) {
          const x = marker.offsetLeft + 25;
          const y = marker.offsetTop + 50;
          const lat = 48.8566 + (250 - y) * 0.001;
          const lng = 2.3522 + (x - 250) * 0.001;
          return { lat: () => lat, lng: () => lng };
        }
        return { lat: () => 48.8566, lng: () => 2.3522 };
      },
      addListener: (event: string, callback: Function) => {
        // Écouter les événements de déplacement
        if (event === 'dragend' || event === 'click') {
          const container = document.getElementById('map');
          if (container) {
            container.addEventListener('markerMoved', (e: any) => {
              callback({ target: { getPosition: () => ({ lat: () => e.detail.lat, lng: () => e.detail.lng }) } });
            });
            container.addEventListener('markerDragEnd', (e: any) => {
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
    // Mettre à jour la position du marqueur
    const marker = this.addMarker({ lat, lng });
    marker.setPosition({ lat, lng });
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