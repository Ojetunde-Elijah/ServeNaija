import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Session, UserRole } from "./AuthModal";
import { AREA_NAMES, AREAS, DEFAULT_SETTINGS, SEED_PROMOS, SEED_PROVIDERS, buildDemoActivity, defaultProfile, evaluatePromo, loyaltyDiscount, referralCodeFor, type CustomerProfile, type LedgerEntry, type Promo, type PromoResult, type Settings } from "./platformLogic";

export type Account = Session & { id: string; password: string };
export type Provider = { id: string; accountId: string; name: string; service: string; city: string; status: "pending" | "approved" | "rejected"; rating: number; completedJobs: number; joinedAt: string; area?: string; priceFrom?: number; years?: number; bio?: string; available?: boolean; days?: string[]; reviews?: number };
export type BookingStatus = "paid" | "accepted" | "in_progress" | "completed" | "cancelled";
export type Booking = { id: string; customerId: string; customerName: string; service: string; address: string; slot: string; amount: number; status: BookingStatus; completionPin: string; providerId?: string; createdAt: string; completedAt?: string; note?: string; discount?: number; creditUsed?: number; promoCode?: string; paidWith?: string; requestedProviderId?: string; acceptedAt?: string; startedAt?: string; rating?: number; review?: string; ratedAt?: string };
export type Payment = { id: string; bookingId: string; amount: number; status: "escrow" | "released" | "refunded"; createdAt: string };
export type NotificationAudience = "consumer" | "artisan" | "admin";
export type NotificationKind = "booking" | "job" | "escrow" | "partner" | "system";
export type AppNotification = { id: string; audience: NotificationAudience; recipientId?: string; kind: NotificationKind; title: string; body: string; refId?: string; read: boolean; createdAt: string; channels: ("in_app" | "push" | "sms" | "email")[] };
export type PlatformState = { accounts: Account[]; providers: Provider[]; bookings: Booking[]; payments: Payment[]; notifications: AppNotification[]; profiles: Record<string, CustomerProfile>; promos: Promo[]; settings: Settings };

type Action =
  | { type: "REGISTER"; account: Account }
  | { type: "SUBMIT_PROVIDER"; provider: Provider }
  | { type: "APPROVE_PROVIDER"; providerId: string }
  | { type: "REJECT_PROVIDER"; providerId: string }
  | { type: "CREATE_BOOKING"; booking: Booking; payment: Payment }
  | { type: "ACCEPT_BOOKING"; bookingId: string; providerId: string; at: string }
  | { type: "START_BOOKING"; bookingId: string; at: string }
  | { type: "COMPLETE_BOOKING"; bookingId: string; providerId: string }
  | { type: "CANCEL_BOOKING"; bookingId: string }
  | { type: "DECLINE_REQUESTED"; bookingId: string }
  | { type: "RATE_BOOKING"; bookingId: string; rating: number; review: string; at: string }
  | { type: "NOTIFY"; items: AppNotification[] }
  | { type: "MARK_READ"; ids: string[] }
  | { type: "PROFILE_UPDATE"; accountId: string; fn: (profile: CustomerProfile) => CustomerProfile }
  | { type: "RENAME_ACCOUNT"; accountId: string; name: string }
  | { type: "PROVIDER_PATCH"; providerId: string; patch: Partial<Provider> }
  | { type: "PROMO_ADD"; promo: Promo }
  | { type: "PROMO_TOGGLE"; promoId: string }
  | { type: "PROMO_DELETE"; promoId: string }
  | { type: "SETTINGS"; patch: Partial<Settings> }
  | { type: "SEED_DEMO"; bookings: Booking[]; payments: Payment[] }
  | { type: "CLEAR_DEMO" }
  | { type: "SYNC"; state: PlatformState };

const seedAccounts: Account[] = [
  { id: "admin-1", name: "Adaeze Admin", phone: "08000000000", password: "admin123", role: "admin" },
  { id: "customer-demo", name: "Chidinma Okeke", phone: "08098765432", password: "customer123", role: "consumer" },
  ...SEED_PROVIDERS.map((seed): Account => ({ id: seed.accountId, name: seed.name, phone: seed.phone, password: "partner123", role: "artisan" })),
];
const seedProviders: Provider[] = SEED_PROVIDERS.map(({ phone: _phone, ...seed }) => ({ ...seed, status: "approved" as const }));

