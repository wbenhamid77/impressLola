import { Component, HostBinding, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'impressLola';

  @HostBinding('class') hostClass = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateHostClass(event.url);
      });

    // Initialiser avec la route actuelle
    this.updateHostClass(this.router.url);

    // Écouter les changements de sidebar
    const setMargin = () => {
      this.updateHostClass(this.router.url);
    };

    window.addEventListener('storage', setMargin);
    window.addEventListener('sidebar:toggle', setMargin as EventListener);
  }

  private updateHostClass(currentUrl: string): void {
    // Ne pas appliquer les classes sidebar sur les pages de login et register
    if (currentUrl === '/login' || currentUrl === '/register') {
      this.hostClass = '';
      return;
    }

    // Appliquer les classes sidebar pour les autres pages
    const collapsed = localStorage.getItem('sidebarCollapsed') === '1';
    this.hostClass = collapsed ? 'with-sidebar compact' : 'with-sidebar';
  }
}
