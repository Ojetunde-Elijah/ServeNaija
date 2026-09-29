import { useState } from "react";

type AdminView = "operations" | "compliance" | "finance";

const applications = [
  ["Ibrahim Musa", "AC Specialist", "98%", "Verified", "Skills test"],
  ["Blessing Okafor", "Deep Cleaning", "94%", "Verified", "Guarantors"],
  ["Emeka Eze", "Electrician", "87%", "Review", "NIN / BVN"],
  ["Amina Bello", "Beauty Professional", "99%", "Verified", "Final audit"],
];

export default function SuperAdmin({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<AdminView>("operations");
  const [surge, setSurge] = useState<Record<string, boolean>>({ Lekki: true, Ikeja: false, Maitama: true });
  const [notice, setNotice] = useState("");
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
        </nav>
        <div className="admin-user"><span>AA</span><div><strong>Adaeze Admin</strong><small>Super Administrator</small></div></div>
        <button className="admin-logout" onClick={onLogout}>Sign out</button>
      </aside>
      <main className="admin-main">
        {notice && <div className="admin-toast">✓ {notice}</div>}
        <header className="admin-header"><div><span>Tuesday, 18 June · 10:24 AM</span><h1>{view === "operations" ? "Live Operations" : view === "compliance" ? "Artisan Compliance" : "Finance & Escrow"}</h1></div><div><button onClick={() => act("Operations data refreshed")}>↻ Refresh</button><button onClick={() => act("No critical incidents reported")}>Notifications <i /></button></div></header>

        {view === "operations" && <>
          <section className="admin-kpis">{[["Active bookings", "1,284", "+12.4%"], ["Artisans online", "642", "78% capacity"], ["Today’s GMV", "₦18.4M", "+8.2%"], ["Avg. response", "4m 18s", "−32 sec"]].map(([label, value, trend]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{trend}</small></article>)}</section>
          <section className="admin-grid">
            <article className="ops-map admin-panel"><div className="admin-panel-head"><div><h2>Lagos live demand</h2><p>Active jobs and service density</p></div><select><option>All services</option><option>AC servicing</option><option>Cleaning</option></select></div><div className="city-map"><span className="map-label lekki">Lekki <b>186</b></span><span className="map-label vi">Victoria Island <b>94</b></span><span className="map-label ikeja">Ikeja <b>142</b></span><span className="map-label yaba">Yaba <b>78</b></span><i className="heat heat-one" /><i className="heat heat-two" /><i className="heat heat-three" /></div></article>
            <article className="activity-feed admin-panel"><div className="admin-panel-head"><div><h2>Live activity</h2><p>Across all cities</p></div></div>{[["Booking completed", "Lekki · ₦18,500", "NOW"], ["New artisan online", "Ikeja · Electrical", "2M"], ["SOS check resolved", "Wuse 2 · SN-20372", "5M"], ["Escrow released", "VI · ₦32,000", "8M"]].map(([title, copy, time]) => <div className="activity-item" key={title}><i /><span><strong>{title}</strong><small>{copy}</small></span><b>{time}</b></div>)}</article>
          </section>
          <section className="surge-panel admin-panel"><div className="admin-panel-head"><div><h2>Demand and surge controls</h2><p>Adjust marketplace incentives by zone</p></div><button onClick={() => act("Surge configuration saved")}>Save changes</button></div><div className="surge-table">{Object.entries(surge).map(([zone, enabled]) => <div key={zone}><strong>{zone}</strong><span>{zone === "Lekki" ? "186" : zone === "Ikeja" ? "142" : "96"} active requests</span><b className={enabled ? "high" : ""}>{enabled ? "1.25× surge" : "Standard pricing"}</b><button className={enabled ? "toggle-switch on" : "toggle-switch"} onClick={() => setSurge((current) => ({ ...current, [zone]: !enabled }))}><i /></button></div>)}</div></section>
        </>}

        {view === "compliance" && <>
          <section className="pipeline">{["Application", "NIN / BVN", "Guarantors", "Skills test", "Approved"].map((stage, index) => <article key={stage}><span>{stage}</span><strong>{[28, 19, 14, 9, 146][index]}</strong><small>{index < 4 ? "awaiting review" : "this month"}</small></article>)}</section>
          <section className="audit-table admin-panel"><div className="admin-panel-head"><div><h2>Document audit queue</h2><p>12 applications require action</p></div><button onClick={() => act("Queue filters opened")}>Filter queue</button></div><div className="audit-row audit-head"><span>APPLICANT</span><span>NIN MATCH</span><span>BVN STATUS</span><span>CURRENT STAGE</span><span>ACTION</span></div>{applications.map(([name, skill, score, bvn, stage]) => <div className="audit-row" key={name}><span><i>{name.split(" ").map((item) => item[0]).join("")}</i><b>{name}<small>{skill}</small></b></span><span><strong>{score}</strong></span><span><em>{bvn}</em></span><span>{stage}</span><span><button onClick={() => act(`${name} approved`)}>Approve</button><button onClick={() => act(`${name} moved to manual review`)}>Review</button></span></div>)}</section>
        </>}

        {view === "finance" && <>
          <section className="finance-hero"><div><span>MONTHLY GMV</span><strong>₦284.6M</strong><small>↑ 14.8% from May</small></div><div><span>PLATFORM REVENUE</span><strong>₦42.69M</strong><small>15% blended commission</small></div><div><span>IN ESCROW</span><strong>₦18.24M</strong><small>1,284 active bookings</small></div><div><span>PAYOUTS DUE</span><strong>₦64.8M</strong><small>Friday settlement</small></div></section>
          <section className="finance-columns">
            <article className="admin-panel"><div className="admin-panel-head"><div><h2>Escrow release queue</h2><p>Completion verification required</p></div><b>5 pending</b></div>{[["SN-20481", "₦18,500", "PIN verified"], ["SN-20477", "₦32,000", "Awaiting PIN"], ["SN-20469", "₦14,000", "PIN verified"]].map(([id, amount, status]) => <div className="finance-row" key={id}><span><strong>{id}</strong><small>Service completed today</small></span><b>{amount}</b><em className={status === "PIN verified" ? "verified" : ""}>{status}</em><button onClick={() => act(`${id} escrow released`)} disabled={status !== "PIN verified"}>Release</button></div>)}</article>
            <article className="admin-panel"><div className="admin-panel-head"><div><h2>Settlement queue</h2><p>Partner bank payouts</p></div><button onClick={() => act("Settlement batch approved")}>Approve batch</button></div>{[["GTBank", "₦21.4M", "184 partners"], ["Access Bank", "₦16.8M", "142 partners"], ["Kuda", "₦9.7M", "96 partners"], ["Moniepoint", "₦8.2M", "88 partners"]].map(([bank, amount, count]) => <div className="settlement-row" key={bank}><i>{bank[0]}</i><span><strong>{bank}</strong><small>{count}</small></span><b>{amount}</b></div>)}</article>
          </section>
          <section className="dispute-strip"><span>!</span><div><strong>7 open disputes · ₦286,500 at risk</strong><small>2 cases are approaching the 24-hour resolution SLA.</small></div><button onClick={() => act("Dispute console opened")}>Open dispute console →</button></section>
        </>}
      </main>
    </div>
  );
}