const initialState: PlatformState = { accounts: seedAccounts, providers: seedProviders, bookings: [], payments: [], notifications: [], profiles: {}, promos: SEED_PROMOS, settings: DEFAULT_SETTINGS };

/** Merge saved state with new seeds/fields so existing browsers upgrade cleanly. */
function hydrate(saved: Partial<PlatformState>): PlatformState {
  const merged = { ...initialState, ...saved } as PlatformState;
  merged.accounts = [...merged.accounts, ...seedAccounts.filter((seed) => !merged.accounts.some((item) => item.id === seed.id))];
  merged.providers = [...merged.providers.map((item) => { const seed = seedProviders.find((s) => s.id === item.id); return seed ? { ...seed, ...Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined)) } as Provider : item; }), ...seedProviders.filter((seed) => !merged.providers.some((item) => item.id === seed.id))];
  merged.promos = [...(merged.promos || []), ...SEED_PROMOS.filter((seed) => !(merged.promos || []).some((item) => item.id === seed.id))];
  merged.profiles = merged.profiles || {};
  merged.settings = { ...DEFAULT_SETTINGS, ...(merged.settings || {}) };
  merged.notifications = merged.notifications || [];
  return merged;
}

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function withProfile(state: PlatformState, accountId: string, fn: (profile: CustomerProfile) => CustomerProfile): PlatformState {
  const account = state.accounts.find((item) => item.id === accountId);
  const current = state.profiles[accountId] ?? defaultProfile(account ?? { id: accountId, name: "Customer" });
  return { ...state, profiles: { ...state.profiles, [accountId]: fn(current) } };
}
function addLedger(profile: CustomerProfile, entry: Omit<LedgerEntry, "id" | "createdAt">): CustomerProfile {
  return { ...profile, credit: profile.credit + entry.credit, points: Math.max(0, profile.points + entry.points), lifetimePoints: profile.lifetimePoints + (entry.kind === "loyalty" ? entry.points : 0), ledger: [{ ...entry, id: uid("led"), createdAt: new Date().toISOString() }, ...profile.ledger].slice(0, 100) };
}
export function pointsFor(settings: Settings, booking: Booking) { return Math.floor(((booking.amount - (booking.discount || 0)) / 100) * settings.pointsPer100); }
export function referralPayout(state: PlatformState, booking: Booking) {
  const profile = state.profiles[booking.customerId];
  if (!profile?.referredBy || profile.referralRewarded) return null;
  const referrer = state.accounts.find((item) => item.role === "consumer" && item.id !== booking.customerId && referralCodeFor(item) === profile.referredBy);
  return referrer ? { referrerId: referrer.id, referrerName: referrer.name, amount: state.settings.referrerReward } : null;
}

