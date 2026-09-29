import { useState } from "react";
import { usePlatform, type Provider } from "./PlatformContext";
import NotificationCenter, { useUnread } from "./Notifications";
import { AdminAnalytics, AdminPromotions } from "./AdminExtras";

type AdminView = "operations" | "compliance" | "finance" | "analytics" | "promotions";

const applications = [
  ["Ibrahim Musa", "AC Specialist", "98%", "Verified", "Skills test"],
  ["Blessing Okafor", "Deep Cleaning", "94%", "Verified", "Guarantors"],
  ["Emeka Eze", "Electrician", "87%", "Review", "NIN / BVN"],
  ["Amina Bello", "Beauty Professional", "99%", "Verified", "Final audit"],
];

export default function SuperAdmin({ onLogout }: { onLogout: () => void }) {
  const platform = usePlatform();
  const [view, setView] = useState<AdminView>("operations");
  const [surge, setSurge] = useState<Record<string, boolean>>({ Lekki: true, Ikeja: false, Maitama: true });
  const [notice, setNotice] = useState("");
  const [ntfOpen, setNtfOpen] = useState(false);
  const adminUnread = useUnread("admin");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const completedBookings = platform.bookings.filter((booking) => booking.status === "completed");
  const activeBookings = platform.bookings.filter((booking) => booking.status !== "completed" && booking.status !== "cancelled");
  const totalGmv = platform.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const escrowTotal = platform.payments.filter((payment) => payment.status === "escrow").reduce((sum, payment) => sum + payment.amount, 0);
  const averageMinutes = completedBookings.length ? Math.round(completedBookings.reduce((sum, booking) => sum + ((new Date(booking.completedAt || booking.createdAt).getTime() - new Date(booking.createdAt).getTime()) / 60000), 0) / completedBookings.length) : 0;
  const act = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span>S</span><strong>ServeNaija</strong></div><small>COMMAND CENTRE</small>
        <nav>
          <button className={view === "operations" ? "active" : ""} onClick={() => setView("operations")}>⌂ <span>Live operations</span></button>
          <button className={view === "compliance" ? "active" : ""} onClick={() => setView("compliance")}>✓ <span>Compliance</span><i>12</i></button>
          <button className={view === "finance" ? "active" : ""} onClick={() => setView("finance")}>₦ <span>Finance & escrow</span><i>8</i></button>
          <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>▤ <span>Analytics</span></button>
          <button className={view === "promotions" ? "active" : ""} onClick={() => setView("promotions")}>✦ <span>Promotions</span></button>
        </nav>
        <div className="admin-user"><span>AA</span><div><strong>Adaeze Admin</strong><small>Super Administrator</small></div></div>
        <button className="admin-logout" onClick={onLogout}>Sign out</button>
      </aside>
      <main className="admin-main">
        {notice && <div className="admin-toast">✓ {notice}</div>}
        <header className="admin-header"><div><span>Tuesday, 18 June · 10:24 AM</span><h1>{view === "operations" ? "Live Operations" : view === "compliance" ? "Artisan Compliance" : view === "finance" ? "Finance & Escrow" : view === "analytics" ? "Analytics & Reports" : "Promotions & Referrals"}</h1></div><div><button onClick={() => act("Operations data refreshed")}>↻ Refresh</button><button data-ntf-toggle onClick={() => setNtfOpen((value) => !value)}>Notifications {adminUnread > 0 && <i />}{adminUnread > 0 && <b className="ntf-badge">{adminUnread}</b>}</button><NotificationCenter audience="admin" open={ntfOpen} onClose={() => setNtfOpen(false)} /></div></header>

        {view === "operations" && <>
          <section className="admin-kpis">{[["Active bookings", String(activeBookings.length), `${platform.bookings.length} total requests`], ["Approved partners", String(platform.providers.filter((provider) => provider.status === "approved").length), `${platform.providers.filter((provider) => provider.status === "pending").length} awaiting approval`], ["Total GMV", `₦${totalGmv.toLocaleString()}`, `${platform.payments.length} payments`], ["Services completed", String(completedBookings.length), "Across all cities"], ["Avg. completion", averageMinutes ? `${averageMinutes} mins` : "—", "Paid to completed"]].map(([label, value, trend]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{trend}</small></article>)}</section>
          <section className="admin-grid">
            <article className="ops-map admin-panel"><div className="admin-panel-head"><div><h2>Lagos live demand</h2><p>Active jobs and service density</p></div><select><option>All services</option><option>AC servicing</option><option>Cleaning</option></select></div><div className="city-map"><span className="map-label lekki">Lekki <b>186</b></span><span className="map-label vi">Victoria Island <b>94</b></span><span className="map-label ikeja">Ikeja <b>142</b></span><span className="map-label yaba">Yaba <b>78</b></span><i className="heat heat-one" /><i className="heat heat-two" /><i className="heat heat-three" /></div></article>
            <article className="activity-feed admin-panel"><div className="admin-panel-head"><div><h2>Live activity</h2><p>Across all cities</p></div></div>{(platform.notifications.filter((item) => item.audience === "admin").length ? platform.notifications.filter((item) => item.audience === "admin").slice(0, 6).map((item) => [item.title, item.body, (() => { const m = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 60000); return m < 1 ? "NOW" : m < 60 ? `${m}M` : `${Math.round(m / 60)}H`; })(), item.id]) : [["Booking completed", "Lekki · ₦18,500", "NOW"], ["New artisan online", "Ikeja · Electrical", "2M"], ["SOS check resolved", "Wuse 2 · SN-20372", "5M"], ["Escrow released", "VI · ₦32,000", "8M"]]).map(([title, copy, time, key]) => <div className="activity-item" key={key || title}><i /><span><strong>{title}</strong><small>{copy}</small></span><b>{time}</b></div>)}</article>
          </section>
          <section className="surge-panel admin-panel"><div className="admin-panel-head"><div><h2>Demand and surge controls</h2><p>Adjust marketplace incentives by zone</p></div><button onClick={() => act("Surge configuration saved")}>Save changes</button></div><div className="surge-table">{Object.entries(surge).map(([zone, enabled]) => <div key={zone}><strong>{zone}</strong><span>{zone === "Lekki" ? "186" : zone === "Ikeja" ? "142" : "96"} active requests</span><b className={enabled ? "high" : ""}>{enabled ? "1.25× surge" : "Standard pricing"}</b><button className={enabled ? "toggle-switch on" : "toggle-switch"} onClick={() => setSurge((current) => ({ ...current, [zone]: !enabled }))}><i /></button></div>)}</div></section>
        </>}

        {view === "compliance" && <>
          <section className="pipeline">{["Application", "NIN / BVN", "Guarantors", "Skills test", "Approved"].map((stage, index) => <article key={stage}><span>{stage}</span><strong>{index === 0 ? platform.providers.filter((provider) => provider.status === "pending").length : index === 4 ? platform.providers.filter((provider) => provider.status === "approved").length : [0, 2, 1, 0, 0][index]}</strong><small>{index < 4 ? "awaiting review" : "active partners"}</small></article>)}</section>
          <section className="audit-table admin-panel"><div className="admin-panel-head"><div><h2>Document audit queue</h2><p>12 applications require action</p></div><button onClick={() => act("Queue filters opened")}>Filter queue</button></div><div className="audit-row audit-head"><span>APPLICANT</span><span>NIN MATCH</span><span>BVN STATUS</span><span>CURRENT STAGE</span><span>ACTION</span></div>{applications.map(([name, skill, score, bvn, stage]) => <div className="audit-row" key={name}><span><i>{name.split(" ").map((item) => item[0]).join("")}</i><b>{name}<small>{skill}</small></b></span><span><strong>{score}</strong></span><span><em>{bvn}</em></span><span>{stage}</span><span><button onClick={() => act(`${name} approved`)}>Approve</button><button onClick={() => act(`${name} moved to manual review`)}>Review</button></span></div>)}</section>
          <section className="provider-directory admin-panel"><div className="admin-panel-head"><div><h2>Partner profiles</h2><p>Live records from onboarding and service activity</p></div></div>{platform.providers.map((provider) => <div className="provider-row" key={provider.id}><span className="provider-avatar">{provider.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{provider.name}</strong><small>{provider.service} · {provider.city}</small></div><em className={provider.status}>{provider.status}</em><span><b>{provider.completedJobs}</b><small>completed</small></span><span><b>{platform.bookings.filter((booking) => booking.providerId === provider.id && booking.status !== "completed").length}</b><small>active</small></span><button onClick={() => setSelectedProvider(provider)}>View profile</button>{provider.status === "pending" && <><button className="approve-provider" onClick={() => { platform.approveProvider(provider.id); act(`${provider.name} approved and activated`); }}>Approve</button><button className="reject-provider" onClick={() => platform.rejectProvider(provider.id)}>Reject</button></>}</div>)}</section>
        </>}

        {view === "analytics" && <AdminAnalytics act={act} />}
        {view === "promotions" && <AdminPromotions act={act} />}

        {view === "finance" && <>
          <section className="finance-hero"><div><span>TOTAL GMV</span><strong>₦{totalGmv.toLocaleString()}</strong><small>{platform.payments.length} customer payments</small></div><div><span>PLATFORM REVENUE</span><strong>₦{Math.round(totalGmv * .15).toLocaleString()}</strong><small>15% commission</small></div><div><span>IN ESCROW</span><strong>₦{escrowTotal.toLocaleString()}</strong><small>{activeBookings.length} active bookings</small></div><div><span>RELEASED TO PARTNERS</span><strong>₦{Math.round(platform.payments.filter((payment) => payment.status === "released").reduce((sum, payment) => sum + payment.amount, 0) * .85).toLocaleString()}</strong><small>After completion PIN</small></div></section>
          <section className="finance-columns">
            <article className="admin-panel"><div className="admin-panel-head"><div><h2>Escrow ledger</h2><p>Live customer payments and completion status</p></div><b>{platform.payments.filter((payment) => payment.status === "escrow").length} held</b></div>{platform.bookings.map((booking) => { const payment = platform.payments.find((item) => item.bookingId === booking.id); return <div className="finance-row" key={booking.id}><span><strong>{booking.id}</strong><small>{booking.service} · {booking.customerName}</small></span><b>₦{booking.amount.toLocaleString()}</b><em className={payment?.status === "released" ? "verified" : ""}>{payment?.status === "released" ? "Released" : "In escrow"}</em><button onClick={() => act(booking.status === "completed" ? `${booking.id} was released by completion PIN` : `${booking.id} is still active`)}>{booking.status === "completed" ? "Verified" : "Track"}</button></div>; })}{platform.bookings.length === 0 && <div className="admin-empty">No customer payments yet.</div>}</article>
            <article className="admin-panel"><div className="admin-panel-head"><div><h2>Settlement queue</h2><p>Partner bank payouts</p></div><button onClick={() => act("Settlement batch approved")}>Approve batch</button></div>{[["GTBank", "₦21.4M", "184 partners"], ["Access Bank", "₦16.8M", "142 partners"], ["Kuda", "₦9.7M", "96 partners"], ["Moniepoint", "₦8.2M", "88 partners"]].map(([bank, amount, count]) => <div className="settlement-row" key={bank}><i>{bank[0]}</i><span><strong>{bank}</strong><small>{count}</small></span><b>{amount}</b></div>)}</article>
          </section>
          <section className="dispute-strip"><span>!</span><div><strong>7 open disputes · ₦286,500 at risk</strong><small>2 cases are approaching the 24-hour resolution SLA.</small></div><button onClick={() => act("Dispute console opened")}>Open dispute console →</button></section>
        </>}
      </main>
      {selectedProvider && <div className="admin-profile-backdrop" onMouseDown={() => setSelectedProvider(null)}><section className="admin-profile" onMouseDown={(event) => event.stopPropagation()}><button className="profile-close" onClick={() => setSelectedProvider(null)}>×</button><div className="profile-identity"><span>{selectedProvider.name.split(" ").map((part) => part[0]).join("")}</span><div><em>{selectedProvider.status}</em><h2>{selectedProvider.name}</h2><p>{selectedProvider.service} · {selectedProvider.city}</p></div></div><div className="profile-metrics"><span><small>SERVICES COMPLETED</small><strong>{selectedProvider.completedJobs}</strong></span><span><small>CURRENTLY RUNNING</small><strong>{platform.bookings.filter((booking) => booking.providerId === selectedProvider.id && booking.status !== "completed").length}</strong></span><span><small>RATING</small><strong>{selectedProvider.rating || "New"}</strong></span><span><small>TOTAL EARNED</small><strong>₦{Math.round(platform.bookings.filter((booking) => booking.providerId === selectedProvider.id && booking.status === "completed").reduce((sum, booking) => sum + booking.amount, 0) * .85).toLocaleString()}</strong></span></div><h3>Service history</h3><div className="profile-history">{platform.bookings.filter((booking) => booking.providerId === selectedProvider.id).map((booking) => <div key={booking.id}><span><strong>{booking.service}</strong><small>{booking.id} · {booking.customerName}</small></span><b>₦{booking.amount.toLocaleString()}</b><em>{booking.status.replace("_", " ")}</em></div>)}{!platform.bookings.some((booking) => booking.providerId === selectedProvider.id) && <p>No assigned services yet.</p>}</div></section></div>}
    </div>
  );
}
