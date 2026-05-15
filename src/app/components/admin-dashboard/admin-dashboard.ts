import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ReviewService } from '../../services/review';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  books: any[] = [];
  orders: any[] = [];
  users: any[] = [];
  reviews: any[] = [];

  selectedTab: 'books' | 'inventory' | 'orders' | 'users' | 'analytics' | 'reviews' = 'books';
  editingBookId: number | null = null;
  loading = false;

  newBook: any = this.emptyBook();
  analytics = {
    totalSales: 0,
    totalOrders: 0,
    outOfStock: 0,
    topSellingBooks: [] as any[],
    categoryBreakdown: [] as { category: string; count: number }[]
  };

  constructor(
    private bookService: BookService,
    private orderService: OrderService,
    private authService: AuthService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.loadBooks();
    this.loadOrders();
    this.loadUsers();
    this.loadReviews();
  }

  loadBooks(): void {
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.calculateAnalytics();
      },
      error: () => this.loading = false
    });
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.calculateAnalytics();
      },
      error: () => this.loading = false
    });
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => this.loading = false
    });
  }

  loadReviews(): void {
    this.reviewService.getAllReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  submitBook(): void {
    if (this.editingBookId) {
      this.bookService.updateBook(this.editingBookId, this.newBook).subscribe({
        next: () => {
          this.resetBookForm();
          this.loadBooks();
        }
      });
      return;
    }

    this.bookService.addBook(this.newBook).subscribe({
      next: () => {
        this.resetBookForm();
        this.loadBooks();
      }
    });
  }

  editBook(book: any): void {
    this.editingBookId = book.id;
    this.newBook = { ...book };
  }

  removeBook(bookId: number): void {
    this.bookService.deleteBook(bookId).subscribe({
      next: () => this.loadBooks()
    });
  }

  markOutOfStock(book: any): void {
    const payload = { ...book, stock: 0 };
    this.bookService.updateBook(book.id, payload).subscribe({
      next: () => this.loadBooks()
    });
  }

  changeOrderStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => this.loadOrders()
    });
  }

  toggleUserStatus(user: any): void {
    this.authService.updateUserEnabled(user.id, !user.enabled).subscribe({
      next: () => this.loadUsers()
    });
  }

  removeUser(userId: number): void {
    this.authService.deleteUser(userId).subscribe({
      next: () => this.loadUsers()
    });
  }

  updateReviewApproval(review: any, approved: boolean): void {
    this.reviewService.updateApproval(review.id, approved).subscribe({
      next: () => this.loadReviews()
    });
  }

  removeReview(reviewId: number): void {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => this.loadReviews()
    });
  }

  resetBookForm(): void {
    this.editingBookId = null;
    this.newBook = this.emptyBook();
  }

  private calculateAnalytics(): void {
    const nonCancelledOrders = this.orders.filter((order) => order.status !== 'CANCELLED');
    const totalSales = nonCancelledOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    const outOfStock = this.books.filter((book) => Number(book.stock) <= 0).length;
    const categoryCount = new Map<string, number>();

    for (const book of this.books) {
      const key = book.category || 'Uncategorized';
      categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
    }

    this.analytics = {
      totalSales,
      totalOrders: this.orders.length,
      outOfStock,
      topSellingBooks: [...this.books]
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 5),
      categoryBreakdown: Array.from(categoryCount.entries()).map(([category, count]) => ({
        category,
        count
      }))
    };
  }

  private emptyBook(): any {
    return {
      title: '',
      author: '',
      price: 0,
      stock: 0,
      description: '',
      category: '',
      imageUrl: ''
    };
  }
}
