import productSuperdrink from "@/assets/product-superdrink.png";
import productMacaroni from "@/assets/product-macaroni.png";
import productCrackers from "@/assets/product-crackers.png";
import productOJ from "@/assets/product-oj.png";
import productBread from "@/assets/product-bread.png";

export interface NutritionInfo {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbs?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  fiber?: number;
}

export type ProductCategory = "food" | "beauty";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  weight: string;
  price: number;
  /** Optional locally bundled image (used as the instant fallback). The
   *  ProductImage component always tries to resolve a fresh OFF/OBF photo
   *  at render time, then falls back to AI generation, then to this asset. */
  image?: string;
  barcode: string;
  category?: ProductCategory;
  nutriScore?: string;
  ingredients?: string;
  allergens?: string[];
  nutrition?: NutritionInfo;
}

// ─── Featured catalog (food + beauty/cosmetics) ───
// Images are resolved live via the product-image-fallback edge function:
//   1. Open Food Facts / Open Beauty Facts current front photo
//   2. Lovable AI clean product render
//   3. Bundled local placeholder for the 5 demo items
// This means we never serve broken images even when OFF rotates revisions.
export const products: Product[] = [
  // ── Curated demo items (have local images) ──
  { id: "1", name: "SuperDrink Strawberry Banana", weight: "473 ml", price: 2.99, image: productSuperdrink, barcode: "0123456789", category: "food" },
  { id: "2", name: "Original Macaroni & Cheese", brand: "Kraft", weight: "200 g", price: 1.50, image: productMacaroni, barcode: "0234567890", category: "food" },
  { id: "3", name: "All Dressed Crackers", weight: "145 g", price: 2.49, image: productCrackers, barcode: "0345678901", category: "food" },
  { id: "4", name: "Orange Juice 100%", weight: "1 L", price: 3.99, image: productOJ, barcode: "0456789012", category: "food" },
  { id: "5", name: "Whole Grain Bread", weight: "570 g", price: 4.29, image: productBread, barcode: "0567890123", category: "food" },

  // ── Drinks ──
  { id: "10", name: "Coca-Cola Classic", brand: "Coca-Cola", weight: "355 ml", price: 1.99, barcode: "5449000000996", category: "food" },
  { id: "11", name: "Red Bull Energy Drink", brand: "Red Bull", weight: "250 ml", price: 2.49, barcode: "9002490100070", category: "food" },
  { id: "12", name: "Oatly Original Oat Milk", brand: "Oatly", weight: "1 L", price: 4.99, barcode: "7394376616167", category: "food" },
  { id: "30", name: "Liquid Death Mountain Water", brand: "Liquid Death", weight: "500 ml", price: 1.99, barcode: "0860000891004", category: "food" },
  { id: "31", name: "Olipop Vintage Cola", brand: "Olipop", weight: "355 ml", price: 2.99, barcode: "0860004068808", category: "food" },
  { id: "32", name: "Poppi Strawberry Lemon", brand: "Poppi", weight: "355 ml", price: 2.49, barcode: "0850012698098", category: "food" },
  { id: "33", name: "Celsius Sparkling Orange", brand: "Celsius", weight: "355 ml", price: 2.99, barcode: "0889392000023", category: "food" },
  { id: "34", name: "LaCroix Lime Sparkling Water", brand: "LaCroix", weight: "355 ml", price: 0.99, barcode: "0073360150517", category: "food" },

  // ── Snacks & boxed food ──
  { id: "13", name: "Nutella Hazelnut Spread", brand: "Ferrero", weight: "400 g", price: 5.99, barcode: "3017620422003", category: "food" },
  { id: "14", name: "Oreo Original Cookies", brand: "Mondelez", weight: "405 g", price: 3.49, barcode: "7622300336738", category: "food" },
  { id: "15", name: "Pringles Original", brand: "Pringles", weight: "165 g", price: 2.99, barcode: "5410076710003", category: "food" },
  { id: "16", name: "Cheerios Original", brand: "General Mills", weight: "340 g", price: 4.49, barcode: "0016000275256", category: "food" },
  { id: "40", name: "Doritos Nacho Cheese", brand: "Doritos", weight: "311 g", price: 4.49, barcode: "0028400064057", category: "food" },
  { id: "41", name: "Cheetos Crunchy", brand: "Cheetos", weight: "227 g", price: 3.99, barcode: "0028400090520", category: "food" },
  { id: "42", name: "Lay's Classic Potato Chips", brand: "Lay's", weight: "184 g", price: 3.99, barcode: "0028400090000", category: "food" },
  { id: "43", name: "RxBar Chocolate Sea Salt", brand: "RxBar", weight: "52 g", price: 2.49, barcode: "0858176002003", category: "food" },
  { id: "44", name: "KIND Dark Chocolate Nuts & Sea Salt", brand: "KIND", weight: "40 g", price: 1.99, barcode: "0602652171369", category: "food" },
  { id: "45", name: "Magic Spoon Cocoa Cereal", brand: "Magic Spoon", weight: "198 g", price: 9.99, barcode: "0850006572007", category: "food" },
  { id: "46", name: "Goldfish Cheddar", brand: "Pepperidge Farm", weight: "187 g", price: 2.99, barcode: "0014100085362", category: "food" },

  // ── Pantry ──
  { id: "17", name: "Chobani Greek Yogurt Plain", brand: "Chobani", weight: "907 g", price: 5.49, barcode: "0818290005075", category: "food" },
  { id: "50", name: "Heinz Tomato Ketchup", brand: "Heinz", weight: "397 g", price: 3.49, barcode: "0013000006101", category: "food" },
  { id: "51", name: "Quaker Old Fashioned Oats", brand: "Quaker", weight: "510 g", price: 4.49, barcode: "0030000010402", category: "food" },
  { id: "52", name: "Skippy Creamy Peanut Butter", brand: "Skippy", weight: "462 g", price: 4.99, barcode: "0037600105033", category: "food" },

  // ── Cosmetics & personal care (Open Beauty Facts) ──
  { id: "20", name: "CeraVe Moisturizing Cream", brand: "CeraVe", weight: "340 g", price: 18.99, barcode: "3018712393155", category: "beauty" },
  { id: "21", name: "Nivea Soft Cream", brand: "Nivea", weight: "200 ml", price: 6.99, barcode: "4005900388957", category: "beauty" },
  { id: "22", name: "L'Oréal Elvive Total Repair Shampoo", brand: "L'Oréal", weight: "400 ml", price: 5.99, barcode: "3600523715473", category: "beauty" },
  { id: "23", name: "Dove Beauty Bar Original", brand: "Dove", weight: "100 g", price: 2.49, barcode: "0011111650107", category: "beauty" },
  { id: "60", name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", weight: "30 ml", price: 6.50, barcode: "0769915190205", category: "beauty" },
  { id: "61", name: "Aquaphor Healing Ointment", brand: "Aquaphor", weight: "99 g", price: 8.99, barcode: "0072140002671", category: "beauty" },
];

export interface Store {
  id: string;
  name: string;
  address: string;
  image: string;
}
