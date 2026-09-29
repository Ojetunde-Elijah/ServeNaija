import { useCallback, useEffect, useState, type ReactNode } from "react";
import AuthModal, { type Session, type UserRole } from "./AuthModal";
import Onboarding from "./Onboarding";
import SuperAdmin from "./SuperAdmin";

type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "dashboard"
  | "headphones"
  | "home"
  | "location"
  | "menu"
  | "search"
  | "shield"
  | "star"
  | "wallet";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  calendar: <><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1-1 2-2 2h-3"/><rect x="3" y="13" width="4" height="6" rx="2"/><rect x="17" y="13" width="4" height="6" rx="2"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  star: <path d="m12 2 3 6 6.5 1-4.75 4.6 1.1 6.4L12 17l-5.85 3 1.1-6.4L2.5 9 9 8Z"/>,
  wallet: <><path d="M3 6a3 3 0 0 1 3-3h12v4H6a3 3 0 0 0 0 6h15v8H6a3 3 0 0 1-3-3Z"/><path d="M3 6v12"/><path d="M17 13v-2h4v4h-4a2 2 0 0 1 0-4"/></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return <button disabled={disabled} onClick={onClick} className={`button button-${variant} ${className}`}>{children}</button>;
}

const services = [
  { icon: "❄", name: "AC servicing", price: "From ₦12,500", tint: "bg-sky-50 text-sky-700" },
  { icon: "◉", name: "Deep cleaning", price: "From ₦18,000", tint: "bg-amber-50 text-amber-700" },
  { icon: "ϟ", name: "Electrical", price: "From ₦7,500", tint: "bg-violet-50 text-violet-700" },
  { icon: "♒", name: "Plumbing", price: "From ₦8,000", tint: "bg-blue-50 text-blue-700" },
  { icon: "✦", name: "Beauty at home", price: "From ₦10,000", tint: "bg-rose-50 text-rose-700" },
];

