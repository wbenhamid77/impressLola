import { Component, HostBinding, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'impressLola';

  @HostBinding('class') hostClass = 'with-sidebar compact';

  ngOnInit(): void {
    const setMargin = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === '1';
      this.hostClass = collapsed ? 'with-sidebar compact' : 'with-sidebar';
    };

    setMargin();
    window.addEventListener('storage', setMargin);
    window.addEventListener('sidebar:toggle', setMargin as EventListener);
  }
}
