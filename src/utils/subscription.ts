import { User } from '../types';

export interface SubscriptionInfo {
  tier: 'admin' | 'premium' | 'free' | 'guest';
  title: string;
  badge: string;
  isPremium: boolean;
  isLifetime: boolean;
  expiryText: string;
  formattedDate: string | null;
  daysLeft: number | null;
  color: 'emerald' | 'amber' | 'slate' | 'rose';
}

export function getSubscriptionInfo(user: User | null): SubscriptionInfo {
  if (!user) {
    return {
      tier: 'guest',
      title: 'Guest',
      badge: 'Guest',
      isPremium: false,
      isLifetime: false,
      expiryText: 'មិនទាន់ចូលគណនី',
      formattedDate: 'មិនមាន',
      daysLeft: null,
      color: 'slate',
    };
  }

  // Master Admin
  if (user.role === 'admin') {
    return {
      tier: 'admin',
      title: 'Master Admin',
      badge: 'VIP Lifetime',
      isPremium: true,
      isLifetime: true,
      expiryText: 'ពេញមួយជីវិត',
      formattedDate: 'ពេញមួយជីវិត',
      daysLeft: null,
      color: 'emerald',
    };
  }

  // Premium User
  if (user.tier === 'premium') {
    if (!user.premium_expires_at) {
      return {
        tier: 'premium',
        title: 'VIP Lifetime',
        badge: 'Lifetime',
        isPremium: true,
        isLifetime: true,
        expiryText: 'ពេញមួយជីវិត',
        formattedDate: 'ពេញមួយជីវិត',
        daysLeft: null,
        color: 'amber',
      };
    }

    try {
      const expDate = new Date(user.premium_expires_at);
      const now = new Date();
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const day = String(expDate.getDate()).padStart(2, '0');
      const month = String(expDate.getMonth() + 1).padStart(2, '0');
      const year = expDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      if (diffDays <= 0) {
        return {
          tier: 'free',
          title: 'Free Plan',
          badge: 'Expired',
          isPremium: false,
          isLifetime: false,
          expiryText: 'ផុតកំណត់',
          formattedDate,
          daysLeft: 0,
          color: 'rose',
        };
      }

      return {
        tier: 'premium',
        title: 'VIP Plan',
        badge: `${diffDays} ថ្ងៃ`,
        isPremium: true,
        isLifetime: false,
        expiryText: `នៅសល់ ${diffDays} ថ្ងៃ`,
        formattedDate,
        daysLeft: diffDays,
        color: 'amber',
      };
    } catch {
      return {
        tier: 'premium',
        title: 'VIP Plan',
        badge: 'VIP',
        isPremium: true,
        isLifetime: true,
        expiryText: 'ពេញមួយជីវិត',
        formattedDate: 'ពេញមួយជីវិត',
        daysLeft: null,
        color: 'amber',
      };
    }
  }

  // Free User
  return {
    tier: 'free',
    title: 'Free Plan',
    badge: 'Free',
    isPremium: false,
    isLifetime: false,
    expiryText: 'ឥតគិតថ្លៃ',
    formattedDate: 'មិនមាន',
    daysLeft: null,
    color: 'slate',
  };
}
