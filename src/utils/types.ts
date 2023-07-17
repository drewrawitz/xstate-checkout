interface Price {
  currency: string;
  value: number;
  formatted: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  maxOrderQty?: number;
  price: {
    list: Price;
    sale?: Price;
    savings?: {
      message: string;
    };
  };
}

export interface CartItem extends Product {
  qty: number;
}
