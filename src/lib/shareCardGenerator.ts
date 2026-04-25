// ─── SKAAP Share Card Generator — 5 card types via HTML Canvas ───
// Social-media optimized, branded, compact, fun, fit-to-screen 9:16
import type { UserStats, ScoreEntry } from "./skaapUserStats";
import type { AIRecommendation } from "./aiProductInsights";

export type ShareCardType = "product" | "kitchen" | "swap" | "streak" | "worst";

export interface ShareProductData {
  barcode: string;
  product_name: string;
  brand?: string;
  skaap_score: number;
  nutriscore_grade?: string;
  nova_group?: number;
  additives?: string[];
  image_url?: string;
  top_recommendation?: AIRecommendation | null;
}

const W = 1080, H = 1920;

function getScoreColor(s: number) {
  return s >= 75 ? "#2D7D46" : s >= 50 ? "#FFC107" : s >= 25 ? "#FF6D00" : "#E8314A";
}
function getVerdict(s: number) {
  return s >= 75 ? "Excellent" : s >= 50 ? "Good" : s >= 25 ? "Mediocre" : "Poor";
}
function getEmoji(s: number) {
  return s >= 75 ? "🌿" : s >= 50 ? "👀" : s >= 25 ? "😬" : "🚨";
}

// Seeded random
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function seedFromBarcode(barcode: string): number {
  let s = 0;
  for (let i = 0; i < barcode.length; i++) s = ((s << 5) - s + barcode.charCodeAt(i)) | 0;
  return s;
}

// ─── Shared drawing helpers ───

function drawBackground(ctx: CanvasRenderingContext2D, gradEnd: string, barcode: string) {
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
  grad.addColorStop(0, "#0A1220");
  grad.addColorStop(1, gradEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Texture dots
  const rand = seededRandom(seedFromBarcode(barcode));
  for (let i = 0; i < 50; i++) {
    const r = 2 + rand() * 5;
    const x = rand() * W, y = rand() * H;
    const opacity = 0.03 + rand() * 0.04;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.fill();
  }
}

function drawBranding(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, subtitle?: string) {
  ctx.textAlign = "center";
  if (icon) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 100, 28, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(icon, W / 2 - 28, 72, 56, 56);
    ctx.restore();
  }
  ctx.fillStyle = "#fff";
  ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("SKAAP", W / 2, 164);
  ctx.letterSpacing = "0";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 16px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText(subtitle || "See what's in your food", W / 2, 192);
}

function drawScoreRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, score: number, scoreNumSize = 96) {
  const color = getScoreColor(score);
  // Outer halo (extra punch for social)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 60;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = `${color}40`;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  // Glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 36;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.restore();
  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 16;
  ctx.stroke();
  // Score arc
  ctx.beginPath();
  const start = -Math.PI / 2;
  const end = start + (score / 100) * Math.PI * 2;
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";
  // Score number
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${scoreNumSize}px Inter800, Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(String(score), cx, cy + scoreNumSize * 0.33);
}

// Tilted sticker badge — "tagged" feel for social sharing
function drawSticker(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string, rotation = -0.12) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.font = "800 22px Inter800, Inter, system-ui, sans-serif";
  const m = ctx.measureText(text);
  const w = m.width + 36, h = 48, r = 12;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 1);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawBottomCTA(ctx: CanvasRenderingContext2D, headline: string, subline: string, tagline?: string) {
  // Frosted card at bottom — taller, bolder, with red accent bar
  const ctaY = 1620, ctaW = 960, ctaH = 270, ctaR = 32;
  const ctaX = (W - ctaW) / 2;

  // Outer glow
  ctx.save();
  ctx.shadowColor = "rgba(232,49,74,0.5)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaR);
  ctx.fill();
  ctx.restore();

  // Red top accent stripe
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, 8, [ctaR, ctaR, 0, 0] as unknown as number);
  ctx.fillStyle = "#E8314A";
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#0A1220";
  ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(headline, W / 2, ctaY + 64);

  ctx.fillStyle = "#6B7280";
  ctx.font = "500 19px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText(subline, W / 2, ctaY + 100);

  // BIG CTA pill — bigger, with shadow
  const pillW = 500, pillH = 64, pillR = 32;
  const pillX = (W - pillW) / 2, pillY = ctaY + 124;
  ctx.save();
  ctx.shadowColor = "rgba(232,49,74,0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#E8314A";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.font = "800 22px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("Scan yours free → useskaap.com", W / 2, pillY + 41);

  // Follow CTA — drives social engagement
  ctx.fillStyle = "#0A1220";
  ctx.font = "700 15px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText("Follow @useskaap for more real-food scans 🌱", W / 2, pillY + 96);

  // Tagline
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 13px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText(tagline || "Tag us in your scan — we'll repost 🙌", W / 2, pillY + 120);
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.font = "400 8px Inter400, Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Made with SKAAP · useskaap.com", W - 12, H - 8);
  ctx.textAlign = "left";
}