const popular = [
  {
    title: "Complete AC care",
    subtitle: "Deep clean, gas check & filter service",
    price: "₦18,500",
    oldPrice: "₦22,000",
    rating: "4.9",
    reviews: "2.4k",
    image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=85",
  },
  {
    title: "Premium home deep clean",
    subtitle: "4 hours · 2 trained professionals",
    price: "₦32,000",
    oldPrice: "₦38,500",
    rating: "4.8",
    reviews: "1.8k",
    image: "https://images.unsplash.com/photo-1633119713175-c53c29479984?auto=format&fit=crop&w=800&q=85",
  },
  {
    title: "Electrical safety check",
    subtitle: "Full home inspection & minor fixes",
    price: "₦14,000",
    oldPrice: "₦16,500",
    rating: "4.9",
    reviews: "940",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=85",
  },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? "text-white" : "text-ink"}`}>
      <span className="logo-mark"><span /></span>
      <span>ServeNaija</span>
    </div>
  );
}

function ConsumerInfoPage({
  page,
  onBook,
}: {
  page: "how" | "safety" | "help" | "bookings";
  onBook: () => void;
}) {
  if (page === "how") {
    return (
      <main className="subpage">
        <div className="subpage-hero">
          <span className="kicker">SIMPLE, SAFE, RELIABLE</span>
          <h1>Home services without the usual stress.</h1>
          <p>From booking to payment, every step is designed around your safety and convenience.</p>
        </div>
        <div className="steps-grid content-width">
          {[
            ["01", "Choose a service", "Browse transparent packages, add-ons and verified customer reviews."],
            ["02", "Pick your time", "Choose a convenient slot and share access instructions securely."],
            ["03", "Meet your professional", "Track arrival live and verify their photo and ServeNaija badge."],
            ["04", "Release payment", "Share your completion PIN only when you are satisfied with the work."],
          ].map(([number, title, copy]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></article>)}
        </div>
        <div className="subpage-cta"><div><h2>Ready to get it sorted?</h2><p>A trusted professional could be with you today.</p></div><Button onClick={onBook}>Book a service <Icon name="arrow" size={17} /></Button></div>
      </main>
    );
  }

  if (page === "safety") {
    return (
      <main className="subpage safety-page">
        <div className="subpage-hero"><span className="kicker">SERVENAIJA SAFE</span><h1>Your safety is built into every booking.</h1><p>Protection before, during and after every service visit.</p></div>
        <div className="safety-layout content-width">
          <div className="safety-photo"><img src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=85" alt="Verified service professional" /><span><Icon name="shield" /> NIN verified professional</span></div>
          <div className="safety-list">
            {[
              ["Identity checks", "Every partner completes NIN, BVN, facial liveness and guarantor verification."],
              ["Background screening", "Police record and local residency checks are completed before activation."],
              ["Escrow payments", "Your payment stays protected until you confirm completion with your private PIN."],
              ["Live safety support", "Track arrival, share job details and reach our response team throughout the visit."],
            ].map(([title, copy]) => <article key={title}><span><Icon name="check" size={17} /></span><div><h2>{title}</h2><p>{copy}</p></div></article>)}
          </div>
        </div>
      </main>
    );
  }

  if (page === "help") {
    return (
      <main className="subpage help-page">
        <div className="subpage-hero"><span className="kicker">HELP CENTRE</span><h1>How can we help?</h1><p>Find quick answers or speak with our Nigerian support team.</p></div>
        <div className="help-grid content-width">
          {[
            ["Booking & rescheduling", "Change a service time, address or package."],
            ["Payments & refunds", "Escrow, transfers, USSD and refund timelines."],
            ["Safety & complaints", "Report a concern or open a service dispute."],
            ["Account support", "Manage your profile, addresses and phone number."],
          ].map(([title, copy]) => <button key={title} onClick={() => window.alert(`${title}: a support specialist is ready to help.`)}><span><Icon name="headphones" /></span><strong>{title}</strong><small>{copy}</small><Icon name="chevron" size={17} /></button>)}
        </div>
        <div className="support-banner content-width"><div><span>NEED MORE HELP?</span><h2>Talk to a real person, 24/7.</h2><p>Average response time is under two minutes.</p></div><Button onClick={() => window.open("https://wa.me/2347007378362", "_blank")}>Chat on WhatsApp</Button><Button variant="secondary" onClick={() => { window.location.href = "tel:+2347007378362"; }}>Call 0700-SERVE-NAIJA</Button></div>
      </main>
    );
  }

  return (
    <main className="subpage bookings-page">
      <div className="subpage-title content-width"><div><span className="kicker">MY ACCOUNT</span><h1>Your bookings</h1><p>Track active services and see your booking history.</p></div><Button onClick={onBook}>Book another service</Button></div>
      <div className="bookings-layout content-width">
        <article className="active-booking">
          <div className="active-booking-head"><span className="live-pill"><i /> PROFESSIONAL ON THE WAY</span><strong>Booking #SN-20481</strong></div>
          <div className="technician-row">
            <img src="https://images.unsplash.com/photo-1787672357797-f5fa35bb0d18?auto=format&fit=crop&w=180&q=80" alt="Ibrahim Musa" />
            <div><h2>Ibrahim Musa</h2><p><Icon name="star" size={14} /> 4.92 · Gold AC Specialist</p><span><Icon name="shield" size={14} /> NIN & police checked</span></div>
            <div className="eta"><small>ARRIVING IN</small><strong>24 min</strong></div>
          </div>
          <div className="tracking-map"><div className="map-road road-one" /><div className="map-road road-two" /><span className="map-home"><Icon name="home" size={16} /></span><span className="map-tech">IM</span><div className="map-route" /></div>
          <div className="booking-actions"><Button>Track live arrival</Button><Button variant="secondary">Call securely</Button><Button variant="ghost">Get help</Button></div>
        </article>
        <aside className="booking-summary"><span>UPCOMING SERVICE</span><h2>Complete AC care</h2><p>Today · 10:30 AM – 11:30 AM</p><div><span>Service total</span><strong>₦18,500</strong></div><div><span>Payment</span><strong>Escrow protected</strong></div><small><Icon name="location" size={14} /> Admiralty Way, Lekki Phase 1</small></aside>
      </div>
    </main>
  );
}

function BookingFlow({
  service,
  onClose,
  onComplete,
}: {
  service: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [slot, setSlot] = useState("Today · 2:00 – 4:00 PM");
  const [payment, setPayment] = useState("Card / Paystack");
  const [address, setAddress] = useState("14 Admiralty Way, Lekki Phase 1");
  const [servicePackage, setServicePackage] = useState("Standard");
  const [materials, setMaterials] = useState(false);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="booking-modal booking-flow" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="flow-progress">{[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "active" : ""}><i>{item < step ? <Icon name="check" size={11} /> : item}</i><small>{["Package", "Schedule", "Payment", "Done"][item - 1]}</small></span>)}</div>

        {step === 1 && <>
          <span className="kicker">STEP 1 OF 3</span><h2>Choose your package</h2><p>Select the right level of service for your home.</p>
          <div className="package-list">
            <button className={servicePackage === "Standard" ? "selected" : ""} onClick={() => setServicePackage("Standard")}><span><strong>Standard {service}</strong><small>Inspection, essential service and clean-up</small></span><b>₦12,500</b>{servicePackage === "Standard" && <Icon name="check" size={17} />}</button>
            <button className={servicePackage === "Complete care" ? "selected" : ""} onClick={() => setServicePackage("Complete care")}><span><strong>Complete care</strong><small>Full service, parts check and 30-day warranty</small></span><b>₦18,500</b>{servicePackage === "Complete care" && <Icon name="check" size={17} />}</button>
          </div>
          <div className="addon-row"><span><strong>Add service materials</strong><small>Professional-grade consumables</small></span><b>+ ₦3,000</b><input type="checkbox" checked={materials} onChange={(event) => setMaterials(event.target.checked)} /></div>
          <Button className="full-button" onClick={() => setStep(2)}>Choose date & address <Icon name="arrow" size={17} /></Button>
        </>}

        {step === 2 && <>
          <span className="kicker">STEP 2 OF 3</span><h2>When and where?</h2><p>Choose a verified availability window near you.</p>
          <label className="flow-label">SERVICE ADDRESS<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <div className="slot-grid">{["Today · 2:00 – 4:00 PM", "Today · 5:00 – 7:00 PM", "Tomorrow · 9:00 – 11:00 AM", "Tomorrow · 1:00 – 3:00 PM"].map((item) => <button className={slot === item ? "selected" : ""} onClick={() => setSlot(item)} key={item}>{item}<Icon name="check" size={15} /></button>)}</div>
          <label className="flow-label">ACCESS NOTE<textarea placeholder="Gate code, parking or directions for the professional" /></label>
          <div className="flow-actions"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)}>Review & pay <Icon name="arrow" size={17} /></Button></div>
        </>}

        {step === 3 && <>
          <span className="kicker">STEP 3 OF 3</span><h2>Safe payment</h2><p>Your money is held in escrow until you share your completion PIN.</p>
          <div className="payment-methods">{["Card / Paystack", "Bank transfer", "USSD"].map((item) => <button className={payment === item ? "selected" : ""} onClick={() => setPayment(item)} key={item}><span><Icon name="wallet" size={18} />{item}</span><i>{payment === item && <Icon name="check" size={13} />}</i></button>)}</div>
          <div className="order-summary"><div><span>{servicePackage} {service}</span><strong>{servicePackage === "Standard" ? "₦12,500" : "₦18,500"}</strong></div>{materials && <div><span>Service materials</span><strong>₦3,000</strong></div>}<div><span>Service protection fee</span><strong>₦750</strong></div><div className="total"><span>Total</span><strong>{servicePackage === "Standard" ? (materials ? "₦16,250" : "₦13,250") : (materials ? "₦22,250" : "₦19,250")}</strong></div><small>{slot}<br />{address}</small></div>
          <div className="flow-actions"><Button variant="secondary" onClick={() => setStep(2)}>Back</Button><Button onClick={() => setStep(4)}>Pay ₦13,250 securely</Button></div>
        </>}

        {step === 4 && <div className="success-state">
          <span className="success-icon"><Icon name="check" size={30} /></span><span className="kicker">BOOKING CONFIRMED</span><h2>We&apos;re finding your professional.</h2><p>Your payment is protected. We&apos;ll notify you as soon as a verified professional accepts.</p>
          <div className="confirmation-card"><span>BOOKING REFERENCE</span><strong>SN-20481</strong><small>{slot} · {address}</small></div>
          <Button className="full-button" onClick={onComplete}>Track my booking <Icon name="arrow" size={17} /></Button>
        </div>}
      </div>
    </div>
  );
}

function ConsumerPortal({
  onSwitch,
  isAuthenticated,
  onLogin,
  launchService,
  onLaunchConsumed,
}: {
  onSwitch: () => void;
  isAuthenticated: boolean;
  onLogin: (service?: string) => void;
  launchService: string | null;
  onLaunchConsumed: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [location, setLocation] = useState("Lekki Phase 1, Lagos");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState<"home" | "how" | "safety" | "help" | "bookings">("home");

  useEffect(() => {
    if (launchService && isAuthenticated) {
      setSelected(launchService);
      setPage("home");
      onLaunchConsumed();
    }
  }, [launchService, isAuthenticated, onLaunchConsumed]);

  const startBooking = (service: string) => {
    if (!isAuthenticated) return onLogin(service);
    setSelected(service);
  };

  const openBookings = () => {
    if (!isAuthenticated) return onLogin();
    setPage("bookings");
  };

  const confirm = () => {
    const stored = JSON.parse(localStorage.getItem("servenaija-bookings") || "[]");
    localStorage.setItem("servenaija-bookings", JSON.stringify([
      {
        id: "SN-20481",
        service: selected || "Home service",
        status: "Matching professional",
        createdAt: new Date().toISOString(),
        total: "₦13,250",
      },
      ...stored,
    ]));
    setSelected(null);
    setPage("bookings");
    setNotice("Booking confirmed. A verified professional will be assigned shortly.");
    window.setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="consumer-page">
      <header className="consumer-nav">
        <Logo />
        <nav className="consumer-links" aria-label="Main navigation">
          <button onClick={() => setPage("home")}>Services</button><button onClick={() => setPage("how")}>How it works</button><button onClick={() => setPage("safety")}>Safety</button><button onClick={() => setPage("help")}>Help</button>
        </nav>
        <div className="nav-actions">
          <Button variant="ghost" onClick={onSwitch}>Partner dashboard</Button>
          {isAuthenticated ? <Button variant="ghost" onClick={openBookings}>My bookings</Button> : <Button variant="ghost" onClick={() => onLogin()}>Sign in</Button>}
          <Button onClick={() => { setPage("home"); startBooking("home service"); }}>Book a service <Icon name="arrow" size={17} /></Button>
        </div>
        <button className="mobile-menu" aria-label="Open menu" onClick={() => setPage("help")}><Icon name="menu" /></button>
      </header>

      {notice && <div className="toast"><Icon name="check" size={18} />{notice}</div>}

      {page === "home" ? <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span />Trusted by 25,000+ Nigerian homes</div>
            <h1>Your home, handled with <em>care.</em></h1>
            <p>Book trusted, background-checked professionals for every home need. Upfront pricing, safe payments, no surprises.</p>
            <div className="finder">
              <label>
                <span>YOUR LOCATION</span>
                <span className="finder-field"><Icon name="location" size={19} /><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Lekki Phase 1, Lagos</option><option>Victoria Island, Lagos</option><option>Ikeja GRA, Lagos</option><option>Wuse 2, Abuja</option><option>Maitama, Abuja</option></select></span>
              </label>
              <div className="finder-divider" />
              <label className="service-search">
                <span>WHAT DO YOU NEED?</span>
                <span className="finder-field"><Icon name="search" size={19} /><input placeholder="Search for a service" /></span>
              </label>
              <Button className="find-button" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Find services</Button>
            </div>
            <div className="trust-row">
              <span><Icon name="shield" size={17} />Verified professionals</span>
              <span><Icon name="wallet" size={17} />Escrow protected</span>
              <span><Icon name="star" size={17} />4.9 average rating</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1739271933165-2725a7375391?auto=format&fit=crop&w=1100&q=88" alt="A professional ready to help with home services" />
            </div>
            <div className="verified-card">
              <span className="verified-icon"><Icon name="shield" size={22} /></span>
              <span><strong>100% verified</strong><small>NIN & background checked</small></span>
            </div>
            <div className="rating-card">
              <div className="avatar-stack"><span>AO</span><span>KI</span><span>BN</span></div>
              <div><strong>4.9 <span>★</span></strong><small>12,400+ happy customers</small></div>
            </div>
            <div className="hero-pattern" />
          </div>
        </section>

        <section className="services-section content-width" id="services">
          <div className="section-heading">
            <div><span className="kicker">SERVICES FOR EVERY HOME</span><h2>What can we help with?</h2></div>
            <button className="see-all" onClick={() => startBooking("home service")}>View all services <Icon name="arrow" size={18} /></button>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <button className="service-card" key={service.name} onClick={() => startBooking(service.name)}>
                <span className={`service-icon ${service.tint}`}>{service.icon}</span>
                <strong>{service.name}</strong><small>{service.price}</small>
                <span className="service-arrow"><Icon name="chevron" size={17} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="popular-section">
          <div className="content-width">
            <div className="section-heading">
              <div><span className="kicker">MOST BOOKED IN LEKKI</span><h2>Popular near you</h2></div>
              <span className="location-chip"><Icon name="location" size={15} /> Lekki Phase 1</span>
            </div>
            <div className="popular-grid">
              {popular.map((item) => (
                <article className="popular-card" key={item.title}>
                  <div className="popular-image"><img src={item.image} alt="" /><span>POPULAR</span></div>
                  <div className="popular-copy">
                    <div className="rating"><Icon name="star" size={14} /> {item.rating} <span>({item.reviews})</span></div>
                    <h3>{item.title}</h3><p>{item.subtitle}</p>
                    <div className="price-row"><span><strong>{item.price}</strong><del>{item.oldPrice}</del></span><Button variant="secondary" onClick={() => startBooking(item.title)}>Add</Button></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main> : <ConsumerInfoPage page={page} onBook={() => { setPage("home"); startBooking("home service"); }} />}

      {selected && <BookingFlow service={selected} onClose={() => setSelected(null)} onComplete={confirm} />}
    </div>
  );
}

const jobs = [
  { time: "10:30 AM", title: "AC servicing", customer: "Chidinma Okeke", place: "Admiralty Way, Lekki", price: "₦15,725", status: "In 24 mins", tone: "soon" },
  { time: "2:00 PM", title: "Electrical repairs", customer: "Tunde Adebayo", place: "Osapa London, Lekki", price: "₦9,775", status: "Confirmed", tone: "confirmed" },
  { time: "5:30 PM", title: "AC servicing", customer: "Amaka Nwosu", place: "Oniru, Victoria Island", price: "₦18,700", status: "Confirmed", tone: "confirmed" },
];

function ArtisanSection({
  section,
  onWithdraw,
  onJob,
}: {
  section: string;
  onWithdraw: () => void;
  onJob: (title: string) => void;
}) {
  const [jobTab, setJobTab] = useState("Upcoming");
  if (section === "My jobs") {
    return (
      <section className="artisan-view">
        <div className="view-heading"><div><span className="kicker">WORK SCHEDULE</span><h2>My jobs</h2><p>Manage upcoming jobs and review completed services.</p></div><Button onClick={() => onJob("Availability")}>Open availability</Button></div>
        <div className="view-tabs">{["Upcoming", "Completed", "Cancelled"].map((tab) => <button key={tab} className={jobTab === tab ? "active" : ""} onClick={() => setJobTab(tab)}>{tab}{tab === "Upcoming" && <span>3</span>}</button>)}</div>
        <div className="jobs-board">
          {jobTab === "Upcoming" ? jobs.map((job, index) => <article key={job.time}>
            <div className="job-date"><span>{index === 0 ? "TODAY" : "TUE"}</span><strong>{18 + index}</strong><small>JUN</small></div>
            <div className="job-card-main"><span className={`status ${job.tone}`}>{job.status}</span><h3>{job.title}</h3><p>{job.time} · 60 mins</p><small><Icon name="location" size={14} /> {job.place}</small></div>
            <div className="customer-cell"><span>Customer</span><strong>{job.customer}</strong><small>★★★★★ · Verified</small></div>
            <div className="earning-cell"><span>YOUR EARNING</span><strong>{job.price}</strong></div>
            <Button variant={index === 0 ? "primary" : "secondary"} onClick={() => onJob(job.title)}>{index === 0 ? "Start journey" : "View details"}</Button>
          </article>) : <div className="empty-state"><Icon name={jobTab === "Completed" ? "check" : "calendar"} size={28} /><h3>No {jobTab.toLowerCase()} jobs to show</h3><p>Your job history will appear here.</p></div>}
        </div>
      </section>
    );
  }

  if (section === "Earnings") {
    return (
      <section className="artisan-view">
        <div className="view-heading"><div><span className="kicker">WALLET & PAYOUTS</span><h2>Your earnings</h2><p>Track every payment, commission and settlement.</p></div><Button onClick={onWithdraw}>Withdraw funds <Icon name="arrow" size={16} /></Button></div>
        <div className="wallet-hero">
          <div><span>AVAILABLE TO WITHDRAW</span><strong>₦84,250</strong><small>Next automatic payout: Friday, 21 June</small></div>
          <div><span>THIS MONTH</span><strong>₦412,680</strong><small>24 completed jobs</small></div>
          <div><span>PLATFORM COMMISSION</span><strong>₦72,825</strong><small>15% standard partner rate</small></div>
        </div>
        <div className="ledger panel">
          <div className="panel-heading"><div><h2>Recent transactions</h2><p>All amounts reflect your 85% partner share</p></div><button onClick={() => window.alert("Your earnings statement is being prepared for download.")}>Download statement</button></div>
          {[
            ["AC servicing · Chidinma Okeke", "Today, 11:34 AM", "+ ₦15,725", "Completed"],
            ["Electrical repairs · Tunde Adebayo", "17 Jun, 3:04 PM", "+ ₦9,775", "Completed"],
            ["Weekly settlement · GTBank •• 4812", "14 Jun, 6:10 AM", "− ₦96,400", "Paid out"],
            ["AC installation · Bolaji Akinola", "13 Jun, 4:20 PM", "+ ₦42,500", "Completed"],
          ].map(([title, date, amount, status]) => <div className="ledger-row" key={title}><span className="ledger-icon"><Icon name={amount.startsWith("+") ? "arrow" : "wallet"} size={16} /></span><div><strong>{title}</strong><small>{date}</small></div><b className={amount.startsWith("+") ? "credit" : ""}>{amount}</b><span className="ledger-status">{status}</span></div>)}
        </div>
      </section>
    );
  }

  if (section === "Performance") {
    return (
      <section className="artisan-view">
        <div className="view-heading"><div><span className="kicker">PARTNER QUALITY</span><h2>Performance</h2><p>Your service quality and path to Platinum.</p></div><span className="period-chip">JUNE 2025</span></div>
        <div className="score-hero">
          <div className="score-ring"><strong>92</strong><small>OVERALL</small></div>
          <div><span>GOLD PARTNER</span><h2>Excellent work, Ibrahim.</h2><p>You&apos;re performing better than 92% of AC specialists in Lagos.</p></div>
          <div className="score-goal"><span>NEXT TIER</span><strong>Platinum</strong><small>₦73,150 more GMV needed</small></div>
        </div>
        <div className="metric-grid">
          {[["Customer rating", "4.92 / 5", "Excellent", 98], ["Acceptance rate", "94%", "Target: 90%", 94], ["On-time arrival", "89%", "Improve by 6%", 89], ["Repeat customers", "34%", "Top 10%", 82]].map(([name, value, note, score]) => <article key={name as string}><span>{name}</span><strong>{value}</strong><small>{note}</small><div><i style={{ width: `${score}%` }} /></div></article>)}
        </div>
        <div className="feedback-panel panel"><div className="panel-heading"><div><h2>Recent customer feedback</h2><p>What customers appreciate about your work</p></div></div><blockquote>“Ibrahim arrived early, explained the fault clearly and left the work area spotless. Excellent service.”<footer>— Chidinma O. · AC servicing · Yesterday</footer></blockquote></div>
      </section>
    );
  }

  return (
    <section className="artisan-view">
      <div className="view-heading"><div><span className="kicker">SERVENAIJA ACADEMY</span><h2>Training centre</h2><p>Build your skills, unlock badges and qualify for better jobs.</p></div><span className="certificate-count"><Icon name="shield" /> 4 certificates earned</span></div>
      <div className="featured-course">
        <div><span>RECOMMENDED FOR YOU</span><h2>Advanced inverter AC diagnostics</h2><p>Learn fault-code analysis, board testing and safe repair workflows from senior technicians.</p><div><small>6 lessons</small><small>45 minutes</small><small>Certificate included</small></div><Button>Continue learning <Icon name="arrow" size={17} /></Button></div>
        <div className="course-progress-ring"><strong>65%</strong><small>COMPLETE</small></div>
      </div>
      <div className="course-grid">
        {[["Customer safety & conduct", "Completed", "shield"], ["Escrow and completion PINs", "Completed", "wallet"], ["Premium customer experience", "3 of 5 lessons", "star"], ["Using the partner toolkit", "Not started", "dashboard"]].map(([title, status, icon], index) => <article key={title}><span className={`course-icon tone-${index}`}><Icon name={icon as IconName} /></span><div><h3>{title}</h3><p>{status}</p></div><button onClick={() => onJob(title)}>{index < 2 ? <Icon name="check" size={17} /> : <Icon name="chevron" size={17} />}</button></article>)}
      </div>
    </section>
  );
}

function ActionDialog({
  type,
  onClose,
}: {
  type: "withdraw" | "support" | "job" | "benefits";
  onClose: () => void;
}) {
  const [done, setDone] = useState(false);
  const content = {
    withdraw: ["Withdraw earnings", "Send your available balance to your verified bank account."],
    support: ["Partner support", "Tell us what you need help with. Our partner team is available 24/7."],
    job: ["Job details", "Review the customer, route and safety checklist before starting your journey."],
    benefits: ["Platinum benefits", "Unlock lower commission, priority leads and free quarterly tool servicing."],
  }[type];
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="booking-modal action-dialog" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><Icon name="close" /></button>
    {done ? <div className="success-state"><span className="success-icon"><Icon name="check" size={28} /></span><h2>Request received</h2><p>{type === "withdraw" ? "₦84,250 will arrive in your GTBank account within minutes." : "We&apos;ve saved your request and will keep you updated."}</p><Button className="full-button" onClick={onClose}>Done</Button></div> : <>
      <div className="modal-icon"><Icon name={type === "withdraw" ? "wallet" : type === "job" ? "location" : "headphones"} /></div><h2>{content[0]}</h2><p>{content[1]}</p>
      {type === "withdraw" && <><div className="dialog-balance"><span>AVAILABLE BALANCE</span><strong>₦84,250</strong></div><label className="flow-label">BANK ACCOUNT<select><option>GTBank · 0123••4812</option><option>Kuda Bank · 2001••7734</option></select></label><label className="flow-label">AMOUNT<input defaultValue="₦84,250" /></label></>}
      {type === "support" && <><div className="support-options"><button>Job or customer issue</button><button>Payment or payout</button><button>Account and compliance</button></div><label className="flow-label">MESSAGE<textarea placeholder="Tell us what happened..." /></label></>}
      {type === "job" && <div className="job-dialog-details"><div><span>CUSTOMER</span><strong>Chidinma Okeke</strong></div><div><span>ADDRESS</span><strong>14 Admiralty Way, Lekki</strong></div><div><span>JOB</span><strong>Complete AC servicing</strong></div><div><span>CONTACT</span><strong>Call via secure proxy</strong></div></div>}
      {type === "benefits" && <div className="benefit-list">{["12% platform commission", "Priority access to premium leads", "Quarterly tool maintenance", "Exclusive Platinum badge"].map((item) => <span key={item}><Icon name="check" size={15} />{item}</span>)}</div>}
      <Button className="full-button" onClick={() => setDone(true)}>{type === "withdraw" ? "Confirm withdrawal" : type === "job" ? "Start secure journey" : type === "support" ? "Send to support" : "Set as my goal"} <Icon name="arrow" size={17} /></Button>
    </>}
  </div></div>;
}

function ArtisanDashboard({ onSwitch }: { onSwitch: () => void }) {
  const [online, setOnline] = useState(true);
  const [request, setRequest] = useState(true);
  const [activeNav, setActiveNav] = useState("Overview");
  const [period, setPeriod] = useState("This week");
  const [dialog, setDialog] = useState<"withdraw" | "support" | "job" | "benefits" | null>(null);

  const sideItems: [string, IconName][] = [["Overview", "dashboard"], ["My jobs", "calendar"], ["Earnings", "wallet"], ["Performance", "star"], ["Training", "shield"]];

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <Logo light />
        <div className="partner-label">PARTNER PORTAL</div>
        <nav>
          {sideItems.map(([label, icon]) => <button key={label} className={activeNav === label ? "active" : ""} onClick={() => setActiveNav(label)}><Icon name={icon} size={19} />{label}{label === "My jobs" && <span className="nav-count">3</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setDialog("support")}><Icon name="headphones" size={19} />Support</button>
          <button onClick={onSwitch}><Icon name="home" size={19} />Customer portal</button>
          <div className="profile-mini">
            <img src="https://images.unsplash.com/photo-1787672357797-f5fa35bb0d18?auto=format&fit=crop&w=180&q=80" alt="Ibrahim Musa" />
            <span><strong>Ibrahim Musa</strong><small>AC Specialist · Gold</small></span>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div><button className="dash-mobile-menu"><Icon name="menu" /></button><span>Tuesday, 18 June</span><h1>Good morning, Ibrahim.</h1><p>Here&apos;s what&apos;s happening with your business today.</p></div>
          <div className="dashboard-actions">
            <button className="notification-button" onClick={() => setActiveNav("My jobs")}><Icon name="bell" /><span /></button>
            <div className="online-control"><span><i className={online ? "on" : ""} />{online ? "Online" : "Offline"}</span><button onClick={() => setOnline(!online)} className={online ? "toggle on" : "toggle"}><i /></button></div>
          </div>
        </header>

        {activeNav === "Overview" ? <>
        {request && (
          <section className="job-request">
            <div className="pulse-wrap"><span className="pulse-dot" /></div>
            <div className="request-copy"><span>NEW JOB REQUEST · 01:42</span><h2>AC repair in Lekki Phase 1</h2><p><Icon name="location" size={15} /> 2.4 km away · 15 min drive</p></div>
            <div className="request-meta"><span>YOU&apos;LL EARN</span><strong>₦12,750</strong><small>after 15% commission</small></div>
            <Button variant="secondary" onClick={() => setRequest(false)}>Decline</Button>
            <Button onClick={() => setRequest(false)}>Accept job <Icon name="arrow" size={17} /></Button>
          </section>
        )}

        <section className="stat-grid">
          <article className="stat-card">
            <div className="stat-icon green"><Icon name="wallet" /></div><span>Today&apos;s earnings</span><strong>₦28,475</strong><small className="positive">↑ 18% <i>from yesterday</i></small>
            <div className="sparkline"><span /><span /><span /><span /><span /><span /><span /></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon blue"><Icon name="calendar" /></div><span>Jobs today</span><strong>3 <i>/ 5 target</i></strong><small>2 completed · 1 upcoming</small>
            <div className="progress"><span style={{ width: "60%" }} /></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon yellow"><Icon name="star" /></div><span>Your rating</span><strong>4.92 <i>/ 5.0</i></strong><small><b>Gold partner</b> · Top 8%</small>
            <div className="rating-dots"><span /><span /><span /><span /><span className="half" /></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon violet"><Icon name="clock" /></div><span>Acceptance rate</span><strong>94%</strong><small className="positive">↑ 3% <i>this month</i></small>
            <svg className="mini-chart" viewBox="0 0 120 38"><path d="M2 34c15-2 18-14 32-12s18 8 30 1 17-18 27-13 16-2 27-7" /></svg>
          </article>
        </section>

        <section className="dashboard-columns">
          <div className="schedule-panel panel">
            <div className="panel-heading"><div><h2>Today&apos;s schedule</h2><p>3 jobs · ₦44,200 potential earnings</p></div><button onClick={() => setActiveNav("My jobs")}>View calendar <Icon name="arrow" size={16} /></button></div>
            <div className="job-list">
              {jobs.map((job, index) => (
                <article className="job-row" key={job.time}>
                  <div className="job-time"><strong>{job.time}</strong><small>{index === 0 ? "11:30 AM" : index === 1 ? "3:00 PM" : "6:30 PM"}</small></div>
                  <div className={`timeline-mark ${index === 0 ? "current" : ""}`}><span /></div>
                  <div className="job-info"><div><span className={`status ${job.tone}`}>{job.status}</span><h3>{job.title}</h3></div><p>{job.customer} · <Icon name="location" size={13} /> {job.place}</p></div>
                  <strong className="job-price">{job.price}<small>Your earnings</small></strong>
                  <button className="more-button" onClick={() => setDialog("job")}>•••</button>
                </article>
              ))}
            </div>
          </div>

          <div className="earnings-panel panel">
            <div className="panel-heading"><div><h2>Earnings</h2><p>Your income overview</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This week</option><option>This month</option></select></div>
            <strong className="earnings-total">₦126,850</strong><span className="earnings-change">↑ 12.5% vs last week</span>
            <div className="bar-chart">
              {[42, 66, 54, 82, 70, 96, 58].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} className={index === 5 ? "peak" : ""} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}
            </div>
            <div className="wallet-strip"><span><Icon name="wallet" size={18} /><i><small>Available balance</small><strong>₦84,250</strong></i></span><Button variant="dark" onClick={() => setDialog("withdraw")}>Withdraw</Button></div>
          </div>
        </section>

        <section className="performance-strip">
          <div className="tier-badge"><Icon name="star" size={20} /><span>GOLD</span></div>
          <div className="tier-copy"><h3>You&apos;re ₦73,150 away from Platinum</h3><p>Complete more jobs this month to unlock 12% commission and priority leads.</p></div>
          <div className="tier-progress"><div><span /><i /></div><small>₦126,850 of ₦200,000</small></div>
          <Button variant="secondary" onClick={() => setDialog("benefits")}>View benefits <Icon name="arrow" size={16} /></Button>
        </section>
        </> : <ArtisanSection section={activeNav} onWithdraw={() => setDialog("withdraw")} onJob={() => setDialog("job")} />}
      </main>
      {dialog && <ActionDialog type={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}

type Portal = "consumer" | "artisan" | "admin" | "onboarding";

export default function App() {
  const [portal, setPortal] = useState<Portal>("consumer");
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem("servenaija-session");
    return saved ? JSON.parse(saved) : null;
  });
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [pendingService, setPendingService] = useState<string | null>(null);
  const [launchService, setLaunchService] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(() => Number(localStorage.getItem("servenaija-onboarding-step") || 0));

  const requestLogin = (role: UserRole, service?: string) => {
    setAuthRole(role);
    setPendingService(service || null);
  };

  const login = (nextSession: Session) => {
    localStorage.setItem("servenaija-session", JSON.stringify(nextSession));
    setSession(nextSession);
    setAuthRole(null);
    if (nextSession.role === "admin") setPortal("admin");
    else if (nextSession.role === "artisan") setPortal(onboardingStep >= 9 ? "artisan" : "onboarding");
    else {
      setPortal("consumer");
      if (pendingService) setLaunchService(pendingService);
    }
    setPendingService(null);
  };

  const logout = () => {
    localStorage.removeItem("servenaija-session");
    setSession(null);
    setPortal("consumer");
  };

  const openPartner = () => {
    if (!session || session.role !== "artisan") return requestLogin("artisan");
    setPortal(onboardingStep >= 9 ? "artisan" : "onboarding");
  };

  const saveOnboarding = useCallback((step: number) => {
    localStorage.setItem("servenaija-onboarding-step", String(step));
    setOnboardingStep(step);
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem("servenaija-onboarding-step", "9");
    setOnboardingStep(9);
    setPortal("artisan");
  };

  return (
    <>
      {portal === "consumer" && <ConsumerPortal onSwitch={openPartner} isAuthenticated={session?.role === "consumer"} onLogin={(service) => requestLogin("consumer", service)} launchService={launchService} onLaunchConsumed={() => setLaunchService(null)} />}
      {portal === "artisan" && <ArtisanDashboard onSwitch={() => setPortal("consumer")} />}
      {portal === "onboarding" && <Onboarding initialStep={onboardingStep} onSave={saveOnboarding} onComplete={finishOnboarding} onExit={() => setPortal("consumer")} />}
      {portal === "admin" && <SuperAdmin onLogout={logout} />}
      {authRole && <AuthModal initialRole={authRole} onClose={() => { setAuthRole(null); setPendingService(null); }} onLogin={login} />}
    </>
  );
}
