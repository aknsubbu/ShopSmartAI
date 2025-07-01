import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
} from "firebase/firestore";
import { Product } from "./cartService";

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  subcategories: string[];
  isActive: boolean;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  tags?: string[];
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
}

export const productService = {
  // Get all categories
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const categoriesSnapshot = await getDocs(
        query(collection(db, "categories"), where("isActive", "==", true))
      );

      return categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProductCategory[];
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },

  // Search products
  async searchProducts(
    searchTerm: string,
    filters: ProductFilter = {},
    pageSize: number = 20,
    lastProduct?: Product
  ): Promise<SearchResult> {
    try {
      let productsQuery = query(
        collection(db, "products"),
        where("inStock", "==", filters.inStock ?? true)
      );

      // Apply filters
      if (filters.category) {
        productsQuery = query(
          productsQuery,
          where("category", "==", filters.category)
        );
      }

      if (filters.subcategory) {
        productsQuery = query(
          productsQuery,
          where("subcategory", "==", filters.subcategory)
        );
      }

      if (filters.brand) {
        productsQuery = query(
          productsQuery,
          where("brand", "==", filters.brand)
        );
      }

      if (filters.rating) {
        productsQuery = query(
          productsQuery,
          where("rating", ">=", filters.rating)
        );
      }

      // Add ordering and pagination
      productsQuery = query(
        productsQuery,
        orderBy("createdAt", "desc"),
        limit(pageSize + 1) // Get one extra to check if there are more
      );

      if (lastProduct) {
        const lastProductDoc = await getDoc(
          doc(db, "products", lastProduct.id)
        );
        productsQuery = query(productsQuery, startAfter(lastProductDoc));
      }

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.slice(0, pageSize).map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });

      // Filter by search term (simple text search - in production, use Algolia or similar)
      const filteredProducts = searchTerm
        ? products.filter(
            (product) =>
              product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
              )
          )
        : products;

      // Apply price filters
      const finalProducts = filteredProducts.filter((product) => {
        if (filters.minPrice && product.price < filters.minPrice) return false;
        if (filters.maxPrice && product.price > filters.maxPrice) return false;
        return true;
      });

      return {
        products: finalProducts,
        totalCount: finalProducts.length,
        hasMore: productsSnapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  },

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(doc(db, "products", productId));

      if (productDoc.exists()) {
        const data = productDoc.data();
        return {
          id: productDoc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      }

      return null;
    } catch (error) {
      console.error("Error getting product:", error);
      throw error;
    }
  },

  // Get featured products
  async getFeaturedProducts(limitCount: number = 10): Promise<Product[]> {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("inStock", "==", true),
        where("rating", ">=", 4.0),
        orderBy("rating", "desc"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const productsSnapshot = await getDocs(productsQuery);

      return productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });
    } catch (error) {
      console.error("Error getting featured products:", error);
      throw error;
    }
  },

  // Get products by category
  async getProductsByCategory(
    category: string,
    pageSize: number = 20,
    lastProduct?: Product
  ): Promise<SearchResult> {
    try {
      let productsQuery = query(
        collection(db, "products"),
        where("category", "==", category),
        where("inStock", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize + 1)
      );

      if (lastProduct) {
        const lastProductDoc = await getDoc(
          doc(db, "products", lastProduct.id)
        );
        productsQuery = query(productsQuery, startAfter(lastProductDoc));
      }

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.slice(0, pageSize).map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });

      return {
        products,
        totalCount: products.length,
        hasMore: productsSnapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error("Error getting products by category:", error);
      throw error;
    }
  },

  // Get sale products
  async getSaleProducts(limitCount: number = 20): Promise<Product[]> {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("inStock", "==", true),
        where("originalPrice", ">", 0),
        orderBy("originalPrice", "desc"),
        limit(limitCount)
      );

      const productsSnapshot = await getDocs(productsQuery);

      return productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });
    } catch (error) {
      console.error("Error getting sale products:", error);
      throw error;
    }
  },

  // Get product recommendations based on user preferences
  async getRecommendedProducts(
    userId: string,
    userPreferences: string[] = [],
    limitCount: number = 10
  ): Promise<Product[]> {
    try {
      // Simple recommendation based on tags matching user preferences
      // In production, you'd use ML algorithms or recommendation engines
      let productsQuery = query(
        collection(db, "products"),
        where("inStock", "==", true),
        orderBy("rating", "desc"),
        limit(limitCount * 2) // Get more to filter
      );

      const productsSnapshot = await getDocs(productsQuery);
      const allProducts = productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });

      // Score products based on preference matching
      const scoredProducts = allProducts.map((product) => {
        const score = product.tags.reduce((acc, tag) => {
          return acc + (userPreferences.includes(tag.toLowerCase()) ? 1 : 0);
        }, 0);
        return { product, score };
      });

      // Sort by score and rating, then return top products
      return scoredProducts
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          return b.product.rating - a.product.rating;
        })
        .slice(0, limitCount)
        .map((item) => item.product);
    } catch (error) {
      console.error("Error getting recommended products:", error);
      throw error;
    }
  },

  // Create mock products for testing (admin function)
  async createMockProducts(): Promise<void> {
    const mockProducts: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [
      {
        title: "Wireless Bluetooth Headphones",
        description:
          "Premium wireless headphones with noise cancellation and 30-hour battery life",
        price: 199.99,
        originalPrice: 249.99,
        brand: "AudioTech",
        category: "Electronics",
        subcategory: "Headphones",
        images: ["https://picsum.photos/400/400?random=1"],
        rating: 4.5,
        reviewCount: 127,
        inStock: true,
        stockQuantity: 50,
        tags: [
          "wireless",
          "bluetooth",
          "headphones",
          "music",
          "noise-cancellation",
        ],
        specifications: {
          "Battery Life": "30 hours",
          Connectivity: "Bluetooth 5.0",
          Weight: "250g",
          Warranty: "2 years",
        },
      },
      {
        title: "Smart Watch Series 5",
        description:
          "Advanced smartwatch with health tracking, GPS, and cellular connectivity",
        price: 299.99,
        originalPrice: 399.99,
        brand: "TechGear",
        category: "Electronics",
        subcategory: "Wearables",
        images: ["https://picsum.photos/400/400?random=2"],
        rating: 4.8,
        reviewCount: 89,
        inStock: true,
        stockQuantity: 25,
        tags: ["smartwatch", "fitness", "health", "gps", "cellular"],
        specifications: {
          Display: "1.9 inch AMOLED",
          Battery: "18 hours",
          "Water Resistance": "50m",
          Sensors: "Heart rate, GPS, Accelerometer",
        },
      },
      {
        title: "Organic Cotton T-Shirt",
        description:
          "Comfortable and sustainable organic cotton t-shirt in various colors",
        price: 29.99,
        brand: "EcoWear",
        category: "Clothing",
        subcategory: "Shirts",
        images: ["https://picsum.photos/400/400?random=3"],
        rating: 4.2,
        reviewCount: 234,
        inStock: true,
        stockQuantity: 100,
        tags: ["organic", "cotton", "sustainable", "casual", "comfortable"],
        specifications: {
          Material: "100% Organic Cotton",
          Fit: "Regular",
          Care: "Machine washable",
          Origin: "USA",
        },
      },
      {
        title: "Coffee Maker Pro",
        description:
          "Professional-grade coffee maker with programmable features and thermal carafe",
        price: 149.99,
        originalPrice: 199.99,
        brand: "BrewMaster",
        category: "Home & Kitchen",
        subcategory: "Appliances",
        images: ["https://picsum.photos/400/400?random=4"],
        rating: 4.6,
        reviewCount: 156,
        inStock: true,
        stockQuantity: 30,
        tags: ["coffee", "maker", "programmable", "thermal", "kitchen"],
        specifications: {
          Capacity: "12 cups",
          Features: "Programmable, Auto-shutoff",
          Carafe: "Thermal stainless steel",
          Warranty: "3 years",
        },
      },
    ];

    try {
      for (const product of mockProducts) {
        await addDoc(collection(db, "products"), {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      console.log("Mock products created successfully");
    } catch (error) {
      console.error("Error creating mock products:", error);
      throw error;
    }
  },
};
