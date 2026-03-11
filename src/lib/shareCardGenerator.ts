// ─── SKAAP Share Card Generator — 5 card types via HTML Canvas ───
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
  // Texture
  const rand = seededRandom(seedFromBarcode(barcode));
  for (let i = 0; i < 40; i++) {
    const r = 2 + rand() * 4;
    const x = rand() * W, y = rand() * H;
    const opacity = 0.03 + rand() * 0.03;
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
    ctx.arc(W / 2, 120, 24, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(icon, W / 2 - 24, 96, 48, 48);
    ctx.restore();
  }
  ctx.fillStyle = "#fff";
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.15em";
  ctx.fillText("SKAAP", W / 2, 180);
  ctx.letterSpacing = "0";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "400 14px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText(subtitle || "useskaap.com", W / 2, 206);
}

function drawScoreRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, score: number, scoreNumSize = 96) {
  const color = getScoreColor(score);
  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 12;
  ctx.stroke();
  // Score arc
  ctx.beginPath();
  const start = -Math.PI / 2;
  const end = start + (score / 100) * Math.PI * 2;
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";
  // Score number
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${scoreNumSize}px Inter800, Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(String(score), cx, cy + scoreNumSize * 0.33);
}

function drawBottomCard(ctx: CanvasRenderingContext2D, line1: string, line2: string) {
  const ctaY = 1720, ctaW = 900, ctaH = 160, ctaR = 24;
  const ctaX = (W - ctaW) / 2;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaR);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#1B2A4A";
  ctx.font = "800 26px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(line1, W / 2, ctaY + 50);
  ctx.fillStyle = "#6B7280";
  ctx.font = "400 18px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText(line2, W / 2, ctaY + 82);
  ctx.fillStyle = "#E8314A";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText("Try it free → useskaap.com/scan", W / 2, ctaY + 120);
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.font = "400 8px Inter400, Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Made with SKAAP · useskaap.com", W - 12, H - 8);
  ctx.textAlign = "left";
}

function drawPills(ctx: CanvasRenderingContext2D, y: number, nutriGrade?: string, novaGroup?: number, additiveCount?: number) {
  const nutriColors: Record<string, string> = { a: "#2D7D46", b: "#4CAF50", c: "#FFC107", d: "#FF6D00", e: "#E8314A" };
  const pillW = 60, pillH = 36, pillR = 18, pillGap = 16;
  const pills: { label: string; color: string }[] = [];
  if (nutriGrade) pills.push({ label: nutriGrade.toUpperCase(), color: nutriColors[nutriGrade.toLowerCase()] || "#9CA3AF" });
  if (novaGroup) pills.push({ label: String(novaGroup), color: "rgba(255,255,255,0.4)" });
  const ac = additiveCount ?? 0;
  pills.push({ label: ac === 0 ? "✓" : String(ac), color: ac === 0 ? "#2D7D46" : "rgba(255,255,255,0.4)" });

  const totalW = pills.length * pillW + (pills.length - 1) * pillGap;
  let px = (W - totalW) / 2;
  ctx.textAlign = "center";
  pills.forEach(p => {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, y, pillW, pillH, pillR);
    ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.font = "800 18px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(p.label, px + pillW / 2, y + 24);
    px += pillW + pillGap;
  });
}

// ─── Card Type 1: This Product (existing) ───
function drawProductCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, p: ShareProductData) {
  const score = p.skaap_score;
  const gradEnd = score >= 75 ? "#1a3a2a" : score >= 50 ? "#2a2a0a" : score >= 25 ? "#2a1a0a" : "#2a0a0a";
  drawBackground(ctx, gradEnd, p.barcode);
  drawBranding(ctx, icon);

  const cy = H * 0.45;
  drawScoreRing(ctx, W / 2, cy, 180, score);
  // / 100
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 20px Inter600, Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("/ 100", W / 2, cy + 62);
  // Verdict
  ctx.fillStyle = getScoreColor(score);
  ctx.font = "600 24px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText(getVerdict(score), W / 2, cy + 98);

  // Product name & brand
  const nameY = cy + 250;
  ctx.fillStyle = "#fff";
  ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
  const dn = p.product_name.length > 40 ? p.product_name.slice(0, 38) + "…" : p.product_name;
  ctx.fillText(dn, W / 2, nameY);
  if (p.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 20px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(p.brand, W / 2, nameY + 32);
  }

  drawPills(ctx, nameY + 72, p.nutriscore_grade, p.nova_group, p.additives?.length);

  // Bottom card
  let l1: string, l2: string;
  if (score >= 75) { l1 = "Just SKAAPed this 🌿"; l2 = "Clean ingredients. Great score."; }
  else if (score >= 50) { l1 = "Just SKAAPed this 👀"; l2 = "Not bad. But check the additives."; }
  else if (score >= 25) { l1 = "Just SKAAPed this 😬"; l2 = "You might want to think twice."; }
  else { l1 = "Just SKAAPed this 🚨"; l2 = "This one scored pretty rough."; }
  drawBottomCard(ctx, l1, l2);
  drawWatermark(ctx);
}

