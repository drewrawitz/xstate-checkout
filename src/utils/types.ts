export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  maxOrderQty?: number;
}

export interface CartItem extends Product {
  qty: number;
}
