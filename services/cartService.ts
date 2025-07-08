import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  brand: string;
  category: string;
  subcategory?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
  addedAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  type: "home" | "work" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export const cartService = {
  // Get user's cart
  async getUserCart(userId: string): Promise<Cart | null> {
    try {
      const cartQuery = query(
        collection(db, "carts"),
        where("userId", "==", userId)
      );
      const cartSnapshot = await getDocs(cartQuery);

      if (!cartSnapshot.empty) {
        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data();

        return {
          id: cartDoc.id,
          ...cartData,
          // Safe date conversion with null checks
          createdAt: cartData.createdAt
            ? cartData.createdAt.toDate()
            : new Date(),
          updatedAt: cartData.updatedAt
            ? cartData.updatedAt.toDate()
            : new Date(),
          items: cartData.items.map((item: any) => ({
            ...item,
            // Safe date conversion for item timestamps
            addedAt: item.addedAt ? item.addedAt.toDate() : new Date(),
            updatedAt: item.updatedAt ? item.updatedAt.toDate() : new Date(),
          })),
        } as Cart;
      }

      return null;
    } catch (error) {
      console.error("Error getting user cart:", error);
      throw error;
    }
  },

  // Create new cart for user
  async createCart(userId: string): Promise<Cart> {
    try {
      const cartData = {
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const cartRef = await addDoc(collection(db, "carts"), cartData);

      return {
        id: cartRef.id,
        ...cartData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Cart;
    } catch (error) {
      console.error("Error creating cart:", error);
      throw error;
    }
  },

  // Add item to cart
  async addToCart(
    userId: string,
    product: Product,
    quantity: number = 1,
    selectedVariant?: string
  ): Promise<void> {
    try {
      let cart = await this.getUserCart(userId);

      if (!cart) {
        cart = await this.createCart(userId);
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedVariant === selectedVariant
      );

      const cartItem: CartItem = {
        id: `${product.id}_${selectedVariant || "default"}_${Date.now()}`,
        productId: product.id,
        product,
        quantity,
        selectedVariant,
        addedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].updatedAt = new Date();
      } else {
        // Add new item
        cart.items.push(cartItem);
      }

      // Update cart totals
      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );

      const itemsForFirestore = cart.items.map((item) => ({
        ...item,
        selectedVariant: item.selectedVariant || null, // Ensure no undefined values
        product: {
          ...item.product,
          // Remove undefined values and convert dates
          originalPrice: item.product.originalPrice || null,
          subcategory: item.product.subcategory || null,
          specifications: item.product.specifications || {},
        },
        // Dates will be automatically converted to Timestamps by Firestore
      }));

      // Update in Firestore
      await updateDoc(doc(db, "carts", cart.id), {
        items: itemsForFirestore,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  // Update cart item quantity
  async updateCartItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<void> {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart) return;

      const itemIndex = cart.items.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) return;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].updatedAt = new Date();
      }

      // Update cart totals
      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );

      // Update in Firestore
      await updateDoc(doc(db, "carts", cart.id), {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw error;
    }
  },

  // Remove item from cart
  async removeFromCart(userId: string, itemId: string): Promise<void> {
    try {
      await this.updateCartItemQuantity(userId, itemId, 0);
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  // Clear entire cart
  async clearCart(userId: string): Promise<void> {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart) return;

      await updateDoc(doc(db, "carts", cart.id), {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  // Get cart real-time updates
  subscribeToCart(
    userId: string,
    callback: (cart: Cart | null) => void
  ): () => void {
    const cartQuery = query(
      collection(db, "carts"),
      where("userId", "==", userId)
    );

    return onSnapshot(cartQuery, (snapshot) => {
      if (!snapshot.empty) {
        const cartDoc = snapshot.docs[0];
        const cartData = cartDoc.data();

        const cart: Cart = {
          id: cartDoc.id,
          ...cartData,
          // Safe date conversion with null checks
          createdAt: cartData.createdAt
            ? cartData.createdAt.toDate()
            : new Date(),
          updatedAt: cartData.updatedAt
            ? cartData.updatedAt.toDate()
            : new Date(),
          items: cartData.items.map((item: any) => ({
            ...item,
            // Safe date conversion for item timestamps
            addedAt: item.addedAt ? item.addedAt.toDate() : new Date(),
            updatedAt: item.updatedAt ? item.updatedAt.toDate() : new Date(),
          })),
        } as Cart;

        callback(cart);
      } else {
        callback(null);
      }
    });
  },

  // Create order from cart
  async createOrder(
    userId: string,
    shippingAddress: Address,
    paymentMethod: string
  ): Promise<Order> {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const orderData = {
        userId,
        items: cart.items,
        totalAmount: cart.totalPrice,
        status: "pending" as const,
        shippingAddress,
        paymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // Clear the cart after creating order
      await this.clearCart(userId);

      return {
        id: orderRef.id,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Get user orders

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const ordersSnapshot = await getDocs(ordersQuery);

      return ordersSnapshot.docs.map((doc) => {
        const orderData = doc.data();
        return {
          id: doc.id,
          ...orderData,
          // Safe date conversion with null checks
          createdAt: orderData.createdAt
            ? orderData.createdAt.toDate()
            : new Date(),
          updatedAt: orderData.updatedAt
            ? orderData.updatedAt.toDate()
            : new Date(),
          items: orderData.items.map((item: any) => ({
            ...item,
            // Safe date conversion for item timestamps
            addedAt: item.addedAt ? item.addedAt.toDate() : new Date(),
            updatedAt: item.updatedAt ? item.updatedAt.toDate() : new Date(),
          })),
        } as Order;
      });
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  },
};
