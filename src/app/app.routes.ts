import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { BookDetailsComponent } from './components/book-details/book-details';
import { CartComponent } from './components/cart/cart';
import { OrdersComponent } from './components/orders/orders';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { OAuth2RedirectComponent } from './components/oauth2-redirect/oauth2-redirect';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { UserProfileComponent } from './components/user-profile/user-profile';
import { WishlistComponent } from './components/wishlist/wishlist';
import { OrderDetailsComponent } from './components/order-details/order-details';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'book/:id', component: BookDetailsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'orders/:id', component: OrderDetailsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [authGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] },
  { path: 'oauth2/redirect', component: OAuth2RedirectComponent },
  { path: '**', redirectTo: '' }
];
