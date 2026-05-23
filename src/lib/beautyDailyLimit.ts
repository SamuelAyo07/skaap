// Tracks beauty product scans per day for free users.
// Free users get 3 unique beauty scans/day. We don't surface the limit
// until they try the 4th scan, then we show a friendly Plus upsell.

const KEY = "skaap_beauty_daily_v1";
export const FREE_BEAUTY_LIMIT = 3;

interface State { date: string; barcodes: string[]; }

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.date === today()) return s;
    }
  } catch {}
  return { date: today(), barcodes: [] };
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

export function getBeautyScanCountToday(): number {
  return read().barcodes.length;
}

/** Returns true if this barcode would put the user over the free limit. */
export function isOverBeautyLimit(barcode: string): boolean {
  const s = read();
  if (s.barcodes.includes(barcode)) return false; // already counted
  return s.barcodes.length >= FREE_BEAUTY_LIMIT;
}

export function recordBeautyScan(barcode: string) {
  const s = read();
  if (!s.barcodes.includes(barcode)) {
    s.barcodes.push(barcode);
    write(s);
  }
}
