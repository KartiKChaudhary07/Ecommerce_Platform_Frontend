import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;gap:1rem;">
      <div class="spinner" style="width:50px;height:50px;border:4px solid rgba(255,255,255,0.1);border-top-color:#6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div>
      <p style="color:#94a3b8;">Completing sign-in...</p>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class OAuth2RedirectComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      // Decode token payload to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = { name: payload.sub, email: payload.sub, role: payload.role || 'USER' };
        this.authService.setSession(token, user);
      } catch (e) {
        this.authService.setSession(token, { name: 'Google User', email: '', role: 'USER' });
      }
      this.router.navigate([this.authService.isAdmin() ? '/admin' : '/']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
