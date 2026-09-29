// Pure helpers + seed data shared by the platform store and the new feature screens.
// Everything here maps 1:1 to a future backend service (see BACKEND_INTEGRATION.md).

export type Area = { lat: number; lng: number; city: string };
export const AREAS: Record<string, Area> = {
  "Lekki Phase 1, Lagos": { lat: 6.4478, lng: 3.4723, city: "Lagos" },
  "Victoria Island, Lagos": { lat: 6.4281, lng: 3.4219, city: "Lagos" },
  "Ikeja GRA, Lagos": { lat: 6.5833, lng: 3.35, city: "Lagos" },
  "Yaba, Lagos": { lat: 6.5095, lng: 3.3711, city: "Lagos" },
  "Wuse 2, Abuja": { lat: 9.0765, lng: 7.4698, city: "Abuja" },
  "Maitama, Abuja": { lat: 9.0906, lng: 7.493, city: "Abuja" },
};
export const AREA_NAMES = Object.keys(AREAS);

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const CATEGORIES = [
  { key: "ac", label: "AC servicing", match: /\bac\b|air.?con/i },
  { key: "cleaning", label: "Deep cleaning", match: /clean/i },
  { key: "electrical", label: "Electrical", match: /electr/i },
  { key: "plumbing", label: "Plumbing", match: /plumb/i },
  { key: "beauty", label: "Beauty at home", match: /beauty|makeup|hair/i },
] as const;
export function categoryOf(service: string) { return CATEGORIES.find((item) => item.match.test(service))?.key ?? "other"; }

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- customer profile, wallet, loyalty ---------- */
export type SavedAddress = { id: string; label: string; address: string; isDefault: boolean };
export type PaymentMethod = { id: string; brand: string; last4: string; expiry: string; holder: string; isDefault: boolean; gatewayRef: string };
export type LedgerEntry = { id: string; kind: "welcome" | "referral" | "loyalty" | "redeem" | "spent" | "refund"; credit: number; points: number; note: string; createdAt: string };
export type CustomerProfile = {
  accountId: string; email: string; addresses: SavedAddress[]; methods: PaymentMethod[];
  prefs: { preferredSlot: string; accessNote: string; channels: { push: boolean; sms: boolean; email: boolean } };
  referralCode: string; referredBy?: string; referralRewarded?: boolean;
  credit: number; points: number; lifetimePoints: number; ledger: LedgerEntry[]; favourites: string[];
};
export const SLOT_OPTIONS = ["Today · 2:00 – 4:00 PM", "Today · 5:00 – 7:00 PM", "Tomorrow · 9:00 – 11:00 AM", "Tomorrow · 1:00 – 3:00 PM"];

export function referralCodeFor(account: { id: string; name: string }) {
  const letters = account.name.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  let hash = 0;
  for (const char of account.id) hash = (hash * 31 + char.charCodeAt(0)) % 900;
  return `${letters}${100 + hash}`;
}
export function defaultProfile(account: { id: string; name: string }): CustomerProfile {
  return { accountId: account.id, email: "", addresses: [], methods: [], prefs: { preferredSlot: SLOT_OPTIONS[0], accessNote: "", channels: { push: true, sms: true, email: true } }, referralCode: referralCodeFor(account), credit: 0, points: 0, lifetimePoints: 0, ledger: [], favourites: [] };
}
export const TIERS = [
  { name: "Bronze", min: 0, perk: "Earn 1 point per ₦100 spent" },
  { name: "Silver", min: 500, perk: "Priority support + early access to offers" },
  { name: "Gold", min: 1500, perk: "Free service protection fee on every booking" },
];
export function tierOf(lifetimePoints: number) {
  const index = TIERS.reduce((best, tier, i) => (lifetimePoints >= tier.min ? i : best), 0);
  return { tier: TIERS[index], next: TIERS[index + 1] };
}

export type Settings = { referrerReward: number; refereeReward: number; pointsPer100: number; redeemBlock: number; redeemValue: number };
export const DEFAULT_SETTINGS: Settings = { referrerReward: 1000, refereeReward: 1000, pointsPer100: 1, redeemBlock: 100, redeemValue: 500 };

