// ── Search ──────────────────────────────────────────────

export interface SearchParams {
  keywords?: string;
  min_sale_price?: number;
  max_sale_price?: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  category_id?: number;
  subcategory_ids?: string;
  order_by?: 'newest' | 'price_low_to_high' | 'price_high_to_low' | 'distance';
  limit?: number;
  next_page?: string;
}

export interface SearchItemImage {
  urls: {
    small: string;
    medium: string;
    big: string;
  };
}

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  price: { amount: number; currency: string };
  location: {
    city: string;
    latitude: number;
    longitude: number;
    postal_code?: string;
  };
  images: SearchItemImage[];
  shipping?: {
    item_is_shippable: boolean;
    user_allows_shipping: boolean;
  };
  user_id: string;
  reserved?: { flag: boolean };
  bump?: { type: string };
  favorited?: { flag: boolean };
  created_at: number;
  modified_at: number;
  web_slug: string;
  distance?: number;
}

export interface SearchResponse {
  data: {
    section: {
      payload: {
        items: SearchItem[];
      };
    };
  };
  meta: {
    next_page?: string;
  };
}

// ── Item Details ────────────────────────────────────────

export interface ItemDetails {
  id: string;
  title: { original: string } | string;
  description: { original: string } | string;
  price: {
    cash?: { amount: number; currency: string };
    amount?: number;
    currency?: string;
  };
  location: {
    city: string;
    latitude: number;
    longitude: number;
    zip?: string;
  };
  user: {
    id: string;
    micro_name: string;
  };
  images: unknown[];
  shipping?: {
    item_is_shippable: boolean;
    user_allows_shipping: boolean;
  };
  creation_date: number;
  modification_date: number;
  web_slug: string;
  reserved?: { flag: boolean };
  sold?: { flag: boolean };
  visibility_flags?: {
    bumped: boolean;
    highlighted: boolean;
  };
}

// ── User ────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  micro_name: string;
  type: string;
  badge_type?: string;
  image?: {
    urls_by_size: {
      small: string;
      medium: string;
      large: string;
      xsmall?: string;
    };
  };
  location: {
    city: string;
    zip?: string;
  };
  register_date: number;
  featured: boolean;
  extra_info?: {
    description?: string;
    phone_number?: string | null;
    address?: string | null;
  };
}

export interface UserStatsRating {
  type: string;
  value: number;
}

export interface UserStatsCounter {
  type: string;
  value: number;
}

export interface UserStats {
  ratings: UserStatsRating[];
  counters: UserStatsCounter[];
}

// ── Categories ──────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon_id: string;
  vertical_id: string;
  subcategories: Category[];
}

export interface CategoriesResponse {
  categories: Category[];
}
