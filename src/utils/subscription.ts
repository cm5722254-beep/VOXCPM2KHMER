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

export interface LicenseInfo {
  isLicensed: boolean;
  isLifetime: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  hoursLeft: number | null;
  formattedDate: string; // e.g. "2026-11-04" or "ពេញមួយជីវិត (Lifetime)"
  formattedFullDate: string; // e.g. "04/11/2026 12:30 PM"
  planLabel: string;     // e.g. "VIP Lifetime", "កញ្ចប់ 30 ថ្ងៃ", "សាកល្បង 7 ថ្ងៃ"
  badgeLabel: string;    // e.g. "👑 VIP Lifetime", "⏳ នៅសល់ 29 ថ្ងៃ", "🔒 ផុតកំណត់"
  statusText: string;    // e.g. "សកម្ម (Active)", "ជិតផុតកំណត់", "ផុតកំណត់"
  color: 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan';
  keyCode?: string | null;
}

export function getLicenseInfo(user: User | null): LicenseInfo {
  if (!user) {
    return {
      isLicensed: false,
      isLifetime: false,
      isExpired: false,
      daysLeft: null,
      hoursLeft: null,
      formattedDate: 'មិនមាន',
      formattedFullDate: 'មិនមាន',
      planLabel: 'មិនទាន់មាន License',
      badgeLabel: '🔒 គ្មាន License',
      statusText: 'មិនទាន់ដំណើរការ',
      color: 'slate',
      keyCode: null,
    };
  }

  // Master Admin (Full lifetime bypass)
  if (user.role === 'admin') {
    return {
      isLicensed: true,
      isLifetime: true,
      isExpired: false,
      daysLeft: null,
      hoursLeft: null,
      formattedDate: 'ជារៀងរហូត (Lifetime)',
      formattedFullDate: 'ពេញមួយជីវិត (គ្មានដែនកំណត់)',
      planLabel: 'Master Admin VIP',
      badgeLabel: '👑 VIP Lifetime',
      statusText: 'សកម្មជារៀងរហូត',
      color: 'emerald',
      keyCode: user.voxcpm_license_key || 'ADMIN-BYPASS',
    };
  }

  // Check VoxCPM2 License
  const hasLic = Boolean(user.has_voxcpm_license);
  const expStr = user.voxcpm_license_expires_at;
  const key = user.voxcpm_license_key;

  if (hasLic) {
    // If no expiration date is set, it's a Lifetime key (-1 days)
    if (!expStr) {
      return {
        isLicensed: true,
        isLifetime: true,
        isExpired: false,
        daysLeft: null,
        hoursLeft: null,
        formattedDate: 'ជារៀងរហូត (Lifetime)',
        formattedFullDate: 'ពេញមួយជីវិត (គ្មានដែនកំណត់)',
        planLabel: 'កញ្ចប់ VIP ពេញមួយជីវិត',
        badgeLabel: '👑 VIP Lifetime',
        statusText: 'សកម្ម (Active)',
        color: 'emerald',
        keyCode: key,
      };
    }

    try {
      const expDate = new Date(expStr);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();

      const day = String(expDate.getDate()).padStart(2, '0');
      const month = String(expDate.getMonth() + 1).padStart(2, '0');
      const year = expDate.getFullYear();
      const hours = String(expDate.getHours()).padStart(2, '0');
      const minutes = String(expDate.getMinutes()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;
      const formattedFullDate = `${day}/${month}/${year} ${hours}:${minutes}`;

      if (diffMs <= 0) {
        return {
          isLicensed: false,
          isLifetime: false,
          isExpired: true,
          daysLeft: 0,
          hoursLeft: 0,
          formattedDate,
          formattedFullDate,
          planLabel: 'កញ្ចប់ផុតកំណត់',
          badgeLabel: '🔒 ផុតកំណត់',
          statusText: 'បានផុតកំណត់សុពលភាព',
          color: 'rose',
          keyCode: key,
        };
      }

      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      let planLabel = 'កញ្ចប់សុពលភាព';
      if (daysLeft >= 300) {
        planLabel = 'កញ្ចប់ ១ ឆ្នាំ (365 ថ្ងៃ)';
      } else if (daysLeft >= 25) {
        planLabel = 'កញ្ចប់ ១ ខែ (30 ថ្ងៃ)';
      } else if (daysLeft <= 7) {
        planLabel = 'កញ្ចប់សាកល្បង ៧ ថ្ងៃ';
      }

      const badgeLabel = daysLeft > 0 
        ? `⏳ នៅសល់ ${daysLeft} ថ្ងៃ` 
        : `⏳ នៅសល់ ${hoursLeft} ម៉ោង`;

      const isWarning = daysLeft <= 3;

      return {
        isLicensed: true,
        isLifetime: false,
        isExpired: false,
        daysLeft,
        hoursLeft,
        formattedDate,
        formattedFullDate,
        planLabel,
        badgeLabel,
        statusText: isWarning ? `ជិតផុតកំណត់ (នៅសល់ ${daysLeft} ថ្ងៃ)` : 'សកម្ម (Active)',
        color: isWarning ? 'amber' : 'cyan',
        keyCode: key,
      };
    } catch {
      return {
        isLicensed: true,
        isLifetime: true,
        isExpired: false,
        daysLeft: null,
        hoursLeft: null,
        formattedDate: 'ជារៀងរហូត',
        formattedFullDate: 'ជារៀងរហូត',
        planLabel: 'VIP License',
        badgeLabel: '👑 VIP License',
        statusText: 'សកម្ម (Active)',
        color: 'cyan',
        keyCode: key,
      };
    }
  }

  // Not licensed
  return {
    isLicensed: false,
    isLifetime: false,
    isExpired: false,
    daysLeft: null,
    hoursLeft: null,
    formattedDate: 'មិនមាន',
    formattedFullDate: 'មិនមាន',
    planLabel: 'មិនទាន់មាន License',
    badgeLabel: '🔒 គ្មាន License',
    statusText: 'មិនទាន់ដំណើរការ License',
    color: 'rose',
    keyCode: null,
  };
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
