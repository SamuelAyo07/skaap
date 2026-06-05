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

  // ═════════ EXTRA POPULAR SCANS (mixed regions) ═════════
  { id: "x-1", name: "Perrier Sparkling Mineral Water", brand: "Perrier", weight: "750 ml", price: 2.29, barcode: "7640112310005", category: "food", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "x-2", name: "Häagen-Dazs Vanilla Ice Cream", brand: "Häagen-Dazs", weight: "460 ml", price: 6.49, barcode: "0074570003402", category: "food", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "x-3", name: "Ben & Jerry's Cookie Dough", brand: "Ben & Jerry's", weight: "473 ml", price: 6.99, barcode: "0076840100279", category: "food", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "x-4", name: "Tropicana Pure Premium Orange Juice", brand: "Tropicana", weight: "1.75 L", price: 4.99, barcode: "0048500015797", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-5", name: "Activia Strawberry Yogurt", brand: "Danone", weight: "113 g", price: 1.19, barcode: "0036632001016", category: "food", continents: ["North America", "Europe"], countries: ["France"] },
  { id: "x-6", name: "Kind Bar Dark Chocolate Almond Mint", brand: "KIND", weight: "40 g", price: 1.99, barcode: "0602652171338", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-7", name: "Clif Bar Chocolate Chip", brand: "Clif Bar", weight: "68 g", price: 1.79, barcode: "0722252100900", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-8", name: "Siggi's Vanilla Skyr", brand: "Siggi's", weight: "150 g", price: 2.29, barcode: "0898248001070", category: "food", continents: ["North America"], countries: ["Iceland"] },
  { id: "x-9", name: "Annie's Mac & Cheese Shells White Cheddar", brand: "Annie's", weight: "170 g", price: 2.99, barcode: "0013562000180", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-10", name: "Tate's Bake Shop Chocolate Chip Cookies", brand: "Tate's", weight: "198 g", price: 4.99, barcode: "0810291002115", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-11", name: "Califia Farms Oat Barista Blend", brand: "Califia Farms", weight: "946 ml", price: 5.49, barcode: "0813636020546", category: "food", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "x-12", name: "GT's Synergy Kombucha Gingerade", brand: "GT's Living Foods", weight: "473 ml", price: 3.99, barcode: "0722430240015", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-13", name: "Stonyfield Organic Whole Milk Yogurt", brand: "Stonyfield", weight: "907 g", price: 5.99, barcode: "0052159003111", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-14", name: "Talenti Sea Salt Caramel Gelato", brand: "Talenti", weight: "473 ml", price: 5.99, barcode: "0072500009363", category: "food", continents: ["North America"], countries: ["United States"] },
  { id: "x-15", name: "Sabra Classic Hummus", brand: "Sabra", weight: "283 g", price: 4.49, barcode: "0040822015103", category: "food", continents: ["North America"], countries: ["United States"] },

  // Extra beauty / cosmetics
  { id: "bx-1", name: "Rare Beauty Soft Pinch Liquid Blush", brand: "Rare Beauty", weight: "7.5 ml", price: 23.00, barcode: "0840066700258", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bx-2", name: "Fenty Beauty Pro Filt'r Soft Matte Foundation", brand: "Fenty Beauty", weight: "32 ml", price: 39.00, barcode: "3700033301029", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bx-3", name: "Charlotte Tilbury Magic Cream", brand: "Charlotte Tilbury", weight: "50 ml", price: 100.00, barcode: "5060542721126", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "bx-4", name: "Glow Recipe Watermelon Glow Niacinamide Dew Drops", brand: "Glow Recipe", weight: "40 ml", price: 35.00, barcode: "0810059381056", category: "beauty", continents: ["North America", "Asia"], countries: ["United States"] },
  { id: "bx-5", name: "Tatcha The Dewy Skin Cream", brand: "Tatcha", weight: "50 ml", price: 72.00, barcode: "0856509006008", category: "beauty", continents: ["North America", "Asia"], countries: ["Japan", "United States"] },
  { id: "bx-6", name: "Paula's Choice 2% BHA Liquid Exfoliant", brand: "Paula's Choice", weight: "118 ml", price: 32.00, barcode: "0655439021014", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },

  // ═════════════════════════════════════
  //   COSMETICS EXPANSION — OnSkin-style
  //   Clean global catalog, English labels
  // ═════════════════════════════════════

  // ── USA / North America — Skincare ──
  { id: "bna-x1", name: "CeraVe Hydrating Facial Cleanser", brand: "CeraVe", weight: "355 ml", price: 16.99, barcode: "0301871239255", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x2", name: "CeraVe Foaming Facial Cleanser", brand: "CeraVe", weight: "473 ml", price: 17.99, barcode: "0301871239361", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x3", name: "CeraVe SA Smoothing Cream", brand: "CeraVe", weight: "340 g", price: 19.99, barcode: "0301871527192", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x4", name: "Cetaphil Gentle Skin Cleanser", brand: "Cetaphil", weight: "473 ml", price: 13.99, barcode: "0302993916164", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x5", name: "Cetaphil Daily Facial Moisturizer SPF 35", brand: "Cetaphil", weight: "118 ml", price: 17.99, barcode: "0302993917284", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x6", name: "Eucerin Advanced Repair Lotion", brand: "Eucerin", weight: "500 ml", price: 14.99, barcode: "0072140635138", category: "beauty", continents: ["North America", "Europe"], countries: ["United States", "Germany"] },
  { id: "bna-x7", name: "Aveeno Daily Moisturizing Lotion", brand: "Aveeno", weight: "532 ml", price: 11.99, barcode: "0381371151608", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x8", name: "Aveeno Calm + Restore Oat Gel Moisturizer", brand: "Aveeno", weight: "50 ml", price: 19.99, barcode: "0381371176335", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x9", name: "Neutrogena Ultra Sheer Dry-Touch SPF 55", brand: "Neutrogena", weight: "88 ml", price: 11.99, barcode: "0086800872245", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x10", name: "Neutrogena Rapid Wrinkle Repair Retinol Serum", brand: "Neutrogena", weight: "30 ml", price: 25.99, barcode: "0070501055342", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x11", name: "EltaMD UV Clear Broad-Spectrum SPF 46", brand: "EltaMD", weight: "48 g", price: 41.00, barcode: "0827854011484", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x12", name: "Supergoop! Unseen Sunscreen SPF 40", brand: "Supergoop!", weight: "50 ml", price: 38.00, barcode: "0810026140090", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x13", name: "Youth To The People Superfood Cleanser", brand: "Youth To The People", weight: "237 ml", price: 39.00, barcode: "0860001905021", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x14", name: "Kiehl's Ultra Facial Cream", brand: "Kiehl's", weight: "125 ml", price: 56.00, barcode: "3605970360337", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x15", name: "First Aid Beauty Ultra Repair Cream", brand: "First Aid Beauty", weight: "170 g", price: 38.00, barcode: "0858770000956", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x16", name: "Olaplex No.3 Hair Perfector", brand: "Olaplex", weight: "100 ml", price: 30.00, barcode: "0850018802031", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x17", name: "Briogeo Don't Despair, Repair! Mask", brand: "Briogeo", weight: "236 ml", price: 38.00, barcode: "0810004710054", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x18", name: "Maybelline Fit Me Matte + Poreless Foundation", brand: "Maybelline", weight: "30 ml", price: 8.99, barcode: "0041554434125", category: "beauty", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "bna-x19", name: "Maybelline Lash Sensational Mascara", brand: "Maybelline", weight: "9.5 ml", price: 9.99, barcode: "0041554485936", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x20", name: "e.l.f. Halo Glow Liquid Filter", brand: "e.l.f.", weight: "31.5 ml", price: 14.00, barcode: "0609332128293", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x21", name: "NYX Professional Butter Gloss", brand: "NYX", weight: "8 ml", price: 5.50, barcode: "0800897818906", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bna-x22", name: "Carmex Classic Lip Balm", brand: "Carmex", weight: "10 g", price: 2.49, barcode: "0083078001025", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x23", name: "Old Spice High Endurance Deodorant", brand: "Old Spice", weight: "85 g", price: 4.99, barcode: "0012044001844", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x24", name: "Secret Aluminum Free Deodorant Lavender", brand: "Secret", weight: "68 g", price: 5.99, barcode: "0037000758884", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x25", name: "Tom's of Maine Wicked Fresh Toothpaste", brand: "Tom's of Maine", weight: "113 g", price: 5.49, barcode: "0077326830963", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x26", name: "Crest 3D White Brilliance Toothpaste", brand: "Crest", weight: "116 g", price: 5.99, barcode: "0037000506232", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x27", name: "Hero Mighty Patch Original", brand: "Hero Cosmetics", weight: "36 patches", price: 12.99, barcode: "0810054420019", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bna-x28", name: "Kosas Revealer Concealer", brand: "Kosas", weight: "6 ml", price: 32.00, barcode: "0850008051083", category: "beauty", continents: ["North America"], countries: ["United States"] },

  // ── Europe — Skincare / Pharmacy ──
  { id: "beu-x1", name: "La Roche-Posay Effaclar Duo+", brand: "La Roche-Posay", weight: "40 ml", price: 19.99, barcode: "3337875517065", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x2", name: "La Roche-Posay Toleriane Double Repair Moisturizer", brand: "La Roche-Posay", weight: "75 ml", price: 21.99, barcode: "3606000539525", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x3", name: "La Roche-Posay Cicaplast Baume B5", brand: "La Roche-Posay", weight: "40 ml", price: 16.50, barcode: "3337872413773", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x4", name: "Avène Tolérance Extrême Cream", brand: "Avène", weight: "50 ml", price: 21.00, barcode: "3282770204117", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x5", name: "Embryolisse Lait-Crème Concentré", brand: "Embryolisse", weight: "75 ml", price: 28.00, barcode: "3350900000028", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x6", name: "Caudalie Vinopure Pore Minimising Serum", brand: "Caudalie", weight: "30 ml", price: 39.00, barcode: "3522930002956", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x7", name: "Klorane Dry Shampoo with Oat Milk", brand: "Klorane", weight: "150 ml", price: 11.99, barcode: "3282770037630", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x8", name: "Nuxe Huile Prodigieuse Multi-Purpose Dry Oil", brand: "Nuxe", weight: "100 ml", price: 32.00, barcode: "3264680001062", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "beu-x9", name: "Diadermine Lift+ Hyaluron Day Cream", brand: "Diadermine", weight: "50 ml", price: 8.99, barcode: "4015100182729", category: "beauty", continents: ["Europe"], countries: ["Germany"] },
  { id: "beu-x10", name: "Balea Vital Anti-Falten Tagescreme Q10", brand: "Balea", weight: "50 ml", price: 2.95, barcode: "4010355158758", category: "beauty", continents: ["Europe"], countries: ["Germany"] },
  { id: "beu-x11", name: "Mixa Hyalurogel Light", brand: "Mixa", weight: "50 ml", price: 6.99, barcode: "3600550363432", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x12", name: "Yves Rocher Hydra Végétal Moisturizing Cream", brand: "Yves Rocher", weight: "50 ml", price: 19.50, barcode: "3660005138595", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x13", name: "Sanex Zero% Sensitive Skin Shower Gel", brand: "Sanex", weight: "500 ml", price: 3.49, barcode: "8718951259089", category: "beauty", continents: ["Europe"], countries: ["United Kingdom", "Spain"] },
  { id: "beu-x14", name: "Le Petit Marseillais Extra Gentle Shower Cream Honey", brand: "Le Petit Marseillais", weight: "650 ml", price: 4.99, barcode: "3574661319049", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x15", name: "Sanctuary Spa Body Lotion", brand: "Sanctuary Spa", weight: "250 ml", price: 8.50, barcode: "5060438970233", category: "beauty", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "beu-x16", name: "Soap & Glory Original Pink Body Wash", brand: "Soap & Glory", weight: "500 ml", price: 7.50, barcode: "5045097807298", category: "beauty", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "beu-x17", name: "Liz Earle Cleanse & Polish Hot Cloth Cleanser", brand: "Liz Earle", weight: "100 ml", price: 26.00, barcode: "5060138747166", category: "beauty", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "beu-x18", name: "Rimmel London Stay Matte Pressed Powder", brand: "Rimmel", weight: "14 g", price: 5.99, barcode: "3614223641352", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "beu-x19", name: "Max Factor Lasting Performance Foundation", brand: "Max Factor", weight: "35 ml", price: 11.99, barcode: "5011321338647", category: "beauty", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "beu-x20", name: "Bourjois Healthy Mix Foundation", brand: "Bourjois", weight: "30 ml", price: 12.99, barcode: "3614225612008", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x21", name: "Catrice HD Liquid Coverage Foundation", brand: "Catrice", weight: "30 ml", price: 6.99, barcode: "4059729273345", category: "beauty", continents: ["Europe"], countries: ["Germany"] },
  { id: "beu-x22", name: "Essence Lash Princess False Lash Mascara", brand: "Essence", weight: "12 ml", price: 4.99, barcode: "4250338408023", category: "beauty", continents: ["Europe", "North America"], countries: ["Germany"] },
  { id: "beu-x23", name: "Schwarzkopf Gliss Ultimate Repair Shampoo", brand: "Schwarzkopf", weight: "400 ml", price: 4.99, barcode: "9000101213164", category: "beauty", continents: ["Europe"], countries: ["Germany"] },
  { id: "beu-x24", name: "Pantene Pro-V Repair & Protect Shampoo", brand: "Pantene", weight: "400 ml", price: 5.99, barcode: "8001090373229", category: "beauty", continents: ["Europe", "North America"], countries: ["Switzerland"] },
  { id: "beu-x25", name: "Head & Shoulders Classic Clean Shampoo", brand: "Head & Shoulders", weight: "400 ml", price: 5.49, barcode: "8001090803634", category: "beauty", continents: ["Europe", "North America"], countries: ["Switzerland"] },
  { id: "beu-x26", name: "Sensodyne Pronamel Daily Protection", brand: "Sensodyne", weight: "75 ml", price: 5.49, barcode: "5054563063205", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "beu-x27", name: "Colgate Total Original Toothpaste", brand: "Colgate", weight: "75 ml", price: 2.99, barcode: "8714789909394", category: "beauty", continents: ["Europe", "North America", "Africa", "Asia"], countries: ["United Kingdom"] },
  { id: "beu-x28", name: "Rexona Cobalt Dry Antiperspirant", brand: "Rexona", weight: "150 ml", price: 4.49, barcode: "8717644511275", category: "beauty", continents: ["Europe", "Oceania"], countries: ["United Kingdom"] },
  { id: "beu-x29", name: "Bioderma Atoderm Shower Oil", brand: "Bioderma", weight: "1 L", price: 22.99, barcode: "3401399233319", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "beu-x30", name: "Filorga NCEF-Reverse Cream", brand: "Filorga", weight: "50 ml", price: 119.00, barcode: "3540550009315", category: "beauty", continents: ["Europe"], countries: ["France"] },

  // ── Asia — K-Beauty / J-Beauty / India ──
  { id: "bas-x1", name: "Cosrx Low pH Good Morning Gel Cleanser", brand: "Cosrx", weight: "150 ml", price: 13.00, barcode: "8809416470191", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["South Korea"] },
  { id: "bas-x2", name: "Cosrx Acne Pimple Master Patch", brand: "Cosrx", weight: "24 patches", price: 5.50, barcode: "8809416470054", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["South Korea"] },
  { id: "bas-x3", name: "Some By Mi AHA-BHA-PHA 30 Days Miracle Toner", brand: "Some By Mi", weight: "150 ml", price: 17.00, barcode: "8809647391616", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x4", name: "Anua Heartleaf 77% Soothing Toner", brand: "Anua", weight: "250 ml", price: 22.00, barcode: "8809701166063", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x5", name: "Beauty of Joseon Glow Serum Propolis + Niacinamide", brand: "Beauty of Joseon", weight: "30 ml", price: 17.00, barcode: "8809738320020", category: "beauty", continents: ["Asia", "North America", "Europe"], countries: ["South Korea"] },
  { id: "bas-x6", name: "Round Lab 1025 Dokdo Toner", brand: "Round Lab", weight: "200 ml", price: 19.00, barcode: "8809563820145", category: "beauty", continents: ["Asia"], countries: ["South Korea"] },
  { id: "bas-x7", name: "Sulwhasoo First Care Activating Serum", brand: "Sulwhasoo", weight: "90 ml", price: 105.00, barcode: "8809685797234", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x8", name: "Etude House SoonJung pH 6.5 Whip Cleanser", brand: "Etude House", weight: "150 ml", price: 11.00, barcode: "8806199465260", category: "beauty", continents: ["Asia"], countries: ["South Korea"] },
  { id: "bas-x9", name: "Missha Time Revolution The First Treatment Essence", brand: "Missha", weight: "150 ml", price: 49.00, barcode: "8809530037294", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x10", name: "Banila Co Clean It Zero Cleansing Balm", brand: "Banila Co", weight: "100 ml", price: 19.00, barcode: "8809549752073", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x11", name: "Mediheal N.M.F Aquaring Ampoule Mask", brand: "Mediheal", weight: "27 ml", price: 2.50, barcode: "8809470120115", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x12", name: "Round Lab Birch Juice Moisturizing Sunscreen", brand: "Round Lab", weight: "50 ml", price: 23.00, barcode: "8809563820237", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x13", name: "Biore UV Aqua Rich Watery Essence SPF50+", brand: "Biore", weight: "50 g", price: 14.00, barcode: "4901301348791", category: "beauty", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "bas-x14", name: "Kao Curel Intensive Moisture Cream", brand: "Curel", weight: "40 g", price: 28.00, barcode: "4901301236241", category: "beauty", continents: ["Asia"], countries: ["Japan"] },
  { id: "bas-x15", name: "Senka Perfect Whip Collagen In", brand: "Shiseido", weight: "120 g", price: 9.50, barcode: "4901872934973", category: "beauty", continents: ["Asia"], countries: ["Japan"] },
  { id: "bas-x16", name: "Kose Softymo Speedy Cleansing Oil", brand: "Kose", weight: "230 ml", price: 12.99, barcode: "4971710384529", category: "beauty", continents: ["Asia"], countries: ["Japan"] },
  { id: "bas-x17", name: "Rohto Melano CC Vitamin C Brightening Essence", brand: "Rohto", weight: "20 ml", price: 11.99, barcode: "4987241148448", category: "beauty", continents: ["Asia", "North America"], countries: ["Japan"] },
  { id: "bas-x18", name: "Kiehl's Calendula Herbal-Extract Toner", brand: "Kiehl's", weight: "250 ml", price: 50.00, barcode: "3700194713492", category: "beauty", continents: ["Asia", "Europe", "North America"], countries: ["Japan"] },
  { id: "bas-x19", name: "Forest Essentials Kashmiri Saffron Face Wash", brand: "Forest Essentials", weight: "50 ml", price: 14.00, barcode: "8906019070125", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-x20", name: "Biotique Bio Honey Gel Refreshing Foaming Face Wash", brand: "Biotique", weight: "150 ml", price: 4.99, barcode: "8902297002164", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-x21", name: "Lakmé Absolute Argan Oil Serum Foundation", brand: "Lakmé", weight: "30 ml", price: 14.00, barcode: "8901030676574", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-x22", name: "Plum Green Tea Pore Cleansing Face Wash", brand: "Plum", weight: "75 ml", price: 4.50, barcode: "8907473000086", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-x23", name: "WOW Skin Science Apple Cider Vinegar Shampoo", brand: "WOW", weight: "300 ml", price: 8.99, barcode: "8903540009025", category: "beauty", continents: ["Asia"], countries: ["India"] },
  { id: "bas-x24", name: "The Face Shop Rice Water Bright Cleansing Foam", brand: "The Face Shop", weight: "150 ml", price: 8.00, barcode: "8806182594175", category: "beauty", continents: ["Asia"], countries: ["South Korea"] },
  { id: "bas-x25", name: "Skinfood Black Sugar Mask Wash Off", brand: "Skinfood", weight: "100 g", price: 11.00, barcode: "8809321666384", category: "beauty", continents: ["Asia"], countries: ["South Korea"] },
  { id: "bas-x26", name: "Pyunkang Yul Essence Toner", brand: "Pyunkang Yul", weight: "200 ml", price: 19.00, barcode: "8809486680193", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },
  { id: "bas-x27", name: "Klairs Supple Preparation Unscented Toner", brand: "Klairs", weight: "180 ml", price: 22.00, barcode: "8809115023421", category: "beauty", continents: ["Asia", "North America"], countries: ["South Korea"] },

  // ── Africa & Middle East ──
  { id: "baf-x1", name: "Cantu Shea Butter Leave-In Conditioning Cream", brand: "Cantu", weight: "340 g", price: 7.99, barcode: "0817513010057", category: "beauty", continents: ["Africa", "North America", "Europe"], countries: ["United States", "South Africa"] },
  { id: "baf-x2", name: "Mielle Rosemary Mint Strengthening Hair Oil", brand: "Mielle", weight: "59 ml", price: 9.99, barcode: "0854532008012", category: "beauty", continents: ["Africa", "North America"], countries: ["United States"] },
  { id: "baf-x3", name: "Garnier Ultra Doux Honey Treasures Shampoo", brand: "Garnier", weight: "400 ml", price: 5.49, barcode: "3600542023719", category: "beauty", continents: ["Africa", "Europe"], countries: ["France", "South Africa"] },
  { id: "baf-x4", name: "Palmer's Cocoa Butter Formula Body Lotion", brand: "Palmer's", weight: "400 ml", price: 8.99, barcode: "0010181040108", category: "beauty", continents: ["Africa", "North America", "Europe"], countries: ["United States"] },
  { id: "baf-x5", name: "Oraimo Pure Coconut Oil Hair & Skin", brand: "Pure Coco", weight: "250 ml", price: 6.99, barcode: "6291045932014", category: "beauty", continents: ["Africa"], countries: ["Kenya"] },
  { id: "baf-x6", name: "Nivea Black & White Invisible Deodorant", brand: "Nivea", weight: "150 ml", price: 3.99, barcode: "4005900388841", category: "beauty", continents: ["Africa", "Europe"], countries: ["Germany", "South Africa"] },
  { id: "baf-x7", name: "Cussons Imperial Leather Original Soap", brand: "Cussons", weight: "100 g", price: 0.99, barcode: "5000101058332", category: "beauty", continents: ["Africa", "Europe"], countries: ["United Kingdom", "Nigeria"] },
  { id: "baf-x8", name: "Vaseline Cocoa Radiant Body Lotion", brand: "Vaseline", weight: "400 ml", price: 5.99, barcode: "8901030624858", category: "beauty", continents: ["Africa", "Asia", "North America"], countries: ["South Africa", "India"] },
  { id: "baf-x9", name: "Bio-Oil Skincare Body Oil", brand: "Bio-Oil", weight: "125 ml", price: 14.99, barcode: "6001159119272", category: "beauty", continents: ["Africa", "Europe", "North America"], countries: ["South Africa"] },
  { id: "baf-x10", name: "Ghassoul Moroccan Clay Powder", brand: "Argan Republic", weight: "200 g", price: 9.99, barcode: "6111245620049", category: "beauty", continents: ["Africa", "Europe"], countries: ["Morocco"] },
  { id: "baf-x11", name: "Marula Pure Beauty Oil", brand: "African Botanics", weight: "30 ml", price: 95.00, barcode: "6009880840083", category: "beauty", continents: ["Africa", "North America"], countries: ["South Africa"] },
  { id: "baf-x12", name: "ORS Olive Oil Replenishing Conditioner", brand: "ORS", weight: "362 g", price: 7.49, barcode: "0632169110407", category: "beauty", continents: ["Africa", "North America"], countries: ["Nigeria", "United States"] },
  { id: "baf-x13", name: "Carotone Light & Natural Body Lotion", brand: "Carotone", weight: "550 ml", price: 8.99, barcode: "6181100120145", category: "beauty", continents: ["Africa"], countries: ["Senegal", "Nigeria"] },
  { id: "baf-x14", name: "Fair & White So White! Brightening Cream", brand: "Fair & White", weight: "50 ml", price: 12.99, barcode: "3760041011089", category: "beauty", continents: ["Africa", "Europe"], countries: ["France"] },

  // ── Oceania ──
  { id: "boc-x1", name: "Sukin Purely Ageless Reviving Eye Contour Serum", brand: "Sukin", weight: "30 ml", price: 19.95, barcode: "9327693002816", category: "beauty", continents: ["Oceania", "Europe"], countries: ["Australia"] },
  { id: "boc-x2", name: "Aesop Parsley Seed Anti-Oxidant Serum", brand: "Aesop", weight: "100 ml", price: 105.00, barcode: "9319944003857", category: "beauty", continents: ["Oceania", "Europe", "North America"], countries: ["Australia"] },
  { id: "boc-x3", name: "Go-To Face Hero Face Oil", brand: "Go-To", weight: "30 ml", price: 45.00, barcode: "0793573108036", category: "beauty", continents: ["Oceania", "North America"], countries: ["Australia"] },
  { id: "boc-x4", name: "Frank Body Original Coffee Scrub", brand: "Frank Body", weight: "200 g", price: 18.95, barcode: "9342419000018", category: "beauty", continents: ["Oceania", "North America", "Europe"], countries: ["Australia"] },
  { id: "boc-x5", name: "Antipodes Avocado Pear Nourishing Night Cream", brand: "Antipodes", weight: "60 ml", price: 47.00, barcode: "9421900545029", category: "beauty", continents: ["Oceania", "Europe"], countries: ["New Zealand"] },
  { id: "boc-x6", name: "Ego QV Skin Lotion", brand: "QV", weight: "500 ml", price: 14.99, barcode: "9314839000119", category: "beauty", continents: ["Oceania", "Asia"], countries: ["Australia"] },
  { id: "boc-x7", name: "Jurlique Rosewater Balancing Mist", brand: "Jurlique", weight: "100 ml", price: 39.00, barcode: "0708177117339", category: "beauty", continents: ["Oceania", "North America"], countries: ["Australia"] },

  // ── South America ──
  { id: "bsa-x1", name: "Natura Tododia Cotton Flower Body Lotion", brand: "Natura", weight: "400 ml", price: 13.99, barcode: "7891350039165", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-x2", name: "Granado Phebo Coconut Glycerin Soap", brand: "Granado", weight: "90 g", price: 3.99, barcode: "7896512904207", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-x3", name: "Vult Make Up Liquid Foundation", brand: "Vult", weight: "30 ml", price: 6.99, barcode: "7899593602216", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-x4", name: "Risqué Esmalte Cremoso", brand: "Risqué", weight: "8 ml", price: 1.99, barcode: "7891182100182", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-x5", name: "Salon Line #todecacho Curl Activator", brand: "Salon Line", weight: "300 g", price: 5.49, barcode: "7898586470203", category: "beauty", continents: ["South America"], countries: ["Brazil"] },
  { id: "bsa-x6", name: "L'Bel Aqua Pura Moisturizing Cream", brand: "L'Bel", weight: "50 ml", price: 24.99, barcode: "7704350123412", category: "beauty", continents: ["South America"], countries: ["Colombia"] },

  // ═════════════════════════════════════
  //   BODY CREAMS, LOTIONS & PERSONAL CARE
  //   Verified EAN/UPC barcodes (OFF/OBF)
  // ═════════════════════════════════════

  // ── Body lotions & creams (US/global) ──
  { id: "bc-1", name: "Vaseline Intensive Care Advanced Repair Lotion", brand: "Vaseline", weight: "600 ml", price: 6.99, barcode: "0305210139008", category: "beauty", continents: ["North America", "Europe", "Asia", "Africa"], countries: ["United States"] },
  { id: "bc-2", name: "Vaseline Cocoa Radiant Body Lotion", brand: "Vaseline", weight: "600 ml", price: 7.49, barcode: "0305210208001", category: "beauty", continents: ["North America", "Europe", "Africa"], countries: ["United States"] },
  { id: "bc-3", name: "Vaseline Aloe Soothe Body Lotion", brand: "Vaseline", weight: "600 ml", price: 6.99, barcode: "0305210139015", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-4", name: "Nivea Essentially Enriched Body Lotion", brand: "Nivea", weight: "500 ml", price: 8.99, barcode: "0072140017583", category: "beauty", continents: ["North America", "Europe"], countries: ["United States", "Germany"] },
  { id: "bc-5", name: "Nivea Creme Tin", brand: "Nivea", weight: "400 ml", price: 9.99, barcode: "4005808175840", category: "beauty", continents: ["Europe", "Africa", "Asia", "North America"], countries: ["Germany"] },
  { id: "bc-6", name: "Nivea Cocoa Butter Body Lotion", brand: "Nivea", weight: "500 ml", price: 7.99, barcode: "0072140017637", category: "beauty", continents: ["North America", "Europe", "Africa"], countries: ["Germany"] },
  { id: "bc-7", name: "Nivea Q10 Firming Body Lotion", brand: "Nivea", weight: "400 ml", price: 10.99, barcode: "4005900424259", category: "beauty", continents: ["Europe", "North America"], countries: ["Germany"] },
  { id: "bc-8", name: "Jergens Original Scent Body Moisturizer", brand: "Jergens", weight: "621 ml", price: 6.49, barcode: "0019100109315", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-9", name: "Jergens Ultra Healing Extra Dry Skin Moisturizer", brand: "Jergens", weight: "621 ml", price: 6.99, barcode: "0019100109193", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-10", name: "Jergens Shea Butter Deep Conditioning Moisturizer", brand: "Jergens", weight: "621 ml", price: 6.99, barcode: "0019100109490", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-11", name: "Aveeno Skin Relief Moisturizing Lotion", brand: "Aveeno", weight: "532 ml", price: 12.99, barcode: "0381371169016", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-12", name: "Aveeno Positively Radiant Daily Moisturizer SPF 30", brand: "Aveeno", weight: "75 ml", price: 17.99, barcode: "0381371018207", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-13", name: "Aveeno Baby Daily Moisture Lotion", brand: "Aveeno", weight: "227 ml", price: 8.99, barcode: "0381370036050", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-14", name: "CeraVe Daily Moisturizing Lotion", brand: "CeraVe", weight: "473 ml", price: 17.99, barcode: "0301871239286", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-15", name: "CeraVe Itch Relief Moisturizing Lotion", brand: "CeraVe", weight: "237 ml", price: 14.99, barcode: "0301872452301", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-16", name: "CeraVe Baby Moisturizing Lotion", brand: "CeraVe", weight: "237 ml", price: 13.99, barcode: "0301872475300", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-17", name: "Cetaphil Moisturizing Cream", brand: "Cetaphil", weight: "566 g", price: 18.99, barcode: "0302993916416", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-18", name: "Cetaphil Moisturizing Lotion", brand: "Cetaphil", weight: "591 ml", price: 14.99, barcode: "0302993917000", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-19", name: "Eucerin Original Healing Rich Cream", brand: "Eucerin", weight: "454 g", price: 18.99, barcode: "0072140000202", category: "beauty", continents: ["North America", "Europe"], countries: ["Germany"] },
  { id: "bc-20", name: "Eucerin Skin Calming Daily Moisturizing Cream", brand: "Eucerin", weight: "397 g", price: 16.99, barcode: "0072140634780", category: "beauty", continents: ["North America"], countries: ["Germany"] },
  { id: "bc-21", name: "Curel Ultra Healing Intensive Lotion", brand: "Curel", weight: "591 ml", price: 9.99, barcode: "0019045101238", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-22", name: "Curel Itch Defense Calming Lotion", brand: "Curel", weight: "591 ml", price: 10.99, barcode: "0019045101283", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-23", name: "Gold Bond Ultimate Healing Lotion", brand: "Gold Bond", weight: "414 ml", price: 8.99, barcode: "0041167072011", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-24", name: "Gold Bond Crepe Corrector Body Lotion", brand: "Gold Bond", weight: "227 g", price: 16.99, barcode: "0041167072530", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-25", name: "Palmer's Cocoa Butter Formula Body Lotion", brand: "Palmer's", weight: "400 ml", price: 6.99, barcode: "0010181040146", category: "beauty", continents: ["North America", "Europe", "Africa"], countries: ["United States"] },
  { id: "bc-26", name: "Palmer's Cocoa Butter Formula Solid Jar", brand: "Palmer's", weight: "200 g", price: 7.49, barcode: "0010181040115", category: "beauty", continents: ["North America", "Europe", "Africa"], countries: ["United States"] },
  { id: "bc-27", name: "Palmer's Coconut Oil Body Lotion", brand: "Palmer's", weight: "400 ml", price: 7.99, barcode: "0010181048708", category: "beauty", continents: ["North America", "Africa"], countries: ["United States"] },
  { id: "bc-28", name: "Bath & Body Works A Thousand Wishes Body Lotion", brand: "Bath & Body Works", weight: "236 ml", price: 14.50, barcode: "0667544065486", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-29", name: "Bath & Body Works Japanese Cherry Blossom Body Lotion", brand: "Bath & Body Works", weight: "236 ml", price: 14.50, barcode: "0667543000074", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-30", name: "Bath & Body Works Warm Vanilla Sugar Body Cream", brand: "Bath & Body Works", weight: "226 g", price: 16.50, barcode: "0667535260691", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-31", name: "Olay Body Wash with B3 Vitamin Complex", brand: "Olay", weight: "650 ml", price: 7.99, barcode: "0075609201929", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-32", name: "Olay Quench Ultra Moisture Body Lotion Shea Butter", brand: "Olay", weight: "502 ml", price: 8.99, barcode: "0075609001550", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-33", name: "Dove DermaSeries Body Lotion Fragrance Free", brand: "Dove", weight: "400 ml", price: 12.99, barcode: "0011111035317", category: "beauty", continents: ["North America", "Europe"], countries: ["United Kingdom"] },
  { id: "bc-34", name: "Dove Deep Moisture Body Wash", brand: "Dove", weight: "650 ml", price: 7.49, barcode: "0011111032323", category: "beauty", continents: ["North America", "Europe"], countries: ["United Kingdom"] },
  { id: "bc-35", name: "Dove Body Love Intensive Care Lotion", brand: "Dove", weight: "400 ml", price: 10.99, barcode: "0011111033771", category: "beauty", continents: ["North America"], countries: ["United Kingdom"] },
  { id: "bc-36", name: "Sol de Janeiro Brazilian Bum Bum Cream", brand: "Sol de Janeiro", weight: "240 ml", price: 48.00, barcode: "0810912030008", category: "beauty", continents: ["North America", "Europe"], countries: ["Brazil", "United States"] },
  { id: "bc-37", name: "Sol de Janeiro Coco Cabana Cream", brand: "Sol de Janeiro", weight: "240 ml", price: 48.00, barcode: "0810912030534", category: "beauty", continents: ["North America"], countries: ["Brazil"] },
  { id: "bc-38", name: "Bio-Oil Skincare Body Oil", brand: "Bio-Oil", weight: "200 ml", price: 24.99, barcode: "6001159119715", category: "beauty", continents: ["Africa", "Europe", "North America", "Asia"], countries: ["South Africa"] },
  { id: "bc-39", name: "Bio-Oil Dry Skin Gel", brand: "Bio-Oil", weight: "200 ml", price: 22.99, barcode: "6001159135715", category: "beauty", continents: ["Africa", "Europe", "North America"], countries: ["South Africa"] },
  { id: "bc-40", name: "L'Occitane Shea Butter Hand Cream", brand: "L'Occitane", weight: "150 ml", price: 38.00, barcode: "3253581763100", category: "beauty", continents: ["Europe", "North America", "Asia"], countries: ["France"] },
  { id: "bc-41", name: "L'Occitane Almond Shower Oil", brand: "L'Occitane", weight: "250 ml", price: 30.00, barcode: "3253581298503", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "bc-42", name: "L'Occitane Almond Delicious Hands Cream", brand: "L'Occitane", weight: "75 ml", price: 26.00, barcode: "3253581298794", category: "beauty", continents: ["Europe", "North America"], countries: ["France"] },
  { id: "bc-43", name: "The Body Shop Shea Body Butter", brand: "The Body Shop", weight: "200 ml", price: 22.00, barcode: "5028197250003", category: "beauty", continents: ["Europe", "North America", "Asia"], countries: ["United Kingdom"] },
  { id: "bc-44", name: "The Body Shop Coconut Body Butter", brand: "The Body Shop", weight: "200 ml", price: 22.00, barcode: "5028197250010", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "bc-45", name: "The Body Shop Mango Body Butter", brand: "The Body Shop", weight: "200 ml", price: 22.00, barcode: "5028197250027", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "bc-46", name: "The Body Shop Pink Grapefruit Body Butter", brand: "The Body Shop", weight: "200 ml", price: 22.00, barcode: "5028197250065", category: "beauty", continents: ["Europe"], countries: ["United Kingdom"] },
  { id: "bc-47", name: "The Body Shop British Rose Body Butter", brand: "The Body Shop", weight: "200 ml", price: 22.00, barcode: "5028197252946", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
  { id: "bc-48", name: "Garnier Body Ultimate Blends Cocoa Butter Lotion", brand: "Garnier", weight: "400 ml", price: 5.99, barcode: "3600542443487", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "bc-49", name: "Garnier Body Ultimate Blends Coconut Milk Lotion", brand: "Garnier", weight: "400 ml", price: 5.99, barcode: "3600542443470", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "bc-50", name: "Mixa Intensive Nutrition Body Milk", brand: "Mixa", weight: "400 ml", price: 4.99, barcode: "3600550363807", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "bc-51", name: "Mixa Anti-Dryness Hand Cream", brand: "Mixa", weight: "100 ml", price: 3.99, barcode: "3600550296211", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "bc-52", name: "Le Petit Marseillais Shea Butter Shower Cream", brand: "Le Petit Marseillais", weight: "650 ml", price: 5.49, barcode: "3574661354088", category: "beauty", continents: ["Europe"], countries: ["France"] },
  { id: "bc-53", name: "Sanex Zero% Sensitive Skin Body Lotion", brand: "Sanex", weight: "400 ml", price: 5.99, barcode: "8714789879482", category: "beauty", continents: ["Europe"], countries: ["Spain"] },
  { id: "bc-54", name: "Neutrogena Norwegian Formula Hand Cream", brand: "Neutrogena", weight: "56 g", price: 4.99, barcode: "0070501025116", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-55", name: "Neutrogena Body Clear Body Wash Pink Grapefruit", brand: "Neutrogena", weight: "250 ml", price: 8.99, barcode: "0070501062708", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-56", name: "First Aid Beauty Ultra Repair Cream", brand: "First Aid Beauty", weight: "170 g", price: 38.00, barcode: "0851077002016", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-57", name: "Kiehl's Creme de Corps Body Lotion", brand: "Kiehl's", weight: "250 ml", price: 38.00, barcode: "3605970360450", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-58", name: "Clinique Deep Comfort Body Butter", brand: "Clinique", weight: "200 ml", price: 32.00, barcode: "0020714119263", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-59", name: "Estée Lauder Re-Nutriv Ultimate Lift Body Creme", brand: "Estée Lauder", weight: "200 ml", price: 250.00, barcode: "0027131958123", category: "beauty", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "bc-60", name: "Lubriderm Daily Moisture Lotion", brand: "Lubriderm", weight: "473 ml", price: 8.99, barcode: "0052800480162", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-61", name: "Lubriderm Advanced Therapy Lotion", brand: "Lubriderm", weight: "473 ml", price: 9.49, barcode: "0052800480032", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-62", name: "Suave Cocoa Butter & Shea Body Lotion", brand: "Suave", weight: "532 ml", price: 3.99, barcode: "0079400265005", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-63", name: "Suave Aloe & Cucumber Body Lotion", brand: "Suave", weight: "532 ml", price: 3.99, barcode: "0079400266057", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-64", name: "St. Ives Renewing Collagen & Elastin Body Lotion", brand: "St. Ives", weight: "621 ml", price: 5.49, barcode: "0077043730102", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-65", name: "St. Ives Naturally Indulgent Coconut Milk & Orchid Lotion", brand: "St. Ives", weight: "621 ml", price: 5.49, barcode: "0077043732007", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-66", name: "Nivea Cocoa Butter In-Shower Body Lotion", brand: "Nivea", weight: "400 ml", price: 7.99, barcode: "0072140025281", category: "beauty", continents: ["North America", "Europe"], countries: ["Germany"] },
  { id: "bc-67", name: "Vaseline Original Petroleum Jelly", brand: "Vaseline", weight: "368 g", price: 4.99, barcode: "0305210445574", category: "beauty", continents: ["North America", "Europe", "Asia", "Africa"], countries: ["United States"] },
  { id: "bc-68", name: "Carmex Classic Lip Balm Jar", brand: "Carmex", weight: "7.5 g", price: 2.49, barcode: "0083078001100", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-69", name: "ChapStick Classic Original Lip Balm", brand: "ChapStick", weight: "4 g", price: 1.49, barcode: "0305730015011", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-70", name: "EOS Visibly Soft Lip Balm Vanilla Mint", brand: "EOS", weight: "7 g", price: 3.49, barcode: "0832992014259", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-71", name: "Aquaphor Lip Repair", brand: "Aquaphor", weight: "10 ml", price: 5.49, barcode: "0072140013523", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-72", name: "Maybelline Baby Lips Moisturizing Lip Balm", brand: "Maybelline", weight: "4.4 g", price: 3.99, barcode: "0041554267044", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-73", name: "Nivea Sun Protect & Moisture Lotion SPF 30", brand: "Nivea", weight: "400 ml", price: 11.99, barcode: "4005808725915", category: "beauty", continents: ["Europe", "Asia"], countries: ["Germany"] },
  { id: "bc-74", name: "Banana Boat Ultra Sport Sunscreen Lotion SPF 50", brand: "Banana Boat", weight: "237 ml", price: 8.99, barcode: "0079656004021", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-75", name: "Coppertone Sport Sunscreen Lotion SPF 50", brand: "Coppertone", weight: "237 ml", price: 9.99, barcode: "0041100009005", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-76", name: "Hawaiian Tropic Silk Hydration Sunscreen SPF 30", brand: "Hawaiian Tropic", weight: "236 ml", price: 10.99, barcode: "0075486089337", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-77", name: "Old Spice Pure Sport High Endurance Deodorant", brand: "Old Spice", weight: "85 g", price: 4.99, barcode: "0012044002476", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-78", name: "Degree Men Cool Rush Antiperspirant", brand: "Degree", weight: "76 g", price: 3.99, barcode: "0079400264015", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-79", name: "Secret Outlast Xtend Clear Gel Deodorant", brand: "Secret", weight: "73 g", price: 4.99, barcode: "0037000308232", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-80", name: "Dove Advanced Care Sensitive Antiperspirant", brand: "Dove", weight: "74 g", price: 5.49, barcode: "0011111598416", category: "beauty", continents: ["North America", "Europe"], countries: ["United Kingdom"] },
  { id: "bc-81", name: "Mitchum Advanced Control Antiperspirant", brand: "Mitchum", weight: "73 g", price: 5.49, barcode: "0309973138001", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-82", name: "Native Coconut & Vanilla Deodorant Sensitive", brand: "Native", weight: "75 g", price: 12.99, barcode: "0810020660228", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-83", name: "Schmidt's Bergamot & Lime Deodorant Stick", brand: "Schmidt's", weight: "75 g", price: 10.99, barcode: "0858739005641", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-84", name: "Tom's of Maine Long Lasting Deodorant Unscented", brand: "Tom's of Maine", weight: "64 g", price: 6.49, barcode: "0077326830505", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-85", name: "Crest 3D White Toothpaste Radiant Mint", brand: "Crest", weight: "116 g", price: 4.99, barcode: "0037000409373", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-86", name: "Colgate Total Whitening Toothpaste", brand: "Colgate", weight: "130 g", price: 4.49, barcode: "0035000760937", category: "beauty", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "bc-87", name: "Sensodyne Pronamel Daily Protection Toothpaste", brand: "Sensodyne", weight: "113 g", price: 7.49, barcode: "0310158004608", category: "beauty", continents: ["North America", "Europe"], countries: ["United Kingdom"] },
  { id: "bc-88", name: "Listerine Cool Mint Antiseptic Mouthwash", brand: "Listerine", weight: "1 L", price: 6.99, barcode: "0312547432900", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-89", name: "Pantene Pro-V Daily Moisture Renewal Shampoo", brand: "Pantene", weight: "375 ml", price: 5.99, barcode: "0080878045013", category: "beauty", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "bc-90", name: "Head & Shoulders Classic Clean Anti-Dandruff Shampoo", brand: "Head & Shoulders", weight: "400 ml", price: 6.99, barcode: "0037000380337", category: "beauty", continents: ["North America", "Europe", "Asia"], countries: ["United States"] },
  { id: "bc-91", name: "TRESemmé Keratin Smooth Shampoo", brand: "TRESemmé", weight: "650 ml", price: 5.99, barcode: "0022400631530", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-92", name: "OGX Coconut Milk Shampoo", brand: "OGX", weight: "385 ml", price: 7.99, barcode: "0022796917720", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-93", name: "Maui Moisture Heal & Hydrate + Shea Butter Shampoo", brand: "Maui Moisture", weight: "385 ml", price: 8.99, barcode: "0022796154248", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-94", name: "Cantu Shea Butter Leave-In Conditioning Cream", brand: "Cantu", weight: "340 g", price: 6.99, barcode: "0817513010057", category: "beauty", continents: ["North America", "Africa"], countries: ["United States"] },
  { id: "bc-95", name: "SheaMoisture Raw Shea Butter Restorative Conditioner", brand: "SheaMoisture", weight: "384 ml", price: 11.99, barcode: "0764302280033", category: "beauty", continents: ["North America"], countries: ["Ghana", "United States"] },
  { id: "bc-96", name: "Mielle Organics Rosemary Mint Scalp & Hair Oil", brand: "Mielle Organics", weight: "59 ml", price: 9.99, barcode: "0855135004088", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-97", name: "Olaplex No. 3 Hair Perfector", brand: "Olaplex", weight: "100 ml", price: 30.00, barcode: "0850018802116", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-98", name: "Briogeo Don't Despair Repair Deep Conditioning Mask", brand: "Briogeo", weight: "168 g", price: 39.00, barcode: "0850007915025", category: "beauty", continents: ["North America"], countries: ["United States"] },
  { id: "bc-99", name: "Living Proof Perfect Hair Day Dry Shampoo", brand: "Living Proof", weight: "184 ml", price: 30.00, barcode: "0850007007038", category: "beauty", continents: ["North America", "Europe"], countries: ["United States"] },
  { id: "bc-100", name: "Batiste Original Dry Shampoo", brand: "Batiste", weight: "200 ml", price: 7.99, barcode: "5010724527412", category: "beauty", continents: ["Europe", "North America"], countries: ["United Kingdom"] },
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