function reducer(state: PlatformState, action: Action): PlatformState {
  switch (action.type) {
    case "REGISTER": return { ...state, accounts: [...state.accounts, action.account] };
    case "SUBMIT_PROVIDER": {
      const exists = state.providers.some((provider) => provider.accountId === action.provider.accountId);
      return { ...state, providers: exists ? state.providers.map((provider) => provider.accountId === action.provider.accountId ? action.provider : provider) : [...state.providers, action.provider] };
    }
    case "APPROVE_PROVIDER": return { ...state, providers: state.providers.map((provider) => provider.id === action.providerId ? { ...provider, status: "approved" } : provider) };
    case "REJECT_PROVIDER": return { ...state, providers: state.providers.map((provider) => provider.id === action.providerId ? { ...provider, status: "rejected" } : provider) };
    case "CREATE_BOOKING": {
      let next: PlatformState = { ...state, bookings: [action.booking, ...state.bookings], payments: [action.payment, ...state.payments] };
      const code = action.booking.promoCode;
      if (code) next = { ...next, promos: next.promos.map((promo) => promo.code === code ? { ...promo, used: promo.used + 1 } : promo) };
      if (action.booking.creditUsed) next = withProfile(next, action.booking.customerId, (profile) => addLedger(profile, { kind: "spent", credit: -(action.booking.creditUsed || 0), points: 0, note: `Credit applied to ${action.booking.id}` }));
      return next;
    }
    case "ACCEPT_BOOKING": return { ...state, bookings: state.bookings.map((booking) => booking.id === action.bookingId ? { ...booking, providerId: action.providerId, status: "accepted", acceptedAt: action.at } : booking) };
    case "START_BOOKING": return { ...state, bookings: state.bookings.map((booking) => booking.id === action.bookingId ? { ...booking, status: "in_progress", startedAt: action.at } : booking) };
    case "COMPLETE_BOOKING": {
      const booking = state.bookings.find((item) => item.id === action.bookingId);
      let next: PlatformState = {
        ...state,
        bookings: state.bookings.map((item) => item.id === action.bookingId ? { ...item, status: "completed", completedAt: new Date().toISOString() } : item),
        payments: state.payments.map((payment) => payment.bookingId === action.bookingId ? { ...payment, status: "released" } : payment),
        providers: state.providers.map((provider) => provider.id === action.providerId ? { ...provider, completedJobs: provider.completedJobs + 1 } : provider),
      };
      if (booking) {
        const earned = pointsFor(state.settings, booking);
        next = withProfile(next, booking.customerId, (profile) => addLedger(profile, { kind: "loyalty", credit: 0, points: earned, note: `Earned on ${booking.id}` }));
        const payout = referralPayout(state, booking);
        if (payout) {
          next = withProfile(next, payout.referrerId, (profile) => addLedger(profile, { kind: "referral", credit: payout.amount, points: 0, note: `Referral reward · ${booking.customerName}'s first booking` }));
          next = withProfile(next, booking.customerId, (profile) => ({ ...profile, referralRewarded: true }));
        }
      }
      return next;
    }
    case "CANCEL_BOOKING": {
      const booking = state.bookings.find((item) => item.id === action.bookingId);
      if (!booking || booking.status === "completed" || booking.status === "cancelled") return state;
      let next: PlatformState = { ...state, bookings: state.bookings.map((item) => item.id === action.bookingId ? { ...item, status: "cancelled" } : item), payments: state.payments.map((payment) => payment.bookingId === action.bookingId ? { ...payment, status: "refunded" } : payment) };
      if (booking.promoCode) next = { ...next, promos: next.promos.map((promo) => promo.code === booking.promoCode ? { ...promo, used: Math.max(0, promo.used - 1) } : promo) };
      if (booking.creditUsed) next = withProfile(next, booking.customerId, (profile) => addLedger(profile, { kind: "refund", credit: booking.creditUsed || 0, points: 0, note: `Credit refunded from ${booking.id}` }));
      return next;
    }
    case "DECLINE_REQUESTED": return { ...state, bookings: state.bookings.map((booking) => booking.id === action.bookingId ? { ...booking, requestedProviderId: undefined } : booking) };
    case "RATE_BOOKING": {
      const booking = state.bookings.find((item) => item.id === action.bookingId);
      if (!booking || booking.rating) return state;
      return {
        ...state,
        bookings: state.bookings.map((item) => item.id === action.bookingId ? { ...item, rating: action.rating, review: action.review || undefined, ratedAt: action.at } : item),
        providers: state.providers.map((provider) => {
          if (provider.id !== booking.providerId) return provider;
          const count = provider.rating > 0 ? (provider.reviews ?? provider.completedJobs) : 0;
          return { ...provider, rating: Math.round(((provider.rating * count + action.rating) / (count + 1)) * 100) / 100, reviews: count + 1 };
        }),
      };
    }
    case "NOTIFY": return { ...state, notifications: [...action.items, ...state.notifications].slice(0, 300) };
    case "MARK_READ": return { ...state, notifications: state.notifications.map((item) => action.ids.includes(item.id) ? { ...item, read: true } : item) };
    case "PROFILE_UPDATE": return withProfile(state, action.accountId, action.fn);
    case "RENAME_ACCOUNT": return { ...state, accounts: state.accounts.map((item) => item.id === action.accountId ? { ...item, name: action.name } : item) };
    case "PROVIDER_PATCH": return { ...state, providers: state.providers.map((provider) => provider.id === action.providerId ? { ...provider, ...action.patch } : provider) };
    case "PROMO_ADD": return { ...state, promos: [action.promo, ...state.promos] };
    case "PROMO_TOGGLE": return { ...state, promos: state.promos.map((promo) => promo.id === action.promoId ? { ...promo, active: !promo.active } : promo) };
    case "PROMO_DELETE": return { ...state, promos: state.promos.filter((promo) => promo.id !== action.promoId) };
    case "SETTINGS": return { ...state, settings: { ...state.settings, ...action.patch } };
    case "SEED_DEMO": {
      const existing = new Set(state.bookings.map((booking) => booking.id));
      return { ...state, bookings: [...state.bookings, ...action.bookings.filter((booking) => !existing.has(booking.id))], payments: [...state.payments, ...action.payments.filter((payment) => !existing.has(payment.bookingId))] };
    }
    case "CLEAR_DEMO": return { ...state, bookings: state.bookings.filter((booking) => !booking.id.startsWith("SN-D")), payments: state.payments.filter((payment) => !payment.bookingId.startsWith("SN-D")) };
    case "SYNC": return action.state;
  }
  return state;
}

