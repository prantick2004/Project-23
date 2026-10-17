import logo from '@/assets/pm-logo.png'

/**
 * Single source of truth for company branding.
 * To change the logo: replace `src/assets/pm-logo.png` (or point `logo` at a new file).
 */
export const brand = {
  name: 'PM',
  tagline: 'Secure Today · Smarter Tomorrow',
  copyright: `© ${new Date().getFullYear()} PM. All rights reserved.`,
  logo,
} as const
