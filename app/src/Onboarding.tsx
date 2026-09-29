import { useEffect, useState } from "react";

const stages = ["Welcome", "Personal details", "NIN verification", "BVN verification", "Selfie check", "Guarantors", "Skills audit", "Background check", "Review"];

type OnboardingData = {
  fullName: string;
  phone: string;
  city: string;
  lga: string;
  category: string;
  nin: string;
  bvn: string;
  bank: string;
  experience: string;
  guarantorOne: string;
  guarantorTwo: string;
  assessment: string;
  consent: boolean;
};

const initialData: OnboardingData = {
  fullName: "Ibrahim Musa",
  phone: "0801 234 5678",
  city: "Lagos",
  lga: "Lekki",
  category: "AC repair & servicing",
  nin: "",
  bvn: "",
  bank: "GTBank",
  experience: "3–5 years",
  guarantorOne: "",
  guarantorTwo: "",
  assessment: "Lagos Hub · Tuesday, 10:00 AM",
  consent: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="onboard-field"><span>{label}</span>{children}</label>;
}

export default function Onboarding({
  initialStep,
  onSave,
  onComplete,
  onExit,
  storageKey,
}: {
  initialStep: number;
  onSave: (step: number) => void;
  onComplete: () => void;
  onExit: () => void;
  storageKey: string;
}) {
  const [step, setStep] = useState(Math.min(initialStep, 8));
  const [data, setData] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem(`servenaija-onboarding-data-${storageKey}`);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  });
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(`servenaija-onboarding-data-${storageKey}`, JSON.stringify(data));
    onSave(step);
  }, [data, step, onSave]);

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => setData((current) => ({ ...current, [key]: value }));
  const next = () => {
    if (step === 2 && data.nin.replace(/\D/g, "").length !== 11) return setError("Your NIN must contain exactly 11 digits.");
    if (step === 3 && data.bvn.replace(/\D/g, "").length !== 11) return setError("Your BVN must contain exactly 11 digits.");
    if (step === 5 && (!data.guarantorOne || !data.guarantorTwo)) return setError("Add both guarantors before continuing.");
    if (step === 7 && !data.consent) return setError("Please provide consent to complete the compliance checks.");
    setError("");
    setVerified(false);
    setStep((current) => Math.min(8, current + 1));
  };

  const content = [
    <div className="onboard-welcome" key="welcome"><span className="welcome-badge">VERIFIED PARTNERS EARN MORE</span><h1>Build your business with ServeNaija.</h1><p>Access quality jobs, protected payments, training and weekly payouts across Lagos and Abuja.</p><div className="earnings-callout"><span>TOP PARTNERS EARN</span><strong>₦450,000+</strong><small>per month on average</small></div><button className="onboard-primary" onClick={next}>Start verification →</button></div>,
    <div key="details"><span className="onboard-kicker">ABOUT YOU</span><h1>Tell us about yourself.</h1><p>Use the same details shown on your government identification.</p><div className="onboard-form two-columns"><Field label="FULL LEGAL NAME"><input value={data.fullName} onChange={(e) => update("fullName", e.target.value)} /></Field><Field label="PHONE NUMBER"><input value={data.phone} onChange={(e) => update("phone", e.target.value)} /></Field><Field label="CITY"><select value={data.city} onChange={(e) => update("city", e.target.value)}><option>Lagos</option><option>Abuja</option></select></Field><Field label="LGA / SERVICE AREA"><select value={data.lga} onChange={(e) => update("lga", e.target.value)}><option>Lekki</option><option>Ikeja</option><option>Victoria Island</option><option>Yaba</option><option>Maitama</option><option>Wuse 2</option></select></Field><Field label="PRIMARY SERVICE"><select value={data.category} onChange={(e) => update("category", e.target.value)}><option>AC repair & servicing</option><option>Plumbing</option><option>Electrical repairs</option><option>Deep cleaning</option><option>Beauty & grooming</option></select></Field></div></div>,
    <div key="nin"><span className="onboard-kicker">IDENTITY VERIFICATION</span><h1>Verify your NIN.</h1><p>We connect securely to NIMC to confirm your identity in real time.</p><div className="verify-panel"><span className="verify-logo">NIMC</span><Field label="11-DIGIT NATIONAL IDENTITY NUMBER"><input maxLength={11} value={data.nin} onChange={(e) => update("nin", e.target.value.replace(/\D/g, ""))} placeholder="000 000 000 00" /></Field><button onClick={() => data.nin.length === 11 ? setVerified(true) : setError("Enter all 11 NIN digits first.")}>{verified ? "✓ Identity matched" : "Verify with NIMC"}</button></div><small className="privacy-note">Your identity data is encrypted and used only for compliance verification.</small></div>,
    <div key="bvn"><span className="onboard-kicker">FINANCIAL IDENTITY</span><h1>Connect your BVN.</h1><p>Your BVN confirms your banking identity and payout ownership.</p><div className="onboard-form"><Field label="11-DIGIT BVN"><input maxLength={11} value={data.bvn} onChange={(e) => update("bvn", e.target.value.replace(/\D/g, ""))} placeholder="Enter BVN" /></Field><Field label="PREFERRED PAYOUT BANK"><select value={data.bank} onChange={(e) => update("bank", e.target.value)}><option>GTBank</option><option>Access Bank</option><option>Zenith Bank</option><option>Kuda</option><option>Moniepoint</option></select></Field></div><div className="info-strip">ServeNaija cannot access or debit your bank account.</div></div>,
    <div key="selfie"><span className="onboard-kicker">LIVENESS CHECK</span><h1>Let&apos;s confirm it&apos;s you.</h1><p>Position your face inside the frame and follow the prompts.</p><div className="camera-frame"><div className="face-outline" /><span>{verified ? "✓ Liveness confirmed" : "Camera preview"}</span></div><div className="liveness-steps"><span className="active">1 Face forward</span><span>2 Turn left</span><span>3 Smile</span></div><button className="onboard-secondary" onClick={() => setVerified(true)}>{verified ? "Check complete" : "Start camera check"}</button></div>,
    <div key="guarantors"><span className="onboard-kicker">TRUST & SAFETY</span><h1>Add two guarantors.</h1><p>Each guarantor must be over 25 and have a valid Nigerian NIN.</p><div className="guarantor-grid"><article><span>GUARANTOR 01</span><Field label="FULL NAME"><input value={data.guarantorOne} onChange={(e) => update("guarantorOne", e.target.value)} placeholder="Enter full name" /></Field><Field label="RELATIONSHIP"><select><option>Employer</option><option>Community leader</option><option>Family member</option></select></Field><Field label="NIN"><input placeholder="11-digit NIN" /></Field></article><article><span>GUARANTOR 02</span><Field label="FULL NAME"><input value={data.guarantorTwo} onChange={(e) => update("guarantorTwo", e.target.value)} placeholder="Enter full name" /></Field><Field label="RELATIONSHIP"><select><option>Employer</option><option>Community leader</option><option>Family member</option></select></Field><Field label="NIN"><input placeholder="11-digit NIN" /></Field></article></div></div>,
    <div key="skills"><span className="onboard-kicker">SKILL ASSESSMENT</span><h1>Show us your experience.</h1><p>Upload any certificates and schedule a practical assessment.</p><div className="onboard-form"><Field label="YEARS OF EXPERIENCE"><select value={data.experience} onChange={(e) => update("experience", e.target.value)}><option>Less than 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6+ years</option></select></Field><Field label="PRACTICAL ASSESSMENT"><select value={data.assessment} onChange={(e) => update("assessment", e.target.value)}><option>Lagos Hub · Tuesday, 10:00 AM</option><option>Lagos Hub · Thursday, 2:00 PM</option><option>Abuja Hub · Wednesday, 11:00 AM</option></select></Field><label className="upload-zone"><input type="file" /><strong>Upload trade certificate</strong><small>PDF, JPG or PNG · Maximum 5MB</small></label></div></div>,
    <div key="background"><span className="onboard-kicker">FINAL COMPLIANCE</span><h1>Complete your background check.</h1><p>These checks protect customers, partners and the ServeNaija community.</p><div className="check-list"><label><input type="checkbox" /> LASRRA or local resident ID uploaded <button>Upload</button></label><label><input type="checkbox" checked={data.consent} onChange={(e) => update("consent", e.target.checked)} /> I consent to criminal record and address checks</label><label><input type="checkbox" /> I accept the partner terms and 85/15 commission split</label></div><div className="info-strip">Background checks usually complete within 24–48 hours.</div></div>,
    <div className="review-state" key="review"><span className="review-icon">✓</span><span className="onboard-kicker">READY TO SUBMIT</span><h1>Your application is complete.</h1><p>Review your information and submit it to the ServeNaija compliance team.</p><div className="review-grid"><span><small>APPLICANT</small><strong>{data.fullName}</strong></span><span><small>SERVICE</small><strong>{data.category}</strong></span><span><small>LOCATION</small><strong>{data.lga}, {data.city}</strong></span><span><small>ASSESSMENT</small><strong>{data.assessment}</strong></span></div><button className="onboard-primary" onClick={onComplete}>Submit application →</button></div>,
  ][step];

  return (
    <div className="onboarding-page">
      <aside className="onboarding-sidebar">
        <button className="onboard-logo" onClick={onExit}><span>S</span>ServeNaija</button>
        <small>PARTNER ONBOARDING</small>
        <div className="stage-list">{stages.map((stage, index) => <button key={stage} className={`${index === step ? "active" : ""} ${index < step ? "done" : ""}`} onClick={() => index <= step && setStep(index)}><i>{index < step ? "✓" : index + 1}</i><span>{stage}</span></button>)}</div>
        <div className="onboard-support"><strong>Need help?</strong><p>Chat with our onboarding team.</p><button onClick={() => window.open("https://wa.me/2347007378362", "_blank")}>WhatsApp support</button></div>
      </aside>
      <main className="onboarding-main">
        <header><span>Step {step + 1} of 9</span><button onClick={onExit}>Save & exit</button></header>
        <div className="onboarding-content">{content}{error && <div className="onboard-error">{error}</div>}{step > 0 && step < 8 && <div className="onboard-actions"><button onClick={() => setStep(step - 1)}>← Back</button><button className="onboard-primary" onClick={next}>Save & continue →</button></div>}</div>
      </main>
    </div>
  );
}
