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

export type Continent =
  | "North America"
  | "South America"
  | "Europe"
  | "Africa"
  | "Asia"
  | "Oceania";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  weight: string;
  price: number;
  /** Optional locally bundled image (instant fallback). Live image is resolved at render. */
  image?: string;
  barcode: string;
  category?: ProductCategory;
  nutriScore?: string;
  ingredients?: string;
  allergens?: string[];
  nutrition?: NutritionInfo;
  /** Region metadata for store mapping + localized discovery. */
  countries?: string[]; // ISO names, e.g. ["United States", "Canada"]
  continents?: Continent[];
  /** Store IDs (from public.stores) where this item is typically stocked. */
  availableInStoreIds?: string[];
}

// ─── Global catalog (food + beauty/cosmetics) ───
// Images resolve live via the product-image-fallback edge function:
//   1. Open Food Facts / Open Beauty Facts front photo
//   2. Lovable AI clean product render
//   3. Bundled local placeholder for the 5 demo items
export const products: Product[] = [
  // ───────── Curated demo items (local images) ─────────
  { id: "1", name: "SuperDrink Strawberry Banana", weight: "473 ml", price: 2.99, image: productSuperdrink, barcode: "0123456789", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "2", name: "Original Macaroni & Cheese", brand: "Kraft", weight: "200 g", price: 1.50, image: productMacaroni, barcode: "0234567890", category: "food", continents: ["North America"], countries: ["United States", "Canada"] },
  { id: "3", name: "All Dressed Crackers", weight: "145 g", price: 2.49, image: productCrackers, barcode: "0345678901", category: "food", continents: ["North America"], countries: ["Canada"] },
  { id: "4", name: "Orange Juice 100%", weight: "1 L", price: 3.99, image: productOJ, barcode: "0456789012", category: "food", continents: ["North America", "Europe"] },
  { id: "5", name: "Whole Grain Bread", weight: "570 g", price: 4.29, image: productBread, barcode: "0567890123", category: "food", continents: ["North America"] },

  // ═════════ NORTH AMERICA ═════════
  { id: "na-d1", name: "Coca-Cola Classic", brand: "Coca-Cola", weight: "355 ml", price: 1.99, barcode: "5449000000996", category: "food", continents: ["North America", "Europe", "Africa", "Asia", "South America", "Oceania"], countries: ["United States", "Canada", "Mexico", "United Kingdom", "Germany", "Brazil", "South Africa", "Japan", "Australia"] },
  { id: "na-d2", name: "Red Bull Energy Drink", brand: "Red Bull", weight: "250 ml", price: 2.49, barcode: "9002490100070", category: "food", continents: ["Europe", "North America", "Asia", "Oceania"], countries: ["Austria", "United States", "Germany", "United Kingdom"] },
  { id: "na-d3", name: "Liquid Death Mountain Water", brand: "Liquid Death", weight: "500 ml", price: 1.99, barcode: "0860000891004", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-d4", name: "Olipop Vintage Cola", brand: "Olipop", weight: "355 ml", price: 2.99, barcode: "0860004068808", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-d5", name: "Poppi Strawberry Lemon", brand: "Poppi", weight: "355 ml", price: 2.49, barcode: "0850012698098", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-d6", name: "Celsius Sparkling Orange", brand: "Celsius", weight: "355 ml", price: 2.99, barcode: "0889392000023", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-d7", name: "LaCroix Lime Sparkling Water", brand: "LaCroix", weight: "355 ml", price: 0.99, barcode: "0073360150517", category: "food", continents: ["North America"], countries: ["United States", "Canada"] },
  { id: "na-d8", name: "Gatorade Cool Blue", brand: "Gatorade", weight: "591 ml", price: 1.79, barcode: "0052000338294", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-d9", name: "Snapple Peach Tea", brand: "Snapple", weight: "473 ml", price: 1.99, barcode: "0076183001059", category: "food", continents: ["North America"], countries: ["United States"] },

  { id: "na-s1", name: "Oreo Original Cookies", brand: "Mondelez", weight: "405 g", price: 3.49, barcode: "7622300336738", category: "food", continents: ["North America", "Europe", "Asia", "South America"], countries: ["United States", "United Kingdom", "Spain"] },
  { id: "na-s2", name: "Pringles Original", brand: "Pringles", weight: "165 g", price: 2.99, barcode: "5410076710003", category: "food", continents: ["North America", "Europe", "Asia"], countries: ["United States", "Belgium", "United Kingdom"] },
  { id: "na-s3", name: "Cheerios Original", brand: "General Mills", weight: "340 g", price: 4.49, barcode: "0016000275256", category: "food", continents: ["North America"], countries: ["United States", "Canada"] },
  { id: "na-s4", name: "Doritos Nacho Cheese", brand: "Doritos", weight: "311 g", price: 4.49, barcode: "0028400064057", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s5", name: "Cheetos Crunchy", brand: "Cheetos", weight: "227 g", price: 3.99, barcode: "0028400090520", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s6", name: "Lay's Classic Potato Chips", brand: "Lay's", weight: "184 g", price: 3.99, barcode: "0028400090000", category: "food", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "na-s7", name: "RxBar Chocolate Sea Salt", brand: "RxBar", weight: "52 g", price: 2.49, barcode: "0858176002003", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s8", name: "KIND Dark Chocolate Nuts & Sea Salt", brand: "KIND", weight: "40 g", price: 1.99, barcode: "0602652171369", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s9", name: "Magic Spoon Cocoa Cereal", brand: "Magic Spoon", weight: "198 g", price: 9.99, barcode: "0850006572007", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s10", name: "Goldfish Cheddar", brand: "Pepperidge Farm", weight: "187 g", price: 2.99, barcode: "0014100085362", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s11", name: "Pop-Tarts Frosted Strawberry", brand: "Kellogg's", weight: "384 g", price: 3.49, barcode: "0038000204203", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-s12", name: "Reese's Peanut Butter Cups", brand: "Hershey's", weight: "42 g", price: 1.29, barcode: "0034000002405", category: "food", continents: ["North America"], countries: ["United States"] },

  { id: "na-p1", name: "Chobani Greek Yogurt Plain", brand: "Chobani", weight: "907 g", price: 5.49, barcode: "0818290005075", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-p2", name: "Heinz Tomato Ketchup", brand: "Heinz", weight: "397 g", price: 3.49, barcode: "0013000006101", category: "food", continents: ["North America", "Europe"], countries: ["United States", "United Kingdom"] },
  { id: "na-p3", name: "Quaker Old Fashioned Oats", brand: "Quaker", weight: "510 g", price: 4.49, barcode: "0030000010402", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "na-p4", name: "Skippy Creamy Peanut Butter", brand: "Skippy", weight: "462 g", price: 4.99, barcode: "0037600105033", category: "food", continents: ["North America"], countries: ["United States"] },

  // ═════════ EUROPE ═════════
  { id: "eu-d1", name: "Evian Natural Mineral Water", brand: "Evian", weight: "1 L", price: 1.49, barcode: "3068320055008", category: "food", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "eu-d2", name: "San Pellegrino Sparkling Water", brand: "San Pellegrino", weight: "750 ml", price: 2.49, barcode: "8002270000027", category: "food", continents: ["Europe"], countries: ["Italy"] },
  { id: "eu-d3", name: "Innocent Smoothie Mangoes & Passion Fruits", brand: "Innocent", weight: "750 ml", price: 3.99, barcode: "5038862770507", category: "food", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "eu-d4", name: "Schweppes Tonic Water", brand: "Schweppes", weight: "1 L", price: 1.79, barcode: "3124480116116", category: "food", continents: ["Europe"], countries: ["France", "Germany"] },
  { id: "eu-d5", name: "Yorkshire Tea", brand: "Taylors of Harrogate", weight: "250 g", price: 4.49, barcode: "5010357101187", category: "food", continents: ["Europe"], countries: ["United Kingdom"] },

  { id: "eu-s1", name: "Nutella Hazelnut Spread", brand: "Ferrero", weight: "400 g", price: 5.99, barcode: "3017620422003", category: "food", continents: ["Europe", "North America", "South America"], countries: ["Italy", "France"] },
  { id: "eu-s2", name: "Milka Alpine Milk Chocolate", brand: "Milka", weight: "100 g", price: 2.49, barcode: "7622300465360", category: "food", continents: ["Europe"], countries: ["Germany", "Austria"] },
  { id: "eu-s3", name: "Haribo Goldbears", brand: "Haribo", weight: "200 g", price: 1.99, barcode: "4001686301920", category: "food", continents: ["Europe", "North America"], countries: ["Germany"] },
  { id: "eu-s4", name: "Lindt Excellence 70% Dark", brand: "Lindt", weight: "100 g", price: 3.49, barcode: "3046920022606", category: "food", continents: ["Europe", "North America"], countries: ["Switzerland"] },
  { id: "eu-s5", name: "Kinder Bueno", brand: "Ferrero", weight: "43 g", price: 1.29, barcode: "8000500037560", category: "food", continents: ["Europe"], countries: ["Italy", "Germany"] },
  { id: "eu-s6", name: "McVitie's Digestive Biscuits", brand: "McVitie's", weight: "400 g", price: 2.29, barcode: "5000168001142", category: "food", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "eu-s7", name: "Walkers Shortbread Fingers", brand: "Walkers", weight: "150 g", price: 3.99, barcode: "0039047021105", category: "food", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "eu-s8", name: "Lu Petit Beurre", brand: "Lu", weight: "200 g", price: 1.79, barcode: "7622210449283", category: "food", continents: ["Europe"], countries: ["France"] },

  { id: "eu-p1", name: "Barilla Spaghetti N.5", brand: "Barilla", weight: "500 g", price: 1.99, barcode: "8076809513876", category: "food", continents: ["Europe", "North America"], countries: ["Italy"] },
  { id: "eu-p2", name: "Mutti Tomato Passata", brand: "Mutti", weight: "700 g", price: 3.49, barcode: "8005110145117", category: "food", continents: ["Europe"], countries: ["Italy"] },
  { id: "eu-p3", name: "Oatly Original Oat Milk", brand: "Oatly", weight: "1 L", price: 4.99, barcode: "7394376616167", category: "food", continents: ["Europe", "North America"], countries: ["Sweden"] },
  { id: "eu-p4", name: "Alpro Soya Original", brand: "Alpro", weight: "1 L", price: 2.49, barcode: "5411188080404", category: "food", continents: ["Europe"], countries: ["Belgium"] },
  { id: "eu-p5", name: "President Brie", brand: "Président", weight: "200 g", price: 4.99, barcode: "3228020901003", category: "food", continents: ["Europe"], countries: ["France"] },

  // ═════════ ASIA ═════════
  { id: "as-d1", name: "Pocari Sweat", brand: "Otsuka", weight: "500 ml", price: 1.99, barcode: "4901085169025", category: "food", continents: ["Asia"], countries: ["Japan", "South Korea", "Indonesia"] },
  { id: "as-d2", name: "Calpis Water", brand: "Asahi", weight: "500 ml", price: 2.19, barcode: "4901340014015", category: "food", continents: ["Asia"], countries: ["Japan"] },
  { id: "as-d3", name: "Vita Lemon Tea", brand: "Vita", weight: "250 ml", price: 0.99, barcode: "4891028714187", category: "food", continents: ["Asia"], countries: ["Hong Kong", "China"] },
  { id: "as-d4", name: "Yakult Original", brand: "Yakult", weight: "65 ml", price: 0.79, barcode: "8888002016014", category: "food", continents: ["Asia", "Europe", "North America"], countries: ["Japan", "Singapore"] },
  { id: "as-d5", name: "Thums Up Cola", brand: "Coca-Cola India", weight: "750 ml", price: 1.29, barcode: "8901030713057", category: "food", continents: ["Asia"], countries: ["India"] },
  { id: "as-d6", name: "Frooti Mango Drink", brand: "Parle Agro", weight: "250 ml", price: 0.59, barcode: "8901030020074", category: "food", continents: ["Asia"], countries: ["India"] },

  { id: "as-s1", name: "Pocky Chocolate", brand: "Glico", weight: "70 g", price: 2.49, barcode: "4901005102026", category: "food", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "as-s2", name: "Hello Panda Chocolate", brand: "Meiji", weight: "50 g", price: 1.79, barcode: "4902777018652", category: "food", continents: ["Asia"], countries: ["Japan"] },
  { id: "as-s3", name: "Shin Ramyun", brand: "Nongshim", weight: "120 g", price: 1.49, barcode: "8801043015042", category: "food", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "as-s4", name: "Nissin Cup Noodles Original", brand: "Nissin", weight: "75 g", price: 1.29, barcode: "4902105002919", category: "food", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "as-s5", name: "Lotte Choco Pie", brand: "Lotte", weight: "336 g", price: 4.99, barcode: "8801062636624", category: "food", continents: ["Asia"], countries: ["South Korea"] },
  { id: "as-s6", name: "Parle-G Biscuits", brand: "Parle", weight: "79 g", price: 0.25, barcode: "8901719110018", category: "food", continents: ["Asia"], countries: ["India"] },
  { id: "as-s7", name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", weight: "200 g", price: 2.99, barcode: "8901725111014", category: "food", continents: ["Asia"], countries: ["India"] },
  { id: "as-s8", name: "Want Want Senbei Rice Crackers", brand: "Want Want", weight: "150 g", price: 2.49, barcode: "4710314100039", category: "food", continents: ["Asia"], countries: ["Taiwan", "China"] },

  { id: "as-p1", name: "Kikkoman Soy Sauce", brand: "Kikkoman", weight: "1 L", price: 5.99, barcode: "0041390000508", category: "food", continents: ["Asia", "North America", "Europe"], countries: ["Japan"] },
  { id: "as-p2", name: "Mae Ploy Sweet Chili Sauce", brand: "Mae Ploy", weight: "730 ml", price: 4.49, barcode: "0015205002339", category: "food", continents: ["Asia"], countries: ["Thailand"] },
  { id: "as-p3", name: "Tata Tea Premium", brand: "Tata", weight: "500 g", price: 6.99, barcode: "8901138509057", category: "food", continents: ["Asia"], countries: ["India"] },

  // ═════════ AFRICA ═════════
  { id: "af-d1", name: "Stoney Ginger Beer", brand: "Coca-Cola", weight: "500 ml", price: 1.49, barcode: "6001240223514", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-d2", name: "Appletiser Sparkling Apple", brand: "Appletiser", weight: "330 ml", price: 1.79, barcode: "6001240100110", category: "food", continents: ["Africa", "Europe"], countries: ["South Africa"] },
  { id: "af-d3", name: "Rooibos Tea", brand: "Freshpak", weight: "160 g", price: 3.49, barcode: "6001275000056", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-d4", name: "Chibuku Shake Shake", brand: "AB InBev", weight: "1 L", price: 1.29, barcode: "6009880840014", category: "food", continents: ["Africa"], countries: ["Zambia", "Zimbabwe"] },
  { id: "af-d5", name: "Bissap Hibiscus Drink", brand: "Kalahari", weight: "330 ml", price: 1.99, barcode: "6291003040016", category: "food", continents: ["Africa"], countries: ["Senegal", "Nigeria"] },

  { id: "af-s1", name: "Bakers Tennis Biscuits", brand: "Bakers", weight: "200 g", price: 1.79, barcode: "6001056000017", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-s2", name: "Simba Salt & Vinegar Chips", brand: "Simba", weight: "125 g", price: 1.49, barcode: "6001056000628", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-s3", name: "Indomie Instant Noodles", brand: "Indomie", weight: "70 g", price: 0.45, barcode: "089686170733", category: "food", continents: ["Africa", "Asia"], countries: ["Nigeria", "Indonesia"] },
  { id: "af-s4", name: "Cadbury Lunch Bar", brand: "Cadbury", weight: "48 g", price: 1.29, barcode: "6001065232003", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-s5", name: "Mama Africa Peri Peri Sauce", brand: "Mama Africa", weight: "250 ml", price: 3.99, barcode: "6009608500016", category: "food", continents: ["Africa"], countries: ["South Africa"] },

  { id: "af-p1", name: "Iwisa Maize Meal", brand: "Iwisa", weight: "2.5 kg", price: 3.49, barcode: "6001596000018", category: "food", continents: ["Africa"], countries: ["South Africa"] },
  { id: "af-p2", name: "Mama Gold Rice", brand: "Mama Gold", weight: "5 kg", price: 12.99, barcode: "6151100200016", category: "food", continents: ["Africa"], countries: ["Nigeria"] },

  // ═════════ SOUTH AMERICA ═════════
  { id: "sa-d1", name: "Guaraná Antarctica", brand: "Ambev", weight: "350 ml", price: 1.29, barcode: "7891991000208", category: "food", continents: ["South America"], countries: ["Brazil"] },
  { id: "sa-d2", name: "Inca Kola", brand: "Coca-Cola Peru", weight: "500 ml", price: 1.49, barcode: "7751271000019", category: "food", continents: ["South America"], countries: ["Peru"] },
  { id: "sa-d3", name: "Yerba Mate Taragüi", brand: "Taragüi", weight: "500 g", price: 5.99, barcode: "7790387007107", category: "food", continents: ["South America"], countries: ["Argentina"] },
  { id: "sa-d4", name: "Postobón Manzana", brand: "Postobón", weight: "1.5 L", price: 1.99, barcode: "7702026004029", category: "food", continents: ["South America"], countries: ["Colombia"] },

  { id: "sa-s1", name: "Brigadeiro Garoto", brand: "Garoto", weight: "250 g", price: 3.49, barcode: "7891008101010", category: "food", continents: ["South America"], countries: ["Brazil"] },
  { id: "sa-s2", name: "Alfajor Havanna Mixto", brand: "Havanna", weight: "55 g", price: 1.99, barcode: "7790580120023", category: "food", continents: ["South America"], countries: ["Argentina"] },
  { id: "sa-s3", name: "Sublime Chocolate", brand: "Nestlé Perú", weight: "32 g", price: 0.99, barcode: "7751158000010", category: "food", continents: ["South America"], countries: ["Peru"] },
  { id: "sa-s4", name: "Bauducco Panettone", brand: "Bauducco", weight: "500 g", price: 7.49, barcode: "7891962024108", category: "food", continents: ["South America"], countries: ["Brazil"] },

  { id: "sa-p1", name: "Harina PAN White Corn Flour", brand: "PAN", weight: "1 kg", price: 2.99, barcode: "7591182000017", category: "food", continents: ["South America"], countries: ["Venezuela", "Colombia"] },
  { id: "sa-p2", name: "Hellmann's Mayonesa", brand: "Hellmann's", weight: "475 g", price: 3.99, barcode: "7891150004900", category: "food", continents: ["South America"], countries: ["Brazil", "Argentina"] },

  // ═════════ OCEANIA ═════════
  { id: "oc-d1", name: "Bundaberg Ginger Beer", brand: "Bundaberg", weight: "375 ml", price: 2.49, barcode: "9311493000022", category: "food", continents: ["Oceania", "North America"], countries: ["Australia"] },
  { id: "oc-d2", name: "Pump Spring Water", brand: "Pump", weight: "750 ml", price: 2.99, barcode: "9300601000018", category: "food", continents: ["Oceania"], countries: ["Australia"] },
  { id: "oc-d3", name: "L&P Lemon & Paeroa", brand: "Coca-Cola NZ", weight: "1.5 L", price: 2.99, barcode: "9300675024907", category: "food", continents: ["Oceania"], countries: ["New Zealand"] },

  { id: "oc-s1", name: "Tim Tam Original", brand: "Arnott's", weight: "200 g", price: 3.99, barcode: "9310072001784", category: "food", continents: ["Oceania", "North America"], countries: ["Australia"] },
  { id: "oc-s2", name: "Vegemite", brand: "Bega", weight: "220 g", price: 5.49, barcode: "9300675024907", category: "food", continents: ["Oceania"], countries: ["Australia"] },
  { id: "oc-s3", name: "Whittaker's Creamy Milk", brand: "Whittaker's", weight: "250 g", price: 5.99, barcode: "9415005000058", category: "food", continents: ["Oceania"], countries: ["New Zealand"] },
  { id: "oc-s4", name: "Anzac Biscuits", brand: "Unibic", weight: "250 g", price: 3.49, barcode: "9310175019059", category: "food", continents: ["Oceania"], countries: ["Australia"] },

  // ═════════════════════════════════════
  //         COSMETICS & PERSONAL CARE
  // ═════════════════════════════════════

  // ── North America ──
  { id: "bna-1", name: "CeraVe Moisturizing Cream", brand: "CeraVe", weight: "340 g", price: 18.99, barcode: "3018712393155", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-2", name: "Aquaphor Healing Ointment", brand: "Aquaphor", weight: "99 g", price: 8.99, barcode: "0072140002671", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-3", name: "Olay Regenerist Micro-Sculpting Cream", brand: "Olay", weight: "48 g", price: 28.99, barcode: "0075609001895", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-4", name: "Neutrogena Hydro Boost Water Gel", brand: "Neutrogena", weight: "50 g", price: 19.99, barcode: "0070501054345", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-5", name: "Burt's Bees Beeswax Lip Balm", brand: "Burt's Bees", weight: "4.25 g", price: 3.99, barcode: "0792850012004", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-6", name: "Native Coconut & Vanilla Deodorant", brand: "Native", weight: "75 g", price: 12.99, barcode: "0810020660068", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-7", name: "Dr. Bronner's Pure-Castile Soap Lavender", brand: "Dr. Bronner's", weight: "473 ml", price: 11.99, barcode: "0018787770184", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-8", name: "Glossier Balm Dotcom", brand: "Glossier", weight: "15 ml", price: 14.00, barcode: "0851095007009", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-9", name: "Drunk Elephant Protini Polypeptide Cream", brand: "Drunk Elephant", weight: "50 ml", price: 68.00, barcode: "0810014320020", category: "beauty", continents: ["North America"], countries: ["United States"] },

  // ── Europe ──
  { id: "beu-1", name: "Nivea Soft Cream", brand: "Nivea", weight: "200 ml", price: 6.99, barcode: "4005900388957", category: "beauty", continents: ["Europe", "Africa"], countries: ["Germany"] },
  { id: "beu-2", name: "L'Oréal Elvive Total Repair Shampoo", brand: "L'Oréal", weight: "400 ml", price: 5.99, barcode: "3600523715473", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-3", name: "Dove Beauty Bar Original", brand: "Dove", weight: "100 g", price: 2.49, barcode: "0011111650107", category: "beauty", continents: ["Europe", "North America", "Asia", "Africa"], countries: ["United Kingdom"] },
  { id: "beu-4", name: "The Ordinary Niacinamide 10% + Zinc 1%", brand: "The Ordinary", weight: "30 ml", price: 6.50, barcode: "0769915190205", category: "beauty", continents: ["Europe", "North America"], countries: ["Canada", "United Kingdom"] },
  { id: "beu-5", name: "La Roche-Posay Anthelios SPF50", brand: "La Roche-Posay", weight: "50 ml", price: 19.99, barcode: "3337875546430", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-6", name: "Bioderma Sensibio H2O Micellar Water", brand: "Bioderma", weight: "500 ml", price: 16.50, barcode: "3401345752603", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-7", name: "Vichy Mineral 89", brand: "Vichy", weight: "50 ml", price: 28.50, barcode: "3337875543248", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-8", name: "Avène Thermal Spring Water", brand: "Avène", weight: "300 ml", price: 14.50, barcode: "3282770100822", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-9", name: "Weleda Skin Food", brand: "Weleda", weight: "75 ml", price: 18.99, barcode: "4001638095051", category: "beauty", continents: ["Europe"], countries: ["Switzerland"] },
  { id: "beu-10", name: "Lush Sleepy Body Lotion", brand: "Lush", weight: "215 g", price: 16.95, barcode: "5018065253293", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "beu-11", name: "Garnier Micellar Cleansing Water", brand: "Garnier", weight: "400 ml", price: 7.99, barcode: "3600541358287", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-12", name: "Eucerin Aquaphor Soothing Skin Balm", brand: "Eucerin", weight: "45 ml", price: 9.99, barcode: "4005800240010", category: "beauty", continents: ["Europe", "North America"], countries: ["Germany"] },

  // ── Asia (J-Beauty / K-Beauty / India) ──
  { id: "bas-1", name: "Hada Labo Gokujyun Hyaluronic Lotion", brand: "Hada Labo", weight: "170 ml", price: 14.99, barcode: "4987241125289", category: "beauty", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "bas-2", name: "Shiseido Hada Senka Perfect Whip", brand: "Shiseido", weight: "120 g", price: 8.99, barcode: "4901872467679", category: "beauty", continents: ["Asia"], countries: ["Japan"] },
  { id: "bas-3", name: "DHC Deep Cleansing Oil", brand: "DHC", weight: "200 ml", price: 28.00, barcode: "4511413302101", category: "beauty", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "bas-4", name: "Cosrx Advanced Snail 96 Mucin Power Essence", brand: "Cosrx", weight: "100 ml", price: 25.00, barcode: "8809416470016", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["South Korea"] },
  { id: "bas-5", name: "Laneige Lip Sleeping Mask Berry", brand: "Laneige", weight: "20 g", price: 24.00, barcode: "8809643506724", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-6", name: "Innisfree Green Tea Seed Serum", brand: "Innisfree", weight: "80 ml", price: 27.00, barcode: "8809843681741", category: "beauty", continents: ["Asia"], countries: ["South Korea"] },
  { id: "bas-7", name: "Beauty of Joseon Relief Sun SPF50+", brand: "Beauty of Joseon", weight: "50 ml", price: 18.00, barcode: "8809738320105", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["South Korea"] },
  { id: "bas-8", name: "SK-II Facial Treatment Essence", brand: "SK-II", weight: "230 ml", price: 195.00, barcode: "4979006054972", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["Japan"] },
  { id: "bas-9", name: "Himalaya Neem Face Wash", brand: "Himalaya", weight: "150 ml", price: 4.99, barcode: "8901138513375", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-10", name: "Patanjali Aloe Vera Gel", brand: "Patanjali", weight: "150 ml", price: 2.49, barcode: "8904109409127", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-11", name: "Mamaearth Onion Hair Oil", brand: "Mamaearth", weight: "250 ml", price: 8.99, barcode: "8904352497606", category: "beauty", continents: ["Asia"], countries: ["India"] },

  // ── Africa ──
  { id: "baf-1", name: "Shea Moisture Coconut & Hibiscus Curl Smoothie", brand: "Shea Moisture", weight: "326 g", price: 12.99, barcode: "0764302280040", category: "beauty", continents: ["Africa", "North America"], countries: ["Ghana", "United States"] },
  { id: "baf-2", name: "Black Opal Even True Brightening Serum", brand: "Black Opal", weight: "30 ml", price: 14.99, barcode: "0027131008286", category: "beauty", continents: ["Africa", "North America"], countries: ["Nigeria", "United States"] },
  { id: "baf-3", name: "Pure Argan Oil (Moroccan)", brand: "Argan Republic", weight: "100 ml", price: 19.99, barcode: "6111245620018", category: "beauty", continents: ["Africa", "Europe"], countries: ["Morocco"] },
  { id: "baf-4", name: "African Black Soap Original", brand: "Dudu-Osun", weight: "150 g", price: 4.99, barcode: "6151200006044", category: "beauty", continents: ["Africa", "North America"], countries: ["Nigeria"] },
  { id: "baf-5", name: "Camay Classic Soap", brand: "Camay", weight: "125 g", price: 1.29, barcode: "6221031491131", category: "beauty", continents: ["Africa", "Asia"], countries: ["Egypt"] },
  { id: "baf-6", name: "Dark and Lovely Au Naturale Moisture Souffle", brand: "Dark and Lovely", weight: "227 g", price: 8.99, barcode: "0072790004780", category: "beauty", continents: ["Africa", "North America"], countries: ["South Africa"] },

  // ── South America ──
  { id: "bsa-1", name: "Natura Ekos Murumuru Body Butter", brand: "Natura", weight: "150 g", price: 18.99, barcode: "7891350039127", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-2", name: "O Boticário Match Body Lotion", brand: "O Boticário", weight: "200 ml", price: 14.99, barcode: "7891350033149", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-3", name: "Granado Pink Glycerin Soap", brand: "Granado", weight: "90 g", price: 3.49, barcode: "7896512904108", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-4", name: "Yanbal Unique Hand Cream", brand: "Yanbal", weight: "75 ml", price: 8.99, barcode: "7707228012345", category: "beauty", continents: ["South America"], countries: ["Peru", "Colombia"] },

  // ── Oceania ──
  { id: "boc-1", name: "Aesop Resurrection Aromatique Hand Wash", brand: "Aesop", weight: "500 ml", price: 41.00, barcode: "9319944003253", category: "beauty", continents: ["Oceania", "Europe", "North America"], countries: ["Australia"] },
  { id: "boc-2", name: "Lanolips 101 Ointment Multi-Balm", brand: "Lanolips", weight: "10 g", price: 16.99, barcode: "9343055000016", category: "beauty", continents: ["Oceania", "North America"], countries: ["Australia"] },
  { id: "boc-3", name: "Sukin Signature Hydrating Mist Toner", brand: "Sukin", weight: "125 ml", price: 9.95, barcode: "9327693000041", category: "beauty", continents: ["Oceania"], countries: ["Australia"] },
  { id: "boc-4", name: "Trilogy Rosehip Oil Antioxidant+", brand: "Trilogy", weight: "20 ml", price: 32.99, barcode: "9421900519651", category: "beauty", continents: ["Oceania"], countries: ["New Zealand"] },
];

export interface Store {
  id: string;
  name: string;
  address: string;
  image: string;
}

// ─── Region helpers ───
// These power the region-aware discovery flows (Community, History, Search filters).

export function getProductsByContinent(continent: Continent): Product[] {
  return products.filter((p) => p.continents?.includes(continent));
}

export function getProductsByCountry(country: string): Product[] {
  return products.filter((p) => p.countries?.includes(country));
}

export function getProductsForStore(storeId: string): Product[] {
  return products.filter((p) => p.availableInStoreIds?.includes(storeId));
}

/** Crude country → continent map for reverse-geocoded city detection. */
export const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  "United States": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  "Brazil": "South America",
  "Argentina": "South America",
  "Colombia": "South America",
  "Peru": "South America",
  "Venezuela": "South America",
  "United Kingdom": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Italy": "Europe",
  "Spain": "Europe",
  "Switzerland": "Europe",
  "Sweden": "Europe",
  "Belgium": "Europe",
  "Austria": "Europe",
  "South Africa": "Africa",
  "Nigeria": "Africa",
  "Kenya": "Africa",
  "Morocco": "Africa",
  "Egypt": "Africa",
  "Ghana": "Africa",
  "Zambia": "Africa",
  "Zimbabwe": "Africa",
  "Senegal": "Africa",
  "Japan": "Asia",
  "South Korea": "Asia",
  "China": "Asia",
  "India": "Asia",
  "Indonesia": "Asia",
  "Thailand": "Asia",
  "Singapore": "Asia",
  "Hong Kong": "Asia",
  "Taiwan": "Asia",
  "Australia": "Oceania",
  "New Zealand": "Oceania",
};
