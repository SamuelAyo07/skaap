// Unified free-scan limit across food + cosmetics.
// Free users get 4 unique scans total (lifetime). After that we show the
// Plus upsell. Plus users are unlimited.

const KEY = "skaap_free_scans_v1";
export const FREE_SCAN_LIMIT = 4;
// Back-compat export (some screens still import this name)
export const FREE_BEAUTY_LIMIT = FREE_SCAN_LIMIT;

interface State { barcodes: string[]; }

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  return { barcodes: [] };
}

function write(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

/** Detect whether a fetched product is a beauty/cosmetic product. */
export function isBeautyProduct(info: {
  categoriesTags?: string[];
  imageUrl?: string;
  imageSmallUrl?: string;
}): boolean {
  const img = (info.imageUrl || "") + " " + (info.imageSmallUrl || "");
  if (/openbeautyfacts/i.test(img)) return true;
  const tags = info.categoriesTags || [];
  return tags.some(t =>
    /beaut|cosmet|skin[\s-]?care|hair[\s-]?care|makeup|fragran|perfum|deodorant|shampoo|conditioner|lotion|cream|serum|moisturi|cleans|toner|mascara|lipstick|foundation/i.test(t)
  );
}

export function getFreeScanCount(): number {
  return read().barcodes.length;
}

/** Returns true if this barcode would put the user over the free limit. */
export function isOverFreeLimit(barcode: string): boolean {
  const s = read();
  if (s.barcodes.includes(barcode)) return false; // already counted
  return s.barcodes.length >= FREE_SCAN_LIMIT;
}

export function recordFreeScan(barcode: string) {
  const s = read();
  if (!s.barcodes.includes(barcode)) {
    s.barcodes.push(barcode);
    write(s);
  }
}

// ─── Back-compat aliases ───
export const getBeautyScanCountToday = getFreeScanCount;
export const isOverBeautyLimit = isOverFreeLimit;
export const recordBeautyScan = recordFreeScan;
