import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BookService } from '../../services/book';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class WishlistComponent implements OnInit {
  loading = true;
  items: any[] = [];
  booksById = new Map<number, any>();

  constructor(private authService: AuthService, private bookService: BookService) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.authService.getWishlist().subscribe({
      next: (items) => {
        this.items = items || [];
        this.prefetchBooks();
      },
      error: () => (this.loading = false),
    });
  }

  remove(bookId: number): void {
    this.authService.removeFromWishlist(bookId).subscribe({
      next: () => this.loadWishlist(),
    });
  }

  private prefetchBooks(): void {
    if (this.items.length === 0) {
      this.loading = false;
      return;
    }

    let remaining = this.items.length;
    for (const item of this.items) {
      this.bookService.getBookById(item.bookId).subscribe({
        next: (book) => this.booksById.set(item.bookId, book),
        complete: () => {
          remaining -= 1;
          if (remaining <= 0) this.loading = false;
        },
        error: () => {
          remaining -= 1;
          if (remaining <= 0) this.loading = false;
        },
      });
    }
  }
}