function drawInfoPill(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, color: string) {
  const pillW = 200, pillH = 44, pillR = 22;
  const px = x - pillW / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, y, pillW, pillH, pillR);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "800 14px Inter800, Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x, y + 18);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 12px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText(label, x, y + 34);
}

function drawPills(ctx: CanvasRenderingContext2D, y: number, nutriGrade?: string, novaGroup?: number, additiveCount?: number) {
  const nutriColors: Record<string, string> = { a: "#2D7D46", b: "#4CAF50", c: "#FFC107", d: "#FF6D00", e: "#E8314A" };
  const pills: { label: string; value: string; color: string }[] = [];
  
  if (nutriGrade) {
    const c = nutriColors[nutriGrade.toLowerCase()] || "#9CA3AF";
    pills.push({ label: "Nutri-Score", value: nutriGrade.toUpperCase(), color: c });
  }
  if (novaGroup) {
    const novaC = novaGroup <= 2 ? "#2D7D46" : novaGroup === 3 ? "#FF6D00" : "#E8314A";
    pills.push({ label: "Processing", value: `NOVA ${novaGroup}`, color: novaC });
  }
  const ac = additiveCount ?? 0;
  pills.push({ label: "Additives", value: ac === 0 ? "None ✓" : `${ac} found`, color: ac === 0 ? "#2D7D46" : ac > 3 ? "#E8314A" : "#FF6D00" });

  const pillW = 160, pillH = 52, pillR = 16, pillGap = 16;
  const totalW = pills.length * pillW + (pills.length - 1) * pillGap;
  let px = (W - totalW) / 2;
  
  ctx.textAlign = "center";
  pills.forEach(p => {
    // Pill background
    ctx.fillStyle = `${p.color}20`;
    ctx.beginPath();
    ctx.roundRect(px, y, pillW, pillH, pillR);
    ctx.fill();
    ctx.strokeStyle = `${p.color}60`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px, y, pillW, pillH, pillR);
    ctx.stroke();
    
    ctx.fillStyle = "#fff";
    ctx.font = "800 16px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(p.value, px + pillW / 2, y + 22);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 11px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(p.label, px + pillW / 2, y + 40);
    px += pillW + pillGap;
  });
}

// ─── Card Type 1: This Product ───
function drawProductCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, p: ShareProductData) {
  const score = p.skaap_score;
  const gradEnd = score >= 75 ? "#1a3a2a" : score >= 50 ? "#2a2a0a" : score >= 25 ? "#2a1a0a" : "#2a0a0a";
  drawBackground(ctx, gradEnd, p.barcode);
  drawBranding(ctx, icon);

  // "I just scanned this" label
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("I JUST SCANNED THIS", W / 2, 250);
  ctx.letterSpacing = "0";

  // Product name + brand block
  const nameY = 300;
  ctx.fillStyle = "#fff";
  ctx.font = "800 36px Inter800, Inter, system-ui, sans-serif";
  const dn = p.product_name.length > 35 ? p.product_name.slice(0, 33) + "…" : p.product_name;
  ctx.fillText(dn, W / 2, nameY);
  if (p.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 22px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(p.brand, W / 2, nameY + 36);
  }

  // Giant score ring — centerpiece
  const cy = H * 0.48;
  drawScoreRing(ctx, W / 2, cy, 190, score, 110);
  // Tilted sticker badge — top-right of ring
  const verdictColor = getScoreColor(score);
  drawSticker(ctx, W / 2 + 200, cy - 160, `${getEmoji(score)} ${getVerdict(score).toUpperCase()}`, verdictColor, "#fff", -0.14);
  // / 100
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 22px Inter600, Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("/ 100", W / 2, cy + 70);
  // Verdict with emoji
  ctx.fillStyle = verdictColor;
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(`${getVerdict(score)} ${getEmoji(score)}`, W / 2, cy + 108);

  // Info pills row
  drawPills(ctx, cy + 150, p.nutriscore_grade, p.nova_group, p.additives?.length);

  // Top additives callout (if any risky ones)
  if (p.additives && p.additives.length > 0) {
    const topAdds = p.additives.slice(0, 3).map(a =>
      a.replace(/^en:/, "").replace(/-.*$/, "").replace(/\b\w/g, c => c.toUpperCase())
    );
    const addY = cy + 230;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "400 16px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(`Contains: ${topAdds.join(", ")}`, W / 2, addY);
  }

  // Bottom CTA — personalized with the item name so each share feels unique
  const shortName = p.product_name.length > 26 ? p.product_name.slice(0, 24) + "…" : p.product_name;
  let l1: string, l2: string;
  if (score >= 75) { l1 = `${shortName} passed the vibe check 🌿`; l2 = "Clean ingredients confirmed. Would you eat it?"; }
  else if (score >= 50) { l1 = `${shortName} is giving mid 👀`; l2 = "Not the worst, but those additives tho."; }
  else if (score >= 25) { l1 = `Nah, ${shortName}? 😬`; l2 = "Check what's in YOUR food before you judge me."; }
  else { l1 = `${shortName} should be illegal 🚨`; l2 = "Banned in Europe btw. Still on US shelves."; }
  drawBottomCTA(ctx, l1, l2, `Scan ${shortName} yourself → @useskaap`);
  drawWatermark(ctx);
}

