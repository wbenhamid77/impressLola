import { Directive, ElementRef, Input, OnInit, HostListener } from '@angular/core';

@Directive({
  selector: '[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective implements OnInit {
  @Input() fallbackSrc: string = '/assets/images/default-property.jpg';
  @Input() fallbackText: string = 'Image non disponible';
  @Input() fallbackIcon: string = 'fas fa-image';

  private originalSrc: string = '';
  private placeholder: HTMLElement | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.originalSrc = this.el.nativeElement.src;
    this.createPlaceholder();
  }

  @HostListener('error')
  onError() {
    this.showPlaceholder();
  }

  @HostListener('load')
  onLoad() {
    this.hidePlaceholder();
  }

  private createPlaceholder() {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'image-placeholder';
    this.placeholder.style.display = 'none';
    
    // Déterminer le type d'image basé sur les classes
    if (this.el.nativeElement.classList.contains('avatar-image')) {
      this.placeholder.classList.add('avatar-placeholder');
      this.placeholder.innerHTML = `
        <i class="fas fa-user"></i>
        <span>Avatar non disponible</span>
      `;
    } else if (this.el.nativeElement.classList.contains('thumbnail-image')) {
      this.placeholder.classList.add('thumbnail-placeholder');
      this.placeholder.innerHTML = `
        <i class="fas fa-image"></i>
        <span>Photo non disponible</span>
      `;
    } else if (this.el.nativeElement.classList.contains('modal-thumbnail-image')) {
      this.placeholder.classList.add('modal-thumbnail-placeholder');
      this.placeholder.innerHTML = `
        <i class="fas fa-image"></i>
        <span>Photo non disponible</span>
      `;
    } else {
      this.placeholder.innerHTML = `
        <i class="${this.fallbackIcon}"></i>
        <span>${this.fallbackText}</span>
      `;
    }

    // Insérer le placeholder après l'image
    this.el.nativeElement.parentNode?.insertBefore(this.placeholder, this.el.nativeElement.nextSibling);
  }

  private showPlaceholder() {
    if (this.placeholder) {
      this.el.nativeElement.style.display = 'none';
      this.placeholder.style.display = 'flex';
    }
  }

  private hidePlaceholder() {
    if (this.placeholder) {
      this.el.nativeElement.style.display = 'block';
      this.placeholder.style.display = 'none';
    }
  }
} 