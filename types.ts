export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  features: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Recommendation {
  productId: string;
  reason: string;
}

export enum ViewState {
  HOME = 'HOME',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  CART = 'CART'
}