// ─── Card Type 2: Kitchen Report ───
function drawKitchenCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats, p: ShareProductData) {
  const ks = stats.kitchen_score;
  const gradEnd = ks >= 50 ? "#1a3a2a" : "#2a1a0a";
  drawBackground(ctx, gradEnd, p.barcode);
  drawBranding(ctx, icon, "Food Intelligence");

  ctx.textAlign = "center";

  // Section label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("MY KITCHEN REPORT", W / 2, 250);
  ctx.letterSpacing = "0";

  // Kitchen score — large number
  const cy = H * 0.38;
  const color = getScoreColor(ks);
  
  ctx.fillStyle = color;
  ctx.font = "800 140px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(String(ks), W / 2, cy + 50);
  
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 24px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText("out of 100", W / 2, cy + 84);

  ctx.fillStyle = color;
  ctx.font = "800 26px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(`${getVerdict(ks)} Kitchen ${getEmoji(ks)}`, W / 2, cy + 126);

  // Three stats — glass cards
  const statY = cy + 180;
  const cardW = 280, cardH = 100, cardR = 20, cardGap = 20;
  const totalCardsW = 3 * cardW + 2 * cardGap;
  let startX = (W - totalCardsW) / 2;
  
  const statData = [
    { val: String(stats.total_scans), label: "products\nscanned", color: "#fff" },
    { val: `${stats.kitchen_percentile}%`, label: "better than\nother users", color },
    { val: `${stats.current_streak}🔥`, label: "day\nstreak", color: "#FFC107" },
  ];
  
  statData.forEach((s, i) => {
    const x = startX + i * (cardW + cardGap);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(x, statY, cardW, cardH, cardR);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, statY, cardW, cardH, cardR);
    ctx.stroke();
    
    ctx.fillStyle = s.color;
    ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.val, x + cardW / 2, statY + 40);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px Inter400, Inter, system-ui, sans-serif";
    const lines = s.label.split("\n");
    lines.forEach((line, li) => {
      ctx.fillText(line, x + cardW / 2, statY + 60 + li * 16);
    });
  });

  // Fun viral copy
  let l1: string;
  if (stats.current_streak > 6 && ks > 70) l1 = `${stats.current_streak} days clean and counting 🌿`;
  else if (stats.worst_score_ever && stats.worst_score_ever.skaap_score < 20) l1 = "POV: your fridge has a criminal record 💀";
  else if (stats.total_scans > 50) l1 = "I've scanned 50+ products and I have regrets 🔍";
  else if (ks > 80) l1 = "My kitchen ate and left no crumbs 🏆";
  else if (ks < 40) l1 = "My kitchen is in its villain era 😅";
  else l1 = `My kitchen is a ${ks}/100 — what's yours?`;

  drawBottomCTA(ctx, l1, `Top ${stats.kitchen_percentile}% of all SKAAP kitchens`, "Rate YOUR kitchen → useskaap.com 🏆");
  drawWatermark(ctx);
}

