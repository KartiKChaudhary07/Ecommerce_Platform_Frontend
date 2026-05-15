import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  getCart(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  addToCart(userId: number, bookId: number, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, null, {
      params: { userId, bookId, quantity }
    });
  }

  updateQuantity(userId: number, bookId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, null, {
      params: { userId, bookId, quantity }
    });
  }

  removeItem(userId: number, bookId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove`, {
      params: { userId, bookId }
    });
  }

  clearCart(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`, { params: { userId } });
  }
}
