import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getAllReviews(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  updateApproval(reviewId: number, approved: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${reviewId}/approval`, null, { params: { approved } });
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }
}