// ─── Card Type 2: Kitchen Report ───
function drawKitchenCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats, p: ShareProductData) {
  const ks = stats.kitchen_score;
  const gradEnd = ks >= 50 ? "#1a3a2a" : "#2a1a0a";
  drawBackground(ctx, gradEnd, p.barcode);
  drawBranding(ctx, icon);

  const cy = H * 0.38;
  const color = getScoreColor(ks);

  // House icon (drawn as text emoji)
  ctx.textAlign = "center";
  ctx.font = "80px serif";
  ctx.fillText("🏠", W / 2, cy - 60);

  ctx.fillStyle = "#fff";
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("My Kitchen Scores", W / 2, cy + 10);

  ctx.fillStyle = color;
  ctx.font = "800 96px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(String(ks), W / 2, cy + 120);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 20px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText("/ 100 average", W / 2, cy + 152);

  ctx.fillStyle = color;
  ctx.font = "600 22px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText(getVerdict(ks), W / 2, cy + 186);

  // Three stats row
  const statY = cy + 240;
  const statData = [
    { val: String(stats.total_scans), label: "products scanned", color: "#fff" },
    { val: stats.kitchen_percentile + "%", label: "better than others", color },
    { val: stats.current_streak + "🔥", label: "day streak", color: "#fff" },
  ];
  const statGap = 240;
  const startX = W / 2 - statGap;
  statData.forEach((s, i) => {
    const x = startX + i * statGap;
    ctx.fillStyle = s.color;
    ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(s.val, x, statY);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 14px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(s.label, x, statY + 24);
  });

  // Dynamic bottom card copy
  let l1: string;
  if (stats.current_streak > 6 && ks > 70) l1 = `Eating clean. ${stats.current_streak} days strong. 🌿`;
  else if (stats.worst_score_ever && stats.worst_score_ever.skaap_score < 20) l1 = "Even I have skeletons in my fridge. 💀";
  else if (stats.total_scans > 50) l1 = "50 scans in. Still learning. 🔍";
  else if (ks > 80) l1 = "My kitchen passed the SKAAP test. 🏆";
  else if (ks < 40) l1 = "My kitchen and I need to have a talk. 😅";
  else l1 = `Just SKAAPed my kitchen. ${ks}/100.`;

  const l2 = `Better than ${stats.kitchen_percentile}% of SKAAP users.`;
  drawBottomCard(ctx, l1, l2);
  drawWatermark(ctx);
}

