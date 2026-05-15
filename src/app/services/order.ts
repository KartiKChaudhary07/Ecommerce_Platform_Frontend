import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  placeOrder(orderRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/place`, orderRequest);
  }

  createRazorpayOrder(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/razorpay/create`, payload);
  }

  verifyRazorpayPayment(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/razorpay/verify`, payload);
  }

  getOrderHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }

  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/id/${orderId}`);
  }

  payOrder(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/pay/${orderId}`, {});
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/status/${orderId}`, null, { params: { status } });
  }

  getUserOrders(): Observable<any[]> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.getOrderHistory(user.id);
  }
}