/* ---------- promotions ---------- */
export type Promo = { id: string; code: string; description: string; type: "percent" | "flat"; value: number; maxDiscount: number; minOrder: number; maxUses: number; used: number; expiresAt?: string; audience: "all" | "new"; active: boolean; createdAt: string };
export type PromoResult = { ok: boolean; discount: number; message: string };
export function evaluatePromo(promo: Promo | undefined, subtotal: number, ctx: { isNewCustomer: boolean; usedByCustomer: boolean }, now = Date.now()): PromoResult {
  const fail = (message: string): PromoResult => ({ ok: false, discount: 0, message });
  if (!promo) return fail("That code isn't valid.");
  if (!promo.active) return fail("This code is no longer active.");
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() + 86400000 < now) return fail("This code has expired.");
  if (promo.maxUses > 0 && promo.used >= promo.maxUses) return fail("This code has been fully redeemed.");
  if (promo.audience === "new" && !ctx.isNewCustomer) return fail("This code is for first bookings only.");
  if (ctx.usedByCustomer) return fail("You've already used this code.");
  if (subtotal < promo.minOrder) return fail(`Spend at least ₦${promo.minOrder.toLocaleString()} to use this code.`);
  let discount = promo.type === "percent" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  if (promo.maxDiscount > 0) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { ok: true, discount, message: `${promo.code} applied · you save ₦${discount.toLocaleString()}` };
}

/* ---------- seeds (demo data; merged into saved state by id) ---------- */
type SeedProvider = { id: string; accountId: string; name: string; phone: string; service: string; city: string; rating: number; completedJobs: number; joinedAt: string; area: string; priceFrom: number; years: number; bio: string; available: boolean; days: string[]; reviews: number };
const allWeek = DAYS, weekdays = DAYS.slice(0, 5);
export const SEED_PROVIDERS: SeedProvider[] = [
  { id: "provider-demo", accountId: "partner-demo", name: "Ibrahim Musa", phone: "08012345678", service: "AC repair & servicing", city: "Lagos", rating: 4.92, completedJobs: 146, joinedAt: "2024-03-18T09:00:00.000Z", area: "Lekki Phase 1, Lagos", priceFrom: 12500, years: 8, bio: "Certified HVAC technician. Gas top-ups, deep coil cleaning and fault diagnosis for split and cassette units.", available: true, days: allWeek, reviews: 146 },
  { id: "provider-s1", accountId: "partner-s1", name: "Blessing Okafor", phone: "08031000001", service: "Deep cleaning", city: "Lagos", rating: 4.9, completedJobs: 212, joinedAt: "2023-11-02T09:00:00.000Z", area: "Victoria Island, Lagos", priceFrom: 18000, years: 6, bio: "Leads a trained two-person crew. Move-in/out cleans, post-construction and sofa & mattress steam cleaning.", available: true, days: allWeek, reviews: 212 },
  { id: "provider-s2", accountId: "partner-s2", name: "Emeka Eze", phone: "08031000002", service: "Electrical repairs", city: "Lagos", rating: 4.7, completedJobs: 98, joinedAt: "2024-05-20T09:00:00.000Z", area: "Ikeja GRA, Lagos", priceFrom: 7500, years: 10, bio: "Licensed electrician. Rewiring, DB board upgrades, inverter installs and full safety inspections.", available: true, days: weekdays, reviews: 98 },
  { id: "provider-s3", accountId: "partner-s3", name: "Tunde Adebayo", phone: "08031000003", service: "Plumbing", city: "Lagos", rating: 4.8, completedJobs: 131, joinedAt: "2024-01-09T09:00:00.000Z", area: "Yaba, Lagos", priceFrom: 8000, years: 7, bio: "Leak detection, pipe replacement, water heater and pump installation. Same-day emergency call-outs.", available: true, days: allWeek, reviews: 131 },
  { id: "provider-s4", accountId: "partner-s4", name: "Amina Bello", phone: "08031000004", service: "Beauty at home", city: "Lagos", rating: 4.95, completedJobs: 174, joinedAt: "2023-09-14T09:00:00.000Z", area: "Lekki Phase 1, Lagos", priceFrom: 10000, years: 5, bio: "Makeup artist and hairstylist for bridal trials, events and everyday glam, all at your home.", available: true, days: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], reviews: 174 },
  { id: "provider-s5", accountId: "partner-s5", name: "Chinedu Obi", phone: "08031000005", service: "AC repair & servicing", city: "Abuja", rating: 4.6, completedJobs: 64, joinedAt: "2024-08-01T09:00:00.000Z", area: "Wuse 2, Abuja", priceFrom: 12000, years: 4, bio: "AC servicing and installation across Wuse, Garki and Maitama. 30-day workmanship warranty.", available: true, days: weekdays, reviews: 64 },
  { id: "provider-s6", accountId: "partner-s6", name: "Fatima Yusuf", phone: "08031000006", service: "Deep cleaning", city: "Abuja", rating: 4.85, completedJobs: 89, joinedAt: "2024-02-11T09:00:00.000Z", area: "Maitama, Abuja", priceFrom: 17000, years: 5, bio: "Detail-focused home and office cleaning with eco-friendly products.", available: true, days: allWeek, reviews: 89 },
  { id: "provider-s7", accountId: "partner-s7", name: "Segun Alade", phone: "08031000007", service: "Electrical repairs", city: "Lagos", rating: 4.5, completedJobs: 41, joinedAt: "2025-01-15T09:00:00.000Z", area: "Lekki Phase 1, Lagos", priceFrom: 7000, years: 3, bio: "Sockets, lighting, generators changeover and fault finding.", available: false, days: ["Sat", "Sun"], reviews: 41 },
];
export const SEED_PROMOS: Promo[] = [
  { id: "promo-welcome", code: "WELCOME10", description: "10% off your first booking (up to ₦3,000)", type: "percent", value: 10, maxDiscount: 3000, minOrder: 5000, maxUses: 0, used: 0, audience: "new", active: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "promo-serve2000", code: "SERVE2000", description: "₦2,000 off orders above ₦15,000", type: "flat", value: 2000, maxDiscount: 0, minOrder: 15000, maxUses: 0, used: 0, audience: "all", active: true, createdAt: "2026-01-01T00:00:00.000Z" },
];