// ─── Card Type 3: The Swap ───
function drawSwapCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, p: ShareProductData) {
  const rec = p.top_recommendation;
  if (!rec) return;

  // Split background — red top, green bottom
  const topGrad = ctx.createLinearGradient(0, 0, 0, H / 2);
  topGrad.addColorStop(0, "#1a0808");
  topGrad.addColorStop(1, "#2a0a0a");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H / 2);
  
  const botGrad = ctx.createLinearGradient(0, H / 2, 0, H);
  botGrad.addColorStop(0, "#082a12");
  botGrad.addColorStop(1, "#0a1a0a");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H / 2, W, H / 2);

  // Texture
  const rand = seededRandom(seedFromBarcode(p.barcode));
  for (let i = 0; i < 50; i++) {
    const r = 2 + rand() * 5;
    const x = rand() * W, y = rand() * H;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.04})`;
    ctx.fill();
  }

  drawBranding(ctx, icon, "Smart Swap");

  // TOP HALF — scanned product
  const topCy = H * 0.30;
  ctx.textAlign = "center";
  
  // "WHAT I SCANNED" label
  ctx.fillStyle = "#E8314A";
  ctx.font = "800 14px Inter800, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("❌  WHAT I SCANNED", W / 2, topCy - 90);
  ctx.letterSpacing = "0";

  ctx.fillStyle = "#fff";
  ctx.font = "800 30px Inter800, Inter, system-ui, sans-serif";
  const topName = p.product_name.length > 28 ? p.product_name.slice(0, 26) + "…" : p.product_name;
  ctx.fillText(topName, W / 2, topCy - 50);
  if (p.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 18px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(p.brand, W / 2, topCy - 22);
  }
  drawScoreRing(ctx, W / 2, topCy + 50, 55, p.skaap_score, 48);

  // Divider with swap icon
  const divY = H / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, divY);
  ctx.lineTo(W - 100, divY);
  ctx.stroke();
  
  // Swap circle
  ctx.beginPath();
  ctx.arc(W / 2, divY, 36, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = "#1B2A4A";
  ctx.font = "800 24px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("⇅", W / 2, divY + 9);

  // BOTTOM HALF — recommendation
  const botCy = H * 0.68;
  
  ctx.fillStyle = "#2D7D46";
  ctx.font = "800 14px Inter800, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("✓  TRYING INSTEAD", W / 2, botCy - 90);
  ctx.letterSpacing = "0";

  ctx.fillStyle = "#fff";
  ctx.font = "800 30px Inter800, Inter, system-ui, sans-serif";
  const botName = rec.name.length > 28 ? rec.name.slice(0, 26) + "…" : rec.name;
  ctx.fillText(botName, W / 2, botCy - 50);

  const letterScores: Record<string, number> = { a: 85, b: 72, c: 55, d: 35, e: 18 };
  const swapScore = letterScores[rec.estimatedScore?.toLowerCase() || "a"] || 80;
  drawScoreRing(ctx, W / 2, botCy + 30, 55, swapScore, 48);

  const diff = swapScore - p.skaap_score;
  if (diff > 0) {
    ctx.fillStyle = "#2D7D46";
    ctx.font = "800 20px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(`+${diff} points better ↑`, W / 2, botCy + 110);
  }

  // Bottom CTA
  drawBottomCTA(ctx, "Making the swap 🔄", `${p.skaap_score} → ${swapScore} points`, "What would YOUR swap look like?");
  drawWatermark(ctx);
}

// ─── Card Type 4: My Streak ───
function drawStreakCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats, barcode: string) {
  drawBackground(ctx, "#1B2A4A", barcode);
  drawBranding(ctx, icon, "Clean Eating Tracker");

  ctx.textAlign = "center";

  // Section label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("EATING CLEAN FOR", W / 2, 260);
  ctx.letterSpacing = "0";

  const cy = H * 0.38;
  // Fire emoji
  ctx.font = "140px serif";
  ctx.fillText("🔥", W / 2, cy - 20);

  // Streak number — huge
  ctx.fillStyle = "#FFC107";
  ctx.font = "800 120px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(String(stats.current_streak), W / 2, cy + 120);

  ctx.fillStyle = "#FFC107";
  ctx.font = "800 36px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(stats.current_streak === 1 ? "day" : "days straight", W / 2, cy + 165);

  // Day indicators — last 7 days
  const indicatorY = cy + 240;
  const circleR = 28;
  const gap = 72;
  const totalW7 = 7 * circleR * 2 + 6 * (gap - circleR * 2);
  const startX = (W - totalW7) / 2 + circleR;
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dStr = d.toISOString().slice(0, 10);
    const hasQualifying = stats.daily_scan_dates.includes(dStr);
    const isToday = i === 0;
    const x = startX + (6 - i) * gap;

    if (hasQualifying) {
      // Filled circle with glow
      ctx.save();
      ctx.shadowColor = "#FFC107";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, indicatorY, circleR, 0, Math.PI * 2);
      ctx.fillStyle = "#FFC107";
      ctx.fill();
      ctx.restore();
      if (isToday) {
        ctx.font = "18px serif";
        ctx.fillText("🔥", x, indicatorY + 7);
      } else {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 8, indicatorY);
        ctx.lineTo(x - 2, indicatorY + 7);
        ctx.lineTo(x + 10, indicatorY - 6);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, indicatorY, circleR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Day label
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "400 12px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()], x, indicatorY + circleR + 20);
  }

  // "Since" line
  if (stats.daily_scan_dates.length > 0) {
    const first = new Date(stats.daily_scan_dates.sort()[0] + "T00:00:00");
    const monthYear = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "400 16px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(`Scanning with SKAAP since ${monthYear}`, W / 2, indicatorY + circleR + 60);
  }

  // Bottom CTA
  const s = stats.current_streak;
  let l1: string;
  if (s >= 30) l1 = "30 days of knowing what I eat 🧠";
  else if (s >= 14) l1 = "2 weeks of eating with purpose 🏆";
  else if (s >= 7) l1 = "1 week streak — I'm locked in 💪";
  else if (s >= 3) l1 = "Streak mode activated 🔥";
  else l1 = "Day 1 energy — watch me 🌱";
  drawBottomCTA(ctx, l1, "How long can YOU go?", "Start your streak → useskaap.com 🔥");
  drawWatermark(ctx);
}

// ─── Card Type 5: Worst Ever ───
function drawWorstCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats) {
  const worst = stats.worst_score_ever;
  if (!worst) return;

  // Deep red ominous gradient
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
  grad.addColorStop(0, "#2a0505");
  grad.addColorStop(1, "#0A1220");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  // Texture
  const rand = seededRandom(seedFromBarcode(worst.barcode));
  for (let i = 0; i < 50; i++) {
    const r = 2 + rand() * 5;
    const x = rand() * W, y = rand() * H;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.04})`;
    ctx.fill();
  }

  drawBranding(ctx, icon, "HALL OF SHAME");

  // Section label
  ctx.textAlign = "center";
  ctx.fillStyle = "#E8314A";
  ctx.font = "800 16px Inter800, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("💀  THE WORST THING IN MY KITCHEN", W / 2, 260);
  ctx.letterSpacing = "0";

  const cy = H * 0.42;

  // Red danger circle
  ctx.save();
  ctx.shadowColor = "#E8314A";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(W / 2, cy - 40, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "#E8314A";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#E8314A";
  ctx.font = "800 70px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("💀", W / 2, cy - 20);

  // Product name
  ctx.fillStyle = "#fff";
  ctx.font = "800 34px Inter800, Inter, system-ui, sans-serif";
  const wn = worst.product_name.length > 30 ? worst.product_name.slice(0, 28) + "…" : worst.product_name;
  ctx.fillText(wn, W / 2, cy + 70);
  if (worst.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 20px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(worst.brand, W / 2, cy + 100);
  }

  // Score ring
  drawScoreRing(ctx, W / 2, cy + 190, 70, worst.skaap_score, 60);
  ctx.fillStyle = "#E8314A";
  ctx.font = "600 20px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText(`out of 100 😬`, W / 2, cy + 280);

  // Info pills
  drawPills(ctx, cy + 310, worst.nutriscore_grade, worst.nova_group, worst.additives?.length);

  // Additive names
  if (worst.additives && worst.additives.length > 0) {
    const topAdds = worst.additives.slice(0, 3).map(a =>
      a.replace(/^en:/, "").replace(/-.*$/, "").replace(/\b\w/g, c => c.toUpperCase())
    );
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "400 16px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(`Contains: ${topAdds.join(", ")}`, W / 2, cy + 390);
  }

  drawBottomCTA(ctx, "Exposing my kitchen's worst kept secret 💀", `It scored ${worst.skaap_score}/100 and I still ate it`, "Find YOUR hall of shame → @useskaap");
  drawWatermark(ctx);
}

// ─── Main entry point ───
export async function generateShareCard(
  cardType: ShareCardType,
  icon: HTMLImageElement | null,
  productData: ShareProductData,
  userStats: UserStats,
): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    switch (cardType) {
      case "product":
        drawProductCard(ctx, icon, productData);
        break;
      case "kitchen":
        drawKitchenCard(ctx, icon, userStats, productData);
        break;
      case "swap":
        drawSwapCard(ctx, icon, productData);
        break;
      case "streak":
        drawStreakCard(ctx, icon, userStats, productData.barcode);
        break;
      case "worst":
        drawWorstCard(ctx, icon, userStats);
        break;
    }

    return new Promise(resolve => canvas.toBlob(b => resolve(b), "image/png"));
  } catch {
    return null;
  }
}
