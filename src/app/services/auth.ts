import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      this.currentUserSubject.next(parsedUser);
      const token = this.getToken();
      if (token && !parsedUser?.id) {
        this.getProfile().subscribe({
          next: (profile) => this.setSession(token, { ...parsedUser, ...profile }),
        });
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => this.setUser(response))
    );
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  updateUserEnabled(userId: number, enabled: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/enabled`, null, { params: { enabled } });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`);
  }

  googleLogin(): void {
    // OAuth2 must go directly to auth-service, not through the gateway
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  setSession(token: string, user?: any): void {
    localStorage.setItem('token', token);
    const fallbackUser = this.decodeUserFromToken(token);
    const resolvedUser = user || fallbackUser;
    localStorage.setItem('user', JSON.stringify(resolvedUser));
    this.currentUserSubject.next(resolvedUser);
  }

  private setUser(response: any): void {
    this.setSession(response.token, response.user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === 'ADMIN';
  }

  getCurrentUser(): any | null {
    const inMemory = this.currentUserSubject.value;
    if (inMemory) return inMemory;
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }

  resolveCurrentUser(): Observable<any | null> {
    const current = this.getCurrentUser();
    if (current?.id) {
      return of(current);
    }
    const token = this.getToken();
    if (!token) {
      return of(null);
    }
    return this.getProfile().pipe(
      tap((profile) => this.setSession(token, { ...current, ...profile }))
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profile);
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile/password`, { currentPassword, newPassword });
  }

  getWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/wishlist`);
  }

  addToWishlist(bookId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/wishlist/${bookId}`, null);
  }

  removeFromWishlist(bookId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/wishlist/${bookId}`);
  }

  getAddresses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/addresses`);
  }

  addAddress(address: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(addressId: number, address: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/addresses/${addressId}`, address);
  }

  deleteAddress(addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/addresses/${addressId}`);
  }

  setDefaultAddress(addressId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/addresses/${addressId}/default`, null);
  }

  private decodeUserFromToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        name: payload.sub,
        email: payload.sub,
        role: payload.role || 'USER'
      };
    } catch {
      return { name: 'User', email: '', role: 'USER' };
    }
  }
}
