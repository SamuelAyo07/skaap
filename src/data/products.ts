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

export const products: Product[] = [
  {
    id: "1",
    name: "SuperDrink Strawberry Banana Bottle",
    weight: "473 ml",
    price: 2.99,
    image: productSuperdrink,
    barcode: "0123456789",
  },
  {
    id: "2",
    name: "Original Macaroni & Cheese Dinner",
    weight: "200 g",
    price: 1.50,
    image: productMacaroni,
    barcode: "0234567890",
  },
  {
    id: "3",
    name: "All Dressed Snacking Crackers",
    weight: "145 g",
    price: 2.49,
    image: productCrackers,
    barcode: "0345678901",
  },
  {
    id: "4",
    name: "Orange Juice",
    weight: "1 L",
    price: 3.99,
    image: productOJ,
    barcode: "0456789012",
  },
  {
    id: "5",
    name: "Whole Grain Bread",
    weight: "570 g",
    price: 4.29,
    image: productBread,
    barcode: "0567890123",
  },
];

export interface Store {
  id: string;
  name: string;
  address: string;
  image: string;
}
