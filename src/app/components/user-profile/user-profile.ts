import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfileComponent implements OnInit {
  loading = true;
  saving = false;
  message = '';
  error = '';

  profile: any = {
    name: '',
    email: '',
    phone: '',
    defaultPaymentMode: 'COD',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  addresses: any[] = [];
  addressForm: any = this.emptyAddress();
  editingAddressId: number | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.authService.getProfile().subscribe({
      next: (p) => {
        this.profile = { ...this.profile, ...p };
        this.authService.getAddresses().subscribe({
          next: (addresses) => {
            this.addresses = addresses || [];
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = 'Failed to load addresses.';
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load profile.';
      },
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.message = '';
    this.error = '';

    const payload = { ...this.profile };
    delete payload.email;

    this.authService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile = { ...this.profile, ...updated };
        const existing = this.authService.getCurrentUser();
        if (existing) {
          this.authService.setSession(localStorage.getItem('token') || '', {
            ...existing,
            name: this.profile.name,
            defaultPaymentMode: this.profile.defaultPaymentMode,
          });
        }
        this.message = 'Profile updated successfully.';
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to update profile.';
        this.saving = false;
      },
    });
  }

  changePassword(): void {
    this.message = '';
    this.error = '';

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.error = 'New password and confirm password do not match.';
      return;
    }

    this.saving = true;
    this.authService.updatePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.message = 'Password updated successfully.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to update password. Check your current password.';
        this.saving = false;
      },
    });
  }

  saveAddress(): void {
    this.saving = true;
    this.message = '';
    this.error = '';

    const req = { ...this.addressForm };
    const call = this.editingAddressId
      ? this.authService.updateAddress(this.editingAddressId, req)
      : this.authService.addAddress(req);

    call.subscribe({
      next: () => {
        this.resetAddressForm();
        this.message = 'Address saved.';
        this.saving = false;
        this.loadAll();
      },
      error: () => {
        this.error = 'Failed to save address.';
        this.saving = false;
      },
    });
  }

  editAddress(address: any): void {
    this.editingAddressId = address.id;
    this.addressForm = { ...address };
  }

  deleteAddress(addressId: number): void {
    this.authService.deleteAddress(addressId).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Failed to delete address.'),
    });
  }

  makeDefault(addressId: number): void {
    this.authService.setDefaultAddress(addressId).subscribe({
      next: () => this.loadAll(),
      error: () => (this.error = 'Failed to set default address.'),
    });
  }

  resetAddressForm(): void {
    this.editingAddressId = null;
    this.addressForm = this.emptyAddress();
  }

  private emptyAddress(): any {
    return {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    };
  }
}

