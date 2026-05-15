import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  books: any[] = [];
  searchKeyword: string = '';
  loading: boolean = true;
  wishlistBusyId: number | null = null;
  showCheckoutModal = false;
  checkoutAddresses: any[] = [];
  selectedAddressId: number | null = null;
  selectedPaymentMode: 'COD' | 'WALLET' | 'ONLINE' = 'COD';
  buyNowBook: any = null;
  checkoutBusy = false;
  checkoutMessage = '';
  checkoutError = '';

  constructor(
    private bookService: BookService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading = true;
    this.bookService.getAllBooks().subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch() {
    if (this.searchKeyword.trim()) {
      this.loading = true;
      this.bookService.searchBooks(this.searchKeyword).subscribe({
        next: (data) => {
          this.books = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.loadBooks();
    }
  }

  buyNow(event: Event, book: any) {
    event.stopPropagation(); // Prevent navigation to details page

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.checkoutError = 'Unable to identify user session. Please login again.';
          return;
        }
        this.authService.getAddresses().subscribe({
          next: (addresses) => {
            if (!addresses || addresses.length === 0) {
              this.checkoutError = 'Please save an address in profile before placing an order.';
              this.router.navigate(['/profile']);
              return;
            }
            const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
            this.buyNowBook = book;
            this.checkoutAddresses = addresses;
            this.selectedAddressId = defaultAddress?.id ?? null;
            this.selectedPaymentMode = ((user.defaultPaymentMode || 'COD').toUpperCase() === 'WALLET') ? 'WALLET' : 'COD';
            this.checkoutError = '';
            this.showCheckoutModal = true;
          },
          error: () => (this.checkoutError = 'Unable to load saved addresses. Please try again.')
        });
      },
      error: () => (this.checkoutError = 'Unable to identify user session. Please login again.')
    });
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.checkoutBusy = false;
    this.buyNowBook = null;
    this.checkoutAddresses = [];
    this.selectedAddressId = null;
  }

  placeBuyNowOrder(): void {
    if (!this.buyNowBook || !this.selectedAddressId) {
      this.checkoutError = 'Please choose address and payment method.';
      return;
    }
    this.checkoutBusy = true;
    this.checkoutError = '';
    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.checkoutBusy = false;
          this.checkoutError = 'Unable to identify user session. Please login again.';
          return;
        }

        const selectedAddress = this.checkoutAddresses.find((a: any) => a.id === this.selectedAddressId);
        if (!selectedAddress) {
          this.checkoutBusy = false;
          this.checkoutError = 'Please select a valid address.';
          return;
        }

        const orderRequest = {
          userId: user.id,
          totalAmount: this.buyNowBook.price,
          paymentMode: this.selectedPaymentMode,
          addressId: selectedAddress.id,
          deliveryAddress: this.formatAddress(selectedAddress),
          orderedBooks: this.buyNowBook.title
        };

        if (this.selectedPaymentMode === 'ONLINE') {
          this.orderService.createRazorpayOrder(orderRequest).subscribe({
            next: (rp) => {
              this.openRazorpayCheckout(rp, this.buyNowBook.title);
            },
            error: () => {
              this.checkoutBusy = false;
              this.checkoutError = 'Unable to start online payment. Please try again.';
            }
          });
          return;
        }

        this.orderService.placeOrder(orderRequest).subscribe({
          next: () => {
            const placedBookTitle = this.buyNowBook.title;
            this.checkoutBusy = false;
            this.closeCheckoutModal();
            this.checkoutMessage = `Order placed for "${placedBookTitle}".`;
          },
          error: () => {
            if (this.selectedPaymentMode === 'WALLET') {
              const retryRequest = { ...orderRequest, paymentMode: 'COD' };
              this.orderService.placeOrder(retryRequest).subscribe({
                next: () => {
                  const placedBookTitle = this.buyNowBook.title;
                  this.checkoutBusy = false;
                  this.closeCheckoutModal();
                  this.checkoutMessage = `Wallet failed. Order placed for "${placedBookTitle}" with Cash on Delivery.`;
                },
                error: () => {
                  this.checkoutBusy = false;
                  this.checkoutError = 'Failed to place order. Please try again.';
                }
              });
              return;
            }
            this.checkoutBusy = false;
            this.checkoutError = 'Failed to place order. Please try again.';
          }
        });
      },
      error: () => {
        this.checkoutBusy = false;
        this.checkoutError = 'Unable to identify user session. Please login again.';
      }
    });
  }

  private openRazorpayCheckout(rp: any, bookTitle: string): void {
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      this.checkoutBusy = false;
      this.checkoutError = 'Razorpay SDK not loaded. Please refresh.';
      return;
    }

    const options: any = {
      key: rp.razorpayKeyId,
      amount: rp.amountInPaise,
      currency: rp.currency || 'INR',
      name: 'BookNest',
      description: `Payment for ${bookTitle}`,
      order_id: rp.razorpayOrderId,
      handler: (response: any) => {
        this.orderService.verifyRazorpayPayment({
          internalOrderId: rp.internalOrderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        }).subscribe({
          next: () => {
            this.checkoutBusy = false;
            this.closeCheckoutModal();
            this.checkoutMessage = `Payment successful. Order placed for "${bookTitle}".`;
          },
          error: () => {
            this.checkoutBusy = false;
            this.checkoutError = 'Payment verification failed. If money was deducted, please contact support.';
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.checkoutBusy = false;
          this.checkoutError = 'Payment cancelled.';
        }
      },
      theme: {
        color: '#6366f1'
      }
    };

    const instance = new RazorpayCtor(options);
    instance.open();
  }

  formatAddress(address: any): string {
    return [
      address.fullName,
      address.phone,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ]
      .filter(Boolean)
      .join(', ');
  }

  getSelectedAddressPreview(): string {
    const selected = this.checkoutAddresses.find((address: any) => address.id === this.selectedAddressId);
    return selected ? this.formatAddress(selected) : '';
  }

  addToWishlist(event: Event, book: any) {
    event.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.wishlistBusyId === book.id) return;
    this.wishlistBusyId = book.id;
    this.authService.addToWishlist(book.id).subscribe({
      next: () => {
        alert('Added to wishlist!');
        this.wishlistBusyId = null;
      },
      error: () => {
        alert('Already in wishlist (or failed).');
        this.wishlistBusyId = null;
      }
    });
  }
}