// ─── Card Type 3: The Swap ───
function drawSwapCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, p: ShareProductData) {
  const rec = p.top_recommendation;
  if (!rec) return;

  // Split background
  ctx.fillStyle = "#2a0a0a";
  ctx.fillRect(0, 0, W, H / 2);
  ctx.fillStyle = "#0a2a12";
  ctx.fillRect(0, H / 2, W, H / 2);

  // Texture
  const rand = seededRandom(seedFromBarcode(p.barcode));
  for (let i = 0; i < 40; i++) {
    const r = 2 + rand() * 4;
    const x = rand() * W, y = rand() * H;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.03})`;
    ctx.fill();
  }

  drawBranding(ctx, icon);

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Swap circle on divider
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = "#1B2A4A";
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⇄", W / 2, H / 2 + 10);

  // TOP HALF — scanned product
  const topCy = H * 0.30;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.1em";
  ctx.fillText("WHAT I SCANNED", W / 2, topCy - 80);
  ctx.letterSpacing = "0";

  ctx.fillStyle = "#fff";
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  const topName = p.product_name.length > 30 ? p.product_name.slice(0, 28) + "…" : p.product_name;
  ctx.fillText(topName, W / 2, topCy - 40);
  if (p.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 18px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(p.brand, W / 2, topCy - 14);
  }
  drawScoreRing(ctx, W / 2, topCy + 60, 50, p.skaap_score, 44);

  if (p.nutriscore_grade) {
    const nc: Record<string, string> = { a: "#2D7D46", b: "#4CAF50", c: "#FFC107", d: "#FF6D00", e: "#E8314A" };
    const c = nc[p.nutriscore_grade.toLowerCase()] || "#9CA3AF";
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 20, topCy + 124, 40, 24, 12);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = "800 14px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(p.nutriscore_grade.toUpperCase(), W / 2, topCy + 140);
  }

  // BOTTOM HALF — recommendation
  const botCy = H * 0.68;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
  ctx.letterSpacing = "0.1em";
  ctx.fillText("TRYING INSTEAD", W / 2, botCy - 80);
  ctx.letterSpacing = "0";

  ctx.fillStyle = "#fff";
  ctx.font = "800 28px Inter800, Inter, system-ui, sans-serif";
  const botName = rec.name.length > 30 ? rec.name.slice(0, 28) + "…" : rec.name;
  ctx.fillText(botName, W / 2, botCy - 40);

  // Estimate swap score from nutri-score letter
  const letterScores: Record<string, number> = { a: 85, b: 72, c: 55, d: 35, e: 18 };
  const swapScore = letterScores[rec.estimatedScore?.toLowerCase() || "a"] || 80;
  drawScoreRing(ctx, W / 2, botCy + 40, 50, swapScore, 44);

  const diff = swapScore - p.skaap_score;
  if (diff > 0) {
    ctx.fillStyle = "#2D7D46";
    ctx.font = "600 16px Inter600, Inter, system-ui, sans-serif";
    ctx.fillText(`+ ${diff} points better`, W / 2, botCy + 110);
  }

  if (rec.estimatedScore) {
    const nc: Record<string, string> = { a: "#2D7D46", b: "#4CAF50", c: "#FFC107", d: "#FF6D00", e: "#E8314A" };
    const c = nc[rec.estimatedScore.toLowerCase()] || "#2D7D46";
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 20, botCy + 124, 40, 24, 12);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = "800 14px Inter800, Inter, system-ui, sans-serif";
    ctx.fillText(rec.estimatedScore.toUpperCase(), W / 2, botCy + 140);
  }

  // Bottom card
  const swapName = rec.name.length > 20 ? rec.name.slice(0, 18) + "…" : rec.name;
  const origName = p.product_name.length > 20 ? p.product_name.slice(0, 18) + "…" : p.product_name;
  drawBottomCard(ctx, "Making the swap 🔄", `${origName} → ${swapName}`);
  drawWatermark(ctx);
}

// ─── Card Type 4: My Streak ───
function drawStreakCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats, barcode: string) {
  drawBackground(ctx, "#1B2A4A", barcode);
  drawBranding(ctx, icon);

  const cy = H * 0.35;
  ctx.textAlign = "center";
  // Fire emoji
  ctx.font = "120px serif";
  ctx.fillText("🔥", W / 2, cy);

  ctx.fillStyle = "#fff";
  ctx.font = "800 96px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText(String(stats.current_streak), W / 2, cy + 110);

  ctx.fillStyle = "#FFC107";
  ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("day streak 🔥", W / 2, cy + 155);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "400 20px Inter400, Inter, system-ui, sans-serif";
  ctx.fillText("days of eating clean", W / 2, cy + 190);

  // Day indicators — last 7 days
  const indicatorY = cy + 260;
  const circleR = 26;
  const gap = 68;
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
      ctx.beginPath();
      ctx.arc(x, indicatorY, circleR, 0, Math.PI * 2);
      ctx.fillStyle = "#FFC107";
      ctx.fill();
      if (isToday) {
        ctx.font = "16px serif";
        ctx.fillText("🔥", x, indicatorY + 6);
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
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Day label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 11px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()], x, indicatorY + circleR + 18);
  }

  // "Scanning with SKAAP since..."
  if (stats.daily_scan_dates.length > 0) {
    const first = new Date(stats.daily_scan_dates.sort()[0] + "T00:00:00");
    const monthYear = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 16px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(`Scanning with SKAAP since ${monthYear}`, W / 2, indicatorY + circleR + 60);
  }

  // Bottom card
  const s = stats.current_streak;
  let l1: string;
  if (s >= 30) l1 = "30 days of clean eating 🌿";
  else if (s >= 14) l1 = "Two weeks strong 🏆";
  else if (s >= 7) l1 = "One week of eating clean 💪";
  else if (s >= 3) l1 = "On a clean eating streak 🔥";
  else l1 = "Just getting started 🌱";
  drawBottomCard(ctx, l1, "Eating smarter one scan at a time.");
  drawWatermark(ctx);
}

// ─── Card Type 5: Worst Ever ───
function drawWorstCard(ctx: CanvasRenderingContext2D, icon: HTMLImageElement | null, stats: UserStats) {
  const worst = stats.worst_score_ever;
  if (!worst) return;

  drawBackground(ctx, "#0A1220", worst.barcode);
  // Override gradient to red
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
  grad.addColorStop(0, "#2a0a0a");
  grad.addColorStop(1, "#0A1220");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Re-draw texture
  const rand = seededRandom(seedFromBarcode(worst.barcode));
  for (let i = 0; i < 40; i++) {
    const r = 2 + rand() * 4;
    const x = rand() * W, y = rand() * H;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.03})`;
    ctx.fill();
  }

  drawBranding(ctx, icon, "HALL OF SHAME");

  const cy = H * 0.40;
  ctx.textAlign = "center";

  // Product image placeholder (red circle with ?)
  ctx.beginPath();
  ctx.arc(W / 2, cy - 40, 70, 0, Math.PI * 2);
  ctx.strokeStyle = "#E8314A";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#E8314A";
  ctx.font = "800 60px Inter800, Inter, system-ui, sans-serif";
  ctx.fillText("?", W / 2, cy - 20);

  // Product name
  ctx.fillStyle = "#fff";
  ctx.font = "800 32px Inter800, Inter, system-ui, sans-serif";
  const wn = worst.product_name.length > 35 ? worst.product_name.slice(0, 33) + "…" : worst.product_name;
  ctx.fillText(wn, W / 2, cy + 60);
  if (worst.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "400 18px Inter400, Inter, system-ui, sans-serif";
    ctx.fillText(worst.brand, W / 2, cy + 88);
  }

  // Score ring
  drawScoreRing(ctx, W / 2, cy + 170, 60, worst.skaap_score, 52);
  ctx.fillStyle = "#E8314A";
  ctx.font = "600 18px Inter600, Inter, system-ui, sans-serif";
  ctx.fillText("out of 100 😬", W / 2, cy + 250);

  // Nutri + NOVA pills
  drawPills(ctx, cy + 280, worst.nutriscore_grade, worst.nova_group, worst.additives?.length);

  // Additive pills (if available)
  if (worst.additives && worst.additives.length > 0) {
    const topAdds = worst.additives.slice(0, 3).map(a =>
      a.replace(/^en:/, "").replace(/-.*$/, "").replace(/\b\w/g, c => c.toUpperCase())
    );
    const addY = cy + 340;
    const addGap = 12;
    let totalAddW = 0;
    const measured = topAdds.map(name => {
      ctx.font = "600 11px Inter600, Inter, system-ui, sans-serif";
      const tw = ctx.measureText(name).width + 20;
      totalAddW += tw;
      return { name, w: tw };
    });
    totalAddW += (measured.length - 1) * addGap;
    let addX = (W - totalAddW) / 2;
    measured.forEach(({ name, w }) => {
      ctx.strokeStyle = "#E8314A";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(addX, addY, w, 28, 14);
      ctx.stroke();
      ctx.fillStyle = "#E8314A";
      ctx.font = "600 11px Inter600, Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, addX + w / 2, addY + 18);
      addX += w + addGap;
    });
  }

  drawBottomCard(ctx, "The worst thing in my kitchen 💀", `It scored ${worst.skaap_score}/100 on SKAAP.`);
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
