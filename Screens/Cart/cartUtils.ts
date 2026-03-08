import AsyncStorage from '@react-native-async-storage/async-storage';

export const CART_KEY = 'cartItems';

export interface CartItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
  is_out_of_stock?: boolean;
  category: { id: string; name: string };
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCart(cart: CartItem[]): Promise<void> {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export async function setProductQuantity(product: Product, quantity: number): Promise<void> {
  const cart = await getCart();
  let updated = false;

  const newCart = cart
    .map((item) => {
      if (item.product === product.id) {
        updated = true;
        return { ...item, quantity };
      }
      return item;
    })
    .filter((item) => item.quantity > 0);

  if (!updated && quantity > 0) {
    newCart.push({
      product: product.id,
      name: product.name,
      image: product.images?.[0] ?? '',
      price: product.price,
      quantity,
      stock: product.stock,
    });
  }

  await saveCart(newCart);
}

export async function getProductQuantity(productId: string): Promise<number> {
  const cart = await getCart();
  const item = cart.find((i) => i.product === productId);
  return item ? item.quantity : 0;
}

export async function getCartCount(): Promise<number> {
  const cart = await getCart();
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

export async function clearCart(): Promise<void> {
  await saveCart([]);
}

// Auth helpers
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem('userId');
}

export async function isLoggedIn(): Promise<boolean> {
  const [token, userId] = await Promise.all([
    AsyncStorage.getItem('token'),
    AsyncStorage.getItem('userId'),
  ]);
  return !!token && !!userId;
}