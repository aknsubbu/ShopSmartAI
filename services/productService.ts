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
        title: "Smart Watch Series 6",
        description:
          "Next-gen smartwatch with ECG, SpO₂ sensor, and always-on display",
        price: 349.99,
        originalPrice: 429.99,
        brand: "TechGear",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=11",
          "https://picsum.photos/400/400?random=12",
        ],
        rating: 4.9,
        reviewCount: 142,
        inStock: true,
        stockQuantity: 40,
        tags: ["smartwatch", "ecg", "spo2", "fitness", "gps"],
        specifications: {
          Display: "2.0 inch AMOLED always-on",
          Battery: "20 hours",
          "Water Resistance": "50m",
          Sensors: "ECG, SpO₂, Heart rate, GPS",
        },
      },
      {
        title: "ActiveFit Pro",
        description:
          "Sport-focused smartwatch with advanced workout modes and VO₂ max",
        price: 259.99,
        originalPrice: 329.99,
        brand: "SportX",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=21",
          "https://picsum.photos/400/400?random=22",
          "https://picsum.photos/400/400?random=23",
        ],
        rating: 4.7,
        reviewCount: 76,
        inStock: true,
        stockQuantity: 60,
        tags: ["smartwatch", "sports", "vo2-max", "gps", "durable"],
        specifications: {
          Display: "1.8 inch LCD",
          Battery: "30 hours",
          "Water Resistance": "100m",
          Sensors: "VO₂ max, Heart rate, GPS, Barometer",
        },
      },
      {
        title: "Elegance Classic",
        description:
          "Luxury hybrid watch with analog hands and smart notifications",
        price: 199.99,
        originalPrice: 249.99,
        brand: "LuxTime",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=31",
          "https://picsum.photos/400/400?random=32",
        ],
        rating: 4.6,
        reviewCount: 54,
        inStock: true,
        stockQuantity: 35,
        tags: ["smartwatch", "hybrid", "analog", "notifications", "fashion"],
        specifications: {
          Display: "1.2 inch OLED",
          Battery: "5 days",
          "Water Resistance": "30m",
          Sensors: "Steps, Sleep, Notifications",
        },
      },
      {
        title: "Runner's Edge X2",
        description:
          "Lightweight GPS watch designed for runners, with pace alerts",
        price: 219.99,
        originalPrice: 279.99,
        brand: "RunTech",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=41",
          "https://picsum.photos/400/400?random=42",
          "https://picsum.photos/400/400?random=43",
        ],
        rating: 4.5,
        reviewCount: 88,
        inStock: true,
        stockQuantity: 50,
        tags: ["smartwatch", "gps", "running", "pace", "lightweight"],
        specifications: {
          Display: "1.3 inch transflective",
          Battery: "24 hours",
          "Water Resistance": "50m",
          Sensors: "GPS, Heart rate, Accelerometer",
        },
      },
      {
        title: "Health Mate Plus",
        description:
          "Health-focused smartwatch with stress monitoring and guided breathing",
        price: 279.99,
        originalPrice: 339.99,
        brand: "WellnessCo",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=51",
          "https://picsum.photos/400/400?random=52",
        ],
        rating: 4.8,
        reviewCount: 101,
        inStock: true,
        stockQuantity: 45,
        tags: ["smartwatch", "stress", "wellness", "health", "gps"],
        specifications: {
          Display: "1.7 inch AMOLED",
          Battery: "18 hours",
          "Water Resistance": "50m",
          Sensors: "Stress, Heart rate, GPS",
        },
      },
      {
        title: "Adventure Watch Ultra",
        description:
          "Rugged smartwatch built for outdoor adventure and survival",
        price: 399.99,
        originalPrice: 479.99,
        brand: "OutGear",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=61",
          "https://picsum.photos/400/400?random=62",
          "https://picsum.photos/400/400?random=63",
        ],
        rating: 4.7,
        reviewCount: 68,
        inStock: true,
        stockQuantity: 20,
        tags: ["smartwatch", "rugged", "gps", "altimeter", "survival"],
        specifications: {
          Display: "1.9 inch transflective",
          Battery: "40 hours",
          "Water Resistance": "100m",
          Sensors: "GPS, Altimeter, Barometer, Compass",
        },
      },
      {
        title: "SlimFit Fitness Band",
        description:
          "Compact fitness tracker with heart rate, sleep, and step tracking",
        price: 99.99,
        originalPrice: 129.99,
        brand: "FitLife",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=71",
          "https://picsum.photos/400/400?random=72",
        ],
        rating: 4.4,
        reviewCount: 123,
        inStock: true,
        stockQuantity: 150,
        tags: ["tracker", "fitness", "sleep", "heart rate"],
        specifications: {
          Display: "0.95 inch OLED",
          Battery: "7 days",
          "Water Resistance": "30m",
          Sensors: "Heart rate, Sleep, Steps",
        },
      },
      {
        title: "BusinessPro Smartband",
        description: "Stylish smart band with email and calendar alerts",
        price: 129.99,
        originalPrice: 159.99,
        brand: "CorporateTech",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=81",
          "https://picsum.photos/400/400?random=82",
        ],
        rating: 4.3,
        reviewCount: 47,
        inStock: true,
        stockQuantity: 70,
        tags: ["smartband", "notifications", "email", "calendar"],
        specifications: {
          Display: "1.0 inch OLED",
          Battery: "10 days",
          "Water Resistance": "50m",
          Sensors: "Notifications, Steps, Heart rate",
        },
      },
      {
        title: "KidWatch Junior",
        description:
          "GPS-enabled smartwatch for kids with SOS and parental controls",
        price: 149.99,
        originalPrice: 189.99,
        brand: "SafeKid",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=91",
          "https://picsum.photos/400/400?random=92",
          "https://picsum.photos/400/400?random=93",
        ],
        rating: 4.5,
        reviewCount: 58,
        inStock: true,
        stockQuantity: 80,
        tags: ["kids", "gps", "sos", "parental", "safety"],
        specifications: {
          Display: "1.4 inch LCD",
          Battery: "12 hours",
          "Water Resistance": "30m",
          Sensors: "GPS, SOS button, Voice call",
        },
      },
      {
        title: "FashionFit Luxe",
        description:
          "Premium smartwatch with interchangeable bands and Swarovski accents",
        price: 329.99,
        originalPrice: 399.99,
        brand: "GlamTime",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=101",
          "https://picsum.photos/400/400?random=102",
        ],
        rating: 4.7,
        reviewCount: 33,
        inStock: true,
        stockQuantity: 25,
        tags: ["fashion", "smartwatch", "luxury", "interchangeable band"],
        specifications: {
          Display: "1.75 inch AMOLED",
          Battery: "18 hours",
          "Water Resistance": "30m",
          Sensors: "Heart rate, GPS, Notifications",
        },
      },
      {
        title: "Veteran GPS Pro",
        description:
          "Tactical smartwatch with night vision compatibility and GPS",
        price: 449.99,
        originalPrice: 529.99,
        brand: "TactiWatch",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=111",
          "https://picsum.photos/400/400?random=112",
          "https://picsum.photos/400/400?random=113",
        ],
        rating: 4.6,
        reviewCount: 45,
        inStock: true,
        stockQuantity: 15,
        tags: ["tactical", "gps", "rugged", "night vision"],
        specifications: {
          Display: "1.9 inch transflective",
          Battery: "35 hours",
          "Water Resistance": "100m",
          Sensors: "GPS, Compass, Altimeter",
        },
      },
      {
        title: "Senior Care Watch",
        description: "Health monitoring watch for seniors with fall detection",
        price: 199.99,
        originalPrice: 249.99,
        brand: "CarePlus",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=121",
          "https://picsum.photos/400/400?random=122",
        ],
        rating: 4.8,
        reviewCount: 72,
        inStock: true,
        stockQuantity: 30,
        tags: ["senior", "health", "fall detection", "heart rate"],
        specifications: {
          Display: "1.6 inch LCD",
          Battery: "24 hours",
          "Water Resistance": "30m",
          Sensors: "Fall detection, Heart rate, GPS",
        },
      },
      {
        title: "EcoTrack Solar",
        description:
          "Solar-powered watch with unlimited battery life under sunlight",
        price: 299.99,
        originalPrice: 359.99,
        brand: "GreenWear",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=131",
          "https://picsum.photos/400/400?random=132",
        ],
        rating: 4.5,
        reviewCount: 54,
        inStock: true,
        stockQuantity: 28,
        tags: ["solar", "sustainable", "gps", "fitness"],
        specifications: {
          Display: "1.5 inch transflective",
          Battery: "Unlimited solar",
          "Water Resistance": "50m",
          Sensors: "GPS, Heart rate, Solar panel",
        },
      },
      {
        title: "Budget Smartband Lite",
        description:
          "Affordable fitness band with step, sleep, and basic notification support",
        price: 49.99,
        originalPrice: 69.99,
        brand: "ValueTech",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=141",
          "https://picsum.photos/400/400?random=142",
        ],
        rating: 4.2,
        reviewCount: 89,
        inStock: true,
        stockQuantity: 200,
        tags: ["budget", "tracker", "fitness", "notifications"],
        specifications: {
          Display: "0.9 inch OLED",
          Battery: "10 days",
          "Water Resistance": "30m",
          Sensors: "Steps, Sleep, Notifications",
        },
      },
      {
        title: "Traveler MultiTime",
        description:
          "World-time watch with smart alarms and multiple time zones",
        price: 219.99,
        originalPrice: 269.99,
        brand: "Globetrotter",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=151",
          "https://picsum.photos/400/400?random=152",
        ],
        rating: 4.4,
        reviewCount: 38,
        inStock: true,
        stockQuantity: 33,
        tags: ["travel", "world-time", "alarms", "notifications"],
        specifications: {
          Display: "1.4 inch LCD",
          Battery: "18 hours",
          "Water Resistance": "50m",
          Sensors: "Time zones, Heart rate, Alarms",
        },
      },
      {
        title: "Yoga Zen Band",
        description: "Wellness band for yoga practice with breathing guides",
        price: 129.99,
        originalPrice: 159.99,
        brand: "ZenWear",
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://picsum.photos/400/400?random=161",
          "https://picsum.photos/400/400?random=162",
          "https://picsum.photos/400/400?random=163",
        ],
        rating: 4.6,
        reviewCount: 65,
        inStock: true,
        stockQuantity: 55,
        tags: ["yoga", "wellness", "breathing", "fitness"],
        specifications: {
          Display: "1.2 inch OLED",
          Battery: "8 days",
          "Water Resistance": "30m",
          Sensors: "Stress, Breathing, Heart rate",
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
