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

export interface Product {
  id: string;
  name: string;
  brand?: string;
  weight: string;
  price: number;
  image: string;
  barcode: string;
  nutriScore?: string;
  ingredients?: string;
  allergens?: string[];
  nutrition?: NutritionInfo;
}

// ─── Featured catalog (food + beauty/cosmetics) ───
// We rely on Open Food Facts / Open Beauty Facts for live data. This list seeds
// in-app browsing, demos, and quick-scan suggestions with modern, recognizable items.
export const products: Product[] = [
  // ── Drinks ──
  { id: "1", name: "SuperDrink Strawberry Banana", weight: "473 ml", price: 2.99, image: productSuperdrink, barcode: "0123456789" },
  { id: "10", name: "Coca-Cola Classic", brand: "Coca-Cola", weight: "355 ml", price: 1.99, image: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.400.jpg", barcode: "5449000000996" },
  { id: "11", name: "Red Bull Energy Drink", brand: "Red Bull", weight: "250 ml", price: 2.49, image: "https://images.openfoodfacts.org/images/products/906/070/204/3305/front_en.400.jpg", barcode: "9002490100070" },
  { id: "12", name: "Oatly Original Oat Milk", brand: "Oatly", weight: "1 L", price: 4.99, image: "https://images.openfoodfacts.org/images/products/734/171/008/9034/front_en.400.jpg", barcode: "7394376616167" },

  // ── Snacks & boxed food ──
  { id: "2", name: "Original Macaroni & Cheese", brand: "Kraft", weight: "200 g", price: 1.50, image: productMacaroni, barcode: "0234567890" },
  { id: "3", name: "All Dressed Crackers", weight: "145 g", price: 2.49, image: productCrackers, barcode: "0345678901" },
  { id: "13", name: "Nutella Hazelnut Spread", brand: "Ferrero", weight: "400 g", price: 5.99, image: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.400.jpg", barcode: "3017620422003" },
  { id: "14", name: "Oreo Original Cookies", brand: "Mondelez", weight: "405 g", price: 3.49, image: "https://images.openfoodfacts.org/images/products/762/210/410/0250/front_en.400.jpg", barcode: "7622210410252" },
  { id: "15", name: "Pringles Original", brand: "Pringles", weight: "165 g", price: 2.99, image: "https://images.openfoodfacts.org/images/products/503/870/004/3711/front_en.400.jpg", barcode: "5038700043711" },
  { id: "16", name: "Cheerios Original", brand: "General Mills", weight: "340 g", price: 4.49, image: "https://images.openfoodfacts.org/images/products/001/600/027/525/front_en.400.jpg", barcode: "016000275256" },

  // ── Fresh / pantry ──
  { id: "4", name: "Orange Juice 100%", weight: "1 L", price: 3.99, image: productOJ, barcode: "0456789012" },
  { id: "5", name: "Whole Grain Bread", weight: "570 g", price: 4.29, image: productBread, barcode: "0567890123" },
  { id: "17", name: "Greek Yogurt Plain", brand: "Chobani", weight: "907 g", price: 5.49, image: "https://images.openfoodfacts.org/images/products/081/829/000/5057/front_en.400.jpg", barcode: "818290005057" },

  // ── Cosmetics & personal care (Open Beauty Facts) ──
  { id: "20", name: "CeraVe Moisturizing Cream", brand: "CeraVe", weight: "340 g", price: 18.99, image: "https://images.openbeautyfacts.org/images/products/301/871/239/3155/front_en.400.jpg", barcode: "3018712393155" },
  { id: "21", name: "Nivea Soft Cream", brand: "Nivea", weight: "200 ml", price: 6.99, image: "https://images.openbeautyfacts.org/images/products/421/000/491/2340/front_en.400.jpg", barcode: "4210004912340" },
  { id: "22", name: "L'Oréal Elvive Shampoo", brand: "L'Oréal", weight: "400 ml", price: 5.99, image: "https://images.openbeautyfacts.org/images/products/360/060/091/4566/front_en.400.jpg", barcode: "3600600914566" },
  { id: "23", name: "Dove Beauty Bar", brand: "Dove", weight: "100 g", price: 2.49, image: "https://images.openbeautyfacts.org/images/products/000/088/040/9018/front_en.400.jpg", barcode: "0000880409018" },
];

export interface Store {
  id: string;
  name: string;
  address: string;
  image: string;
}
