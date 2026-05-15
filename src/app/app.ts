import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <video class="app-bg-video" autoplay muted loop playsinline>
      <source src="https://cdn.pixabay.com/video/2015/11/11/1310-145386665_tiny.mp4" type="video/mp4" />
    </video>
    <div class="app-bg-overlay"></div>

    <div class="app-shell">
      <app-navbar></app-navbar>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }

    .app-bg-video {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: -2;
      pointer-events: none;
      filter: saturate(1.05) brightness(0.6);
    }

    .app-bg-overlay {
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background: linear-gradient(
        180deg,
        rgba(15, 23, 42, 0.72) 0%,
        rgba(15, 23, 42, 0.6) 40%,
        rgba(15, 23, 42, 0.82) 100%
      );
    }

    .app-shell {
      position: relative;
      z-index: 1;
    }

    main {
      min-height: calc(100vh - 80px);
    }
  `]
})
export class AppComponent {}
