import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { OrderService } from '../../services/order';
import { BookService } from '../../services/book';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent implements OnInit {
  cart: any = null;
  loading: boolean = true;
  checkoutAddresses: any[] = [];
  selectedAddressId: number | null = null;
  selectedPaymentMode: 'COD' | 'WALLET' | 'ONLINE' = 'COD';
  showCheckoutModal = false;
  checkoutBusy = false;
  checkoutMessage = '';
  checkoutError = '';
  bookNameMap: Record<number, string> = {};

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.loading = false;
          return;
        }
        this.cartService.getCart(user.id).subscribe({
          next: (data) => {
            this.cart = data;
            this.loadBookNames(data?.items || []);
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => (this.loading = false)
    });
  }

  updateQuantity(bookId: number, quantity: number) {
    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) return;
        this.cartService.updateQuantity(user.id, bookId, quantity).subscribe(() => this.loadCart());
      }
    });
  }

  removeItem(bookId: number) {
    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) return;
        this.cartService.removeItem(user.id, bookId).subscribe(() => this.loadCart());
      }
    });
  }

  getTotal() {
    return this.cart?.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  }

  checkout() {
    this.authService.resolveCurrentUser().subscribe({
      next: (user) => {
        if (!user?.id) {
          this.checkoutError = 'Unable to identify user session. Please login again.';
          return;
        }
        this.authService.getAddresses().subscribe({
          next: (addresses) => {
            if (!addresses || addresses.length === 0) {
              this.checkoutError = 'Please save an address in profile before checkout.';
              this.router.navigate(['/profile']);
              return;
            }
            const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
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
    this.checkoutAddresses = [];
    this.selectedAddressId = null;
  }

  placeCartOrder(): void {
    if (!this.selectedAddressId) {
      this.checkoutError = 'Please select a delivery address.';
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
          totalAmount: this.getTotal(),
          paymentMode: this.selectedPaymentMode,
          addressId: selectedAddress.id,
          deliveryAddress: this.formatAddress(selectedAddress),
          orderedBooks: this.getOrderedBookNames()
        };

        if (this.selectedPaymentMode === 'ONLINE') {
          this.orderService.createRazorpayOrder(orderRequest).subscribe({
            next: (rp) => {
              this.openRazorpayCheckout(rp);
            },
            error: () => {
              this.checkoutBusy = false;
              this.checkoutError = 'Unable to start online payment. Please try again.';
            }
          });
          return;
        }

        this.orderService
          .placeOrder(orderRequest)
          .pipe(switchMap(() => this.cartService.clearCart(user.id)))
          .subscribe({
            next: () => {
              const bookNames = this.getOrderedBookNames();
              this.checkoutBusy = false;
              this.closeCheckoutModal();
              this.checkoutMessage = `Order placed for: ${bookNames}.`;
              this.loadCart();
            },
            error: () => {
              if (this.selectedPaymentMode === 'WALLET') {
                const retryRequest = { ...orderRequest, paymentMode: 'COD' };
                this.orderService
                  .placeOrder(retryRequest)
                  .pipe(switchMap(() => this.cartService.clearCart(user.id)))
                  .subscribe({
                    next: () => {
                      const bookNames = this.getOrderedBookNames();
                      this.checkoutBusy = false;
                      this.closeCheckoutModal();
                      this.checkoutMessage = `Wallet failed. Order placed for: ${bookNames} with Cash on Delivery.`;
                      this.loadCart();
                    },
                    error: () => {
                      this.checkoutBusy = false;
                      this.checkoutError = 'Checkout failed. Please try again.';
                    }
                  });
                return;
              }
              this.checkoutBusy = false;
              this.checkoutError = 'Checkout failed. Please try again.';
            }
          });
      },
      error: () => {
        this.checkoutBusy = false;
        this.checkoutError = 'Unable to identify user session. Please login again.';
      }
    });
  }

  private openRazorpayCheckout(rp: any): void {
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      this.checkoutBusy = false;
      this.checkoutError = 'Razorpay SDK not loaded. Please refresh.';
      return;
    }

    const bookNames = this.getOrderedBookNames();
    const options: any = {
      key: rp.razorpayKeyId,
      amount: rp.amountInPaise,
      currency: rp.currency || 'INR',
      name: 'BookNest',
      description: `Payment for ${bookNames}`,
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
            this.checkoutMessage = `Payment successful. Order placed for: ${bookNames}.`;
            this.loadCart();
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

  private formatAddress(address: any): string {
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

  getBookTitle(bookId: number): string {
    return this.bookNameMap[bookId] || `Book #${bookId}`;
  }

  private loadBookNames(items: any[]): void {
    const uniqueIds = [...new Set((items || []).map((item: any) => Number(item.bookId)).filter(Boolean))];
    if (uniqueIds.length === 0) {
      this.bookNameMap = {};
      return;
    }
    forkJoin(
      uniqueIds.map((id) =>
        this.bookService.getBookById(id).pipe(
          map((book) => ({ id, title: book?.title || `Book #${id}` })),
          catchError(() => of({ id, title: `Book #${id}` }))
        )
      )
    ).subscribe({
      next: (entries: Array<{ id: number; title: string }>) => {
        this.bookNameMap = entries.reduce((acc: Record<number, string>, item) => {
          acc[item.id] = item.title;
          return acc;
        }, {});
      },
      error: () => {
        this.bookNameMap = {};
      }
    });
  }

  getOrderedBookNames(): string {
    const names = (this.cart?.items || []).map((item: any) => this.getBookTitle(item.bookId));
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` and ${names.length - 3} more` : '');
  }
}
