import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { BookService } from '../../services/book';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss'
})
export class BookDetailsComponent implements OnInit {
  book: any;
  loading: boolean = true;
  quantity: number = 1;
  wishlistBusy = false;

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.bookService.getBookById(id).subscribe({
      next: (data) => {
        this.book = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  addToCart() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          alert('Unable to identify user session. Please login again.');
          return;
        }
        this.cartService.addToCart(user.id, this.book.id, this.quantity).subscribe({
          next: () => alert('Added to cart!'),
          error: () => alert('Add to cart failed. Please try again.')
        });
      },
      error: () => alert('Unable to identify user session. Please login again.')
    });
  }

  addToWishlist() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.wishlistBusy) return;
    this.wishlistBusy = true;
    this.authService.addToWishlist(this.book.id).subscribe({
      next: () => {
        alert('Added to wishlist!');
        this.wishlistBusy = false;
      },
      error: () => {
        alert('Already in wishlist (or failed).');
        this.wishlistBusy = false;
      }
    });
  }
}
