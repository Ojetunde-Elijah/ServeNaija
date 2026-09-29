import { useState } from "react";

export type UserRole = "consumer" | "artisan" | "admin";

export type Session = {
  name: string;
  phone: string;
  role: UserRole;
};

export default function AuthModal({
  initialRole,
  onClose,
  onLogin,
}: {
  initialRole: UserRole;
  onClose: () => void;
  onLogin: (session: Session) => void;
}) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || password.length < 4) {
      setError("Enter a valid Nigerian phone number and at least 4 characters.");
      return;
    }
    onLogin({
      name: role === "admin" ? "Adaeze Admin" : role === "artisan" ? "Ibrahim Musa" : "Chidinma Okeke",
      phone: cleanPhone,
      role,
    });
  };

  return (
    <div className="auth-backdrop" onMouseDown={onClose}>
      <section className="auth-card" onMouseDown={(event) => event.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close login">×</button>
        <div className="auth-brand"><span className="auth-brand-mark">S</span><strong>ServeNaija</strong></div>
        <span className="auth-kicker">SECURE ACCESS</span>
        <h1>Welcome back.</h1>
        <p>Sign in to continue safely to your ServeNaija account.</p>
        <div className="role-switch">
          {(["consumer", "artisan", "admin"] as UserRole[]).map((item) => (
            <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>
              {item === "consumer" ? "Customer" : item === "artisan" ? "Partner" : "Admin"}
            </button>
          ))}
        </div>
        <label className="auth-label">
          PHONE NUMBER
          <span><b>+234</b><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="801 234 5678" inputMode="numeric" /></span>
        </label>
        <label className="auth-label">
          PASSWORD
          <span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" onKeyDown={(event) => event.key === "Enter" && submit()} /></span>
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-submit" onClick={submit}>Sign in securely <span>→</span></button>
        <button className="auth-register" onClick={() => setRole("artisan")}>{role === "artisan" ? "New partner? Start your application" : "Create a new ServeNaija account"}</button>
        <div className="auth-trust"><span>✓</span> Protected with bank-grade encryption</div>
      </section>
    </div>
  );
}
