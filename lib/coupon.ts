import { customAlphabet } from 'nanoid';

// Alphabet excludes ambiguous chars: 0/O, 1/I/L
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generate = customAlphabet(alphabet, 8);

export function generateCouponCode(): string {
  return `DLG-${generate()}`;
}

export const COUPON_EXPIRES_DAYS = 30;
export const COFFEE_COST_EUR = 2.5;
