export type CouponStatus = 'generated' | 'claimed' | 'redeemed' | 'expired' | 'cancelled';

export type EventType =
  | 'landing_view'
  | 'form_started'
  | 'coupon_generated'
  | 'coupon_sent'
  | 'coupon_redeemed'
  | 'admin_status_changed';

export interface Bar {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CoffeeCoupon {
  id: number;
  coupon_code: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  source_url: string | null;
  bar_id: number | null;
  bar_name?: string;
  status: CouponStatus;
  claimed_at: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CouponEvent {
  id: number;
  coupon_id: number;
  event_type: EventType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CampaignStats {
  total: number;
  generated: number;
  claimed: number;
  redeemed: number;
  expired: number;
  cancelled: number;
  conversion_rate: number;
  estimated_cost_eur: number;
}

export interface ClaimPayload {
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  bar_id?: number;
  source_url?: string;
}