/* ---------- demo analytics data (deterministic) ---------- */
export function buildDemoActivity(now: number, providerIds: string[]) {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const catalog: [string, number][] = [["Standard AC servicing", 13250], ["Complete care AC servicing", 19250], ["Standard Deep cleaning", 18750], ["Standard Electrical", 8250], ["Standard Plumbing", 8750], ["Standard Beauty at home", 10750]];
  const names = ["Tola Bakare", "Uche Nnamdi", "Kemi Adeyemi", "Musa Danjuma", "Ngozi Eze", "Femi Lawal", "Halima Sani", "Bola Ajayi", "Ifeanyi Obi", "Sade Coker"];
  const reviews = ["Arrived on time and did a neat job.", "Great work, would book again.", "Professional and polite.", "Fixed the issue quickly.", "Good, but arrived a little late."];
  const bookings: import("./PlatformContext").Booking[] = [];
  const payments: import("./PlatformContext").Payment[] = [];
  for (let i = 0; i < 42; i++) {
    const daysAgo = Math.floor(rnd() * 30), created = now - daysAgo * 86400000 - Math.floor(rnd() * 8 * 3600000);
    const [service, amount] = catalog[Math.floor(rnd() * catalog.length)];
    const roll = rnd(), status = roll < 0.82 ? "completed" : roll < 0.9 ? "cancelled" : "accepted";
    const id = `SN-D${String(i + 1).padStart(4, "0")}`, customer = names[Math.floor(rnd() * names.length)];
    const providerId = providerIds[Math.floor(rnd() * providerIds.length)];
    const discount = rnd() < 0.2 ? 2000 : 0;
    const acceptedAt = new Date(created + (5 + Math.floor(rnd() * 35)) * 60000).toISOString();
    const completedAt = new Date(created + (70 + Math.floor(rnd() * 170)) * 60000).toISOString();
    bookings.push({ id, customerId: `demo-c${names.indexOf(customer) + 1}`, customerName: customer, service, address: "Lagos", slot: "Demo", amount, status: status as never, completionPin: "0000", providerId: status === "cancelled" ? undefined : providerId, createdAt: new Date(created).toISOString(), acceptedAt: status === "cancelled" ? undefined : acceptedAt, completedAt: status === "completed" ? completedAt : undefined, discount: discount || undefined, promoCode: discount ? "SERVE2000" : undefined, rating: status === "completed" ? 3 + Math.floor(rnd() * 3) : undefined, review: status === "completed" && rnd() < 0.5 ? reviews[Math.floor(rnd() * reviews.length)] : undefined });
    payments.push({ id: `PAY-D${i + 1}`, bookingId: id, amount, status: status === "completed" ? "released" : status === "cancelled" ? "refunded" : "escrow", createdAt: new Date(created).toISOString() });
  }
  return { bookings, payments };
}

export const PROTECTION_FEE = 750;
/** Gold members have the service protection fee waived (funded by the platform). */
export function loyaltyDiscount(lifetimePoints: number) { return tierOf(lifetimePoints).tier.name === "Gold" ? PROTECTION_FEE : 0; }