type Result = { ok: boolean; message: string };
type PlatformApi = PlatformState & {
  register: (name: string, phone: string, password: string, role: Exclude<UserRole, "admin">) => Account;
  authenticate: (phone: string, password: string, role: UserRole) => Account | null;
  submitProvider: (account: Account, service: string, city: string) => void;
  approveProvider: (providerId: string) => void;
  rejectProvider: (providerId: string) => void;
  createBooking: (input: Omit<Booking, "id" | "createdAt" | "completionPin" | "status">) => Booking;
  acceptBooking: (bookingId: string, providerId: string) => void;
  declineBooking: (bookingId: string, providerId: string) => void;
  startBooking: (bookingId: string) => void;
  completeBooking: (bookingId: string, providerId: string, pin: string) => boolean;
  cancelBooking: (bookingId: string) => void;
  rateBooking: (bookingId: string, rating: number, review: string) => Result;
  notificationsFor: (audience: NotificationAudience, recipientId?: string) => AppNotification[];
  markNotificationsRead: (ids: string[]) => void;
  // customer profile, wallet & loyalty
  profileOf: (accountId: string) => CustomerProfile;
  updateProfile: (accountId: string, fn: (profile: CustomerProfile) => CustomerProfile) => void;
  renameAccount: (accountId: string, name: string) => void;
  validatePromo: (code: string, subtotal: number, customerId: string) => PromoResult & { promo?: Promo };
  redeemReferralCode: (accountId: string, code: string) => Result;
  redeemPoints: (accountId: string, blocks: number) => Result;
  // partner listing
  patchProvider: (providerId: string, patch: Partial<Provider>) => void;
  // admin: promotions, settings, demo data
  createPromo: (input: Pick<Promo, "code" | "description" | "type" | "value" | "maxDiscount" | "minOrder" | "maxUses" | "expiresAt" | "audience">) => Result;
  togglePromo: (promoId: string) => void;
  deletePromo: (promoId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  seedDemoData: () => void;
  clearDemoData: () => void;
};

const PlatformContext = createContext<PlatformApi | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (fallback) => {
    const saved = localStorage.getItem("servenaija-platform-state");
    if (!saved) return fallback;
    try { return hydrate(JSON.parse(saved)); } catch { return fallback; }
  });
  useEffect(() => { localStorage.setItem("servenaija-platform-state", JSON.stringify(state)); }, [state]);
  // Keep every open tab (customer, partner, admin) in sync in real time.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "servenaija-platform-state" || !event.newValue) return;
      try { dispatch({ type: "SYNC", state: hydrate(JSON.parse(event.newValue)) }); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const money = (amount: number) => `₦${amount.toLocaleString()}`;
  // Integration point: replace with POST /notifications + push/SMS/email providers (see BACKEND_INTEGRATION.md).
  const make = (audience: NotificationAudience, kind: NotificationKind, title: string, body: string, refId?: string, recipientId?: string, channels: AppNotification["channels"] = ["in_app"]): AppNotification => {
    const prefs = audience === "consumer" && recipientId ? state.profiles[recipientId]?.prefs.channels : undefined;
    const allowed = prefs ? channels.filter((channel) => channel === "in_app" || prefs[channel]) : channels;
    return { id: uid("ntf"), audience, recipientId, kind, title, body, refId, read: false, createdAt: new Date().toISOString(), channels: allowed };
  };
  const notify = (items: AppNotification[]) => { if (items.length) dispatch({ type: "NOTIFY", items }); };
  const getProfile = (accountId: string) => {
    const account = state.accounts.find((item) => item.id === accountId);
    return state.profiles[accountId] ?? defaultProfile(account ?? { id: accountId, name: "Customer" });
  };
  const promoContext = (customerId: string, code: string) => ({
    isNewCustomer: !state.bookings.some((booking) => booking.customerId === customerId && booking.status !== "cancelled"),
    usedByCustomer: state.bookings.some((booking) => booking.customerId === customerId && booking.promoCode === code && booking.status !== "cancelled"),
  });

  const api = useMemo<PlatformApi>(() => ({
    ...state,
    register(name, phone, password, role) {
      const account: Account = { id: `acct-${Date.now()}`, name, phone: phone.replace(/\D/g, ""), password, role };
      dispatch({ type: "REGISTER", account });
      return account;
    },
    authenticate(phone, password, role) {
      const cleanPhone = phone.replace(/\D/g, "");
      return state.accounts.find((account) => account.phone === cleanPhone && account.password === password && account.role === role) || null;
    },
    submitProvider(account, service, city) {
      const area = AREA_NAMES.find((name) => AREAS[name].city.toLowerCase() === city.toLowerCase()) || AREA_NAMES[0];
      dispatch({ type: "SUBMIT_PROVIDER", provider: { id: `provider-${account.id}`, accountId: account.id, name: account.name, service, city, status: "pending", rating: 0, completedJobs: 0, joinedAt: new Date().toISOString(), area, priceFrom: 10000, available: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], years: 1, bio: `${service} professional serving ${city}.` } });
      notify([
        make("admin", "partner", "New partner application", `${account.name} applied as ${service} in ${city}. Review in Compliance.`, `provider-${account.id}`),
        make("artisan", "partner", "Application received", "Your application is with our compliance team. We'll notify you once it's reviewed.", `provider-${account.id}`, account.id),
      ]);
    },
    approveProvider(providerId) {
      const provider = state.providers.find((item) => item.id === providerId);
      dispatch({ type: "APPROVE_PROVIDER", providerId });
      if (provider) notify([make("artisan", "partner", "You're approved 🎉", "Your profile is live. You can now receive paid job requests.", providerId, provider.accountId, ["in_app", "push", "sms"]), make("admin", "partner", "Partner activated", `${provider.name} was approved and is now live.`, providerId)]);
    },
    rejectProvider(providerId) {
      const provider = state.providers.find((item) => item.id === providerId);
      dispatch({ type: "REJECT_PROVIDER", providerId });
      if (provider) notify([make("artisan", "partner", "Application needs attention", "Compliance couldn't approve your profile yet. Contact partner support to update your details.", providerId, provider.accountId, ["in_app", "sms"]), make("admin", "partner", "Partner rejected", `${provider.name}'s application was rejected.`, providerId)]);
    },
    createBooking(input) {
      const id = `SN-${String(Date.now()).slice(-6)}`;
      const profile = getProfile(input.customerId);
      // Server-side style validation: never trust discounts or credit sent by the UI.
      const code = input.promoCode?.trim().toUpperCase();
      const promo = code ? state.promos.find((item) => item.code === code) : undefined;
      const promoResult = code ? evaluatePromo(promo, input.amount, promoContext(input.customerId, code)) : undefined;
      const promoDiscount = promoResult?.ok ? promoResult.discount : 0;
      const tierDiscount = Math.min(loyaltyDiscount(profile.lifetimePoints), input.amount - promoDiscount);
      const discount = promoDiscount + tierDiscount;
      const creditUsed = Math.max(0, Math.min(input.creditUsed ?? 0, profile.credit, input.amount - discount));
      const paid = input.amount - discount - creditUsed;
      const booking: Booking = { ...input, id, createdAt: new Date().toISOString(), completionPin: String(Math.floor(1000 + Math.random() * 9000)), status: "paid", discount: discount || undefined, creditUsed: creditUsed || undefined, promoCode: promoDiscount ? code : undefined };
      dispatch({ type: "CREATE_BOOKING", booking, payment: { id: `PAY-${Date.now()}`, bookingId: id, amount: booking.amount, status: "escrow", createdAt: new Date().toISOString() } });
      const approved = state.providers.filter((item) => item.status === "approved");
      const targets = booking.requestedProviderId ? approved.filter((item) => item.id === booking.requestedProviderId) : approved;
      const perks = [promoDiscount ? `promo ${code} −${money(promoDiscount)}` : "", tierDiscount ? `Gold fee waiver −${money(tierDiscount)}` : "", creditUsed ? `credit −${money(creditUsed)}` : ""].filter(Boolean).join(" · ");
      notify([
        make("consumer", "booking", "Booking confirmed", `${booking.service} · ${money(paid)} paid${perks ? ` (${perks})` : ""} and held safely in escrow. Your completion code is ${booking.completionPin}.`, id, booking.customerId, ["in_app", "email", "sms"]),
        ...targets.map((item) => make("artisan", "job", booking.requestedProviderId ? "Customer requested you" : "New paid job request", `${booking.service} at ${booking.address}. You'll earn ${money(Math.round(booking.amount * .85))}.${booking.note ? ` Note: ${booking.note}` : ""}`, id, item.accountId, ["in_app", "push"])),
        make("admin", "escrow", "New booking · escrow funded", `${booking.customerName} booked ${booking.service} (${id}) · ${money(booking.amount)}${perks ? ` · ${perks}` : ""}.`, id),
      ]);
      return booking;
    },
    acceptBooking(bookingId, providerId) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      const provider = state.providers.find((item) => item.id === providerId);
      dispatch({ type: "ACCEPT_BOOKING", bookingId, providerId, at: new Date().toISOString() });
      if (booking && provider) notify([
        make("consumer", "booking", "Professional assigned", `${provider.name} accepted your ${booking.service} booking.`, bookingId, booking.customerId, ["in_app", "push", "sms"]),
        make("artisan", "job", "Job accepted", `${booking.service} for ${booking.customerName} is now on your schedule.`, bookingId, provider.accountId),
        make("admin", "booking", "Job dispatched", `${provider.name} accepted ${bookingId} (${booking.service}).`, bookingId),
      ]);
    },
    declineBooking(bookingId, providerId) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.requestedProviderId !== providerId || booking.providerId) return;
      const provider = state.providers.find((item) => item.id === providerId);
      dispatch({ type: "DECLINE_REQUESTED", bookingId });
      notify([
        make("consumer", "booking", "Finding another professional", `${provider?.name || "Your requested professional"} is unavailable. We're matching you with another verified pro.`, bookingId, booking.customerId, ["in_app", "push"]),
        ...state.providers.filter((item) => item.status === "approved" && item.id !== providerId).map((item) => make("artisan", "job", "New paid job request", `${booking.service} at ${booking.address}. You'll earn ${money(Math.round(booking.amount * .85))}.`, bookingId, item.accountId, ["in_app", "push"])),
        make("admin", "booking", "Requested partner declined", `${provider?.name} declined ${bookingId}; it's now open to all partners.`, bookingId),
      ]);
    },
    startBooking(bookingId) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      const provider = state.providers.find((item) => item.id === booking?.providerId);
      dispatch({ type: "START_BOOKING", bookingId, at: new Date().toISOString() });
      if (booking) notify([
        make("consumer", "booking", "Service started", `${provider?.name || "Your professional"} has started ${booking.service}. Share your completion code only when you're satisfied.`, bookingId, booking.customerId, ["in_app", "push"]),
        make("admin", "booking", "Service in progress", `${bookingId} (${booking.service}) is now in progress.`, bookingId),
      ]);
    },
    completeBooking(bookingId, providerId, pin) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.completionPin !== pin || booking.providerId !== providerId) return false;
      const provider = state.providers.find((item) => item.id === providerId);
      const earned = pointsFor(state.settings, booking);
      const payout = referralPayout(state, booking);
      dispatch({ type: "COMPLETE_BOOKING", bookingId, providerId });
      notify([
        make("consumer", "escrow", "Service completed", `${booking.service} is complete. Payment released to the partner. You earned ${earned} loyalty points — rate your pro in Profile › History.`, bookingId, booking.customerId, ["in_app", "email"]),
        make("artisan", "escrow", "Payment released", `${money(Math.round(booking.amount * .85))} for ${bookingId} was released to your wallet after 15% commission.`, bookingId, provider?.accountId, ["in_app", "push", "sms"]),
        make("admin", "escrow", "Escrow released", `${bookingId} completed with PIN. ${money(booking.amount)} released · ${money(Math.round(booking.amount * .15))} platform revenue.`, bookingId),
        ...(payout ? [make("consumer", "system", "Referral reward earned 🎁", `${booking.customerName} completed their first booking — ${money(payout.amount)} credit added to your wallet.`, bookingId, payout.referrerId, ["in_app", "push"]), make("admin", "system", "Referral reward issued", `${money(payout.amount)} credited to ${payout.referrerName} for referring ${booking.customerName}.`, bookingId)] : []),
      ]);
      return true;
    },
    cancelBooking(bookingId) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      const provider = state.providers.find((item) => item.id === booking?.providerId);
      dispatch({ type: "CANCEL_BOOKING", bookingId });
      if (booking) notify([
        make("consumer", "booking", "Booking cancelled", `${booking.service} (${bookingId}) was cancelled.${booking.creditUsed ? ` ${money(booking.creditUsed)} credit returned to your wallet.` : ""}`, bookingId, booking.customerId),
        ...(provider ? [make("artisan", "job", "Job cancelled", `${booking.service} (${bookingId}) was cancelled by the customer.`, bookingId, provider.accountId, ["in_app", "push"])] : []),
        make("admin", "escrow", "Booking cancelled · refund due", `${bookingId} cancelled. ${money(booking.amount)} needs refund review.`, bookingId),
      ]);
    },
    rateBooking(bookingId, rating, review) {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.status !== "completed") return { ok: false, message: "Only completed services can be rated." };
      if (booking.rating) return { ok: false, message: "You've already rated this service." };
      const provider = state.providers.find((item) => item.id === booking.providerId);
      dispatch({ type: "RATE_BOOKING", bookingId, rating, review: review.trim(), at: new Date().toISOString() });
      notify([
        ...(provider ? [make("artisan", "job", `New ${rating}★ rating`, `${booking.customerName} rated ${booking.service}${review.trim() ? `: "${review.trim()}"` : "."}`, bookingId, provider.accountId, ["in_app", "push"])] : []),
        ...(rating <= 2 ? [make("admin", "system", "Low rating alert", `${booking.id} received ${rating}★ for ${provider?.name || "a partner"}. Consider a quality follow-up.`, bookingId)] : []),
      ]);
      return { ok: true, message: "Thanks — your rating has been shared with the partner." };
    },
    notificationsFor(audience, recipientId) {
      return state.notifications.filter((item) => item.audience === audience && (audience === "admin" || !item.recipientId || item.recipientId === recipientId));
    },
    markNotificationsRead(ids) { if (ids.length) dispatch({ type: "MARK_READ", ids }); },

    profileOf: getProfile,
    updateProfile(accountId, fn) { dispatch({ type: "PROFILE_UPDATE", accountId, fn }); },
    renameAccount(accountId, name) { dispatch({ type: "RENAME_ACCOUNT", accountId, name }); },
    validatePromo(code, subtotal, customerId) {
      const clean = code.trim().toUpperCase();
      if (!clean) return { ok: false, discount: 0, message: "Enter a promo code." };
      const promo = state.promos.find((item) => item.code === clean);
      return { ...evaluatePromo(promo, subtotal, promoContext(customerId, clean)), promo };
    },
    redeemReferralCode(accountId, code) {
      const clean = code.trim().toUpperCase();
      const me = state.accounts.find((item) => item.id === accountId);
      if (!me) return { ok: false, message: "Account not found." };
      if (getProfile(accountId).referredBy) return { ok: false, message: "You've already added a referral code." };
      if (state.bookings.some((booking) => booking.customerId === accountId && booking.status !== "cancelled")) return { ok: false, message: "Referral codes can only be added before your first booking." };
      const referrer = state.accounts.find((item) => item.role === "consumer" && referralCodeFor(item) === clean);
      if (!referrer) return { ok: false, message: "We couldn't find that referral code." };
      if (referrer.id === accountId) return { ok: false, message: "You can't use your own code." };
      const reward = state.settings.refereeReward;
      dispatch({ type: "PROFILE_UPDATE", accountId, fn: (profile) => addLedger({ ...profile, referredBy: clean }, { kind: "welcome", credit: reward, points: 0, note: `Welcome credit · referred by ${referrer.name}` }) });
      notify([
        make("consumer", "system", "Welcome credit added 🎁", `${money(reward)} from ${referrer.name}'s referral is in your wallet. Use it at checkout.`, undefined, accountId, ["in_app", "email"]),
        make("consumer", "system", "A friend joined with your code", `${me.name} used your code. You'll earn ${money(state.settings.referrerReward)} when they complete their first booking.`, undefined, referrer.id, ["in_app", "push"]),
        make("admin", "system", "New referral", `${me.name} joined via ${referrer.name}'s code (${clean}).`),
      ]);
      return { ok: true, message: `${money(reward)} credit added to your wallet.` };
    },
    redeemPoints(accountId, blocks) {
      const { redeemBlock, redeemValue } = state.settings;
      const points = blocks * redeemBlock;
      if (blocks < 1 || getProfile(accountId).points < points) return { ok: false, message: `You need ${redeemBlock} points to redeem.` };
      dispatch({ type: "PROFILE_UPDATE", accountId, fn: (profile) => addLedger(profile, { kind: "redeem", credit: blocks * redeemValue, points: -points, note: `Redeemed ${points} points` }) });
      notify([make("consumer", "system", "Points redeemed", `${points} points converted to ${money(blocks * redeemValue)} wallet credit.`, undefined, accountId, ["in_app"])]);
      return { ok: true, message: `${money(blocks * redeemValue)} added to your wallet.` };
    },
    patchProvider(providerId, patch) { dispatch({ type: "PROVIDER_PATCH", providerId, patch }); },

    createPromo(input) {
      const code = input.code.trim().toUpperCase();
      if (!/^[A-Z0-9]{3,20}$/.test(code)) return { ok: false, message: "Code must be 3–20 letters or numbers." };
      if (state.promos.some((item) => item.code === code)) return { ok: false, message: "That code already exists." };
      if (!(input.value > 0)) return { ok: false, message: "Enter a discount value." };
      if (input.type === "percent" && input.value > 100) return { ok: false, message: "Percent can't exceed 100." };
      const promo: Promo = { ...input, code, id: uid("promo"), used: 0, active: true, createdAt: new Date().toISOString() };
      dispatch({ type: "PROMO_ADD", promo });
      notify([make("consumer", "system", `New offer: ${code}`, input.description || "Use this code at checkout.", undefined, undefined, ["in_app", "push"])]);
      return { ok: true, message: `${code} is live.` };
    },
    togglePromo(promoId) { dispatch({ type: "PROMO_TOGGLE", promoId }); },
    deletePromo(promoId) { dispatch({ type: "PROMO_DELETE", promoId }); },
    updateSettings(patch) { dispatch({ type: "SETTINGS", patch }); },
    seedDemoData() {
      const data = buildDemoActivity(Date.now(), state.providers.filter((item) => item.status === "approved").map((item) => item.id));
      dispatch({ type: "SEED_DEMO", ...data });
      notify([make("admin", "system", "Sample data loaded", `${data.bookings.length} sample bookings added for analytics (IDs start with SN-D).`)]);
    },
    clearDemoData() { dispatch({ type: "CLEAR_DEMO" }); },
  }), [state]);

  return <PlatformContext.Provider value={api}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used inside PlatformProvider");
  return context;
}
