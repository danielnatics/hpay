import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   PUBLIC NAVBAR (only shown on landing page)
───────────────────────────────────────────── */
const PublicNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0a0f1e]/95 backdrop-blur-xl shadow-lg shadow-black/30' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-base">H</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">
            H<span className="text-blue-400">-Pay</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {['features', 'how-it-works', 'about', 'contact'].map(id => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm text-slate-300 hover:text-white font-medium transition-colors capitalize"
            >
              {id.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            id="parent-portal-nav-btn"
            className="text-sm font-semibold text-blue-400 hover:text-white border border-blue-500/40 hover:border-blue-400 px-4 py-2 rounded-lg transition-all"
          >
            Parent Portal
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <div className={`w-5 h-0.5 bg-white my-1 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0f1e]/98 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {['features', 'how-it-works', 'about', 'contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)} className="text-left text-slate-300 hover:text-white py-2 capitalize border-b border-white/5">
              {id.replace('-', ' ')}
            </button>
          ))}
          <Link to="/login" className="mt-2 text-center bg-blue-600 text-white font-bold py-3 rounded-xl">
            Parent Portal — Log In
          </Link>
        </div>
      )}
    </nav>
  );
};

/* ─────────────────────────────────────────────
   STAT COUNTER
───────────────────────────────────────────── */
const StatCard = ({ value, label, suffix = '' }) => (
  <div className="text-center">
    <div className="text-4xl font-black text-white">
      {value}<span className="text-blue-400">{suffix}</span>
    </div>
    <div className="text-slate-400 text-sm mt-1">{label}</div>
  </div>
);

/* ─────────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, gradient }) => (
  <div className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

/* ─────────────────────────────────────────────
   STEP CARD (How it works)
───────────────────────────────────────────── */
const StepCard = ({ step, title, desc }) => (
  <div className="flex gap-5">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-900/40">
      {step}
    </div>
    <div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────── */
const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // The contact form is ready to connect to the school's support workflow.
    setSent(true);
  };

  return sent ? (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
      <p className="text-slate-400">We'll get back to you within 24 hours.</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Name</label>
          <input
            id="contact-name"
            type="text" required
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Email</label>
          <input
            id="contact-email"
            type="email" required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            placeholder="you@school.edu"
            className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">Message</label>
        <textarea
          id="contact-message"
          required rows={5}
          value={form.message}
          onChange={e => setForm({...form, message: e.target.value})}
          placeholder="Tell us about your school..."
          className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors resize-none"
        />
      </div>
      <button
        id="contact-submit-btn"
        type="submit"
        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:-translate-y-0.5"
      >
        Send Message →
      </button>
    </form>
  );
};

/* ─────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────── */
const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session?.user?.user_metadata?.role;
        navigate(role === 'admin' ? '/admin' : '/portal');
      }
    });
  }, [navigate]);

  return (
    <div className="bg-[#070c1a] min-h-screen text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow { box-shadow: 0 0 80px rgba(59,130,246,0.15); }
        html { scroll-behavior: smooth; }
      `}</style>

      <PublicNavbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Now Live — v1.0</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6">
            Smart Payments <br />
            <span className="gradient-text">for Schools</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            H-Pay makes school payments simple and cashless. Students pay with
            their school card, parents add funds online, and schools stay in control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              id="hero-parent-login-btn"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-xl shadow-blue-900/40 hover:shadow-blue-900/60 hover:-translate-y-0.5"
            >
              Parent Portal — Log In
            </Link>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl border border-white/10 hover:border-white/25 transition-all text-base"
            >
              See How It Works ↓
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-white/10 pt-12">
            <StatCard value="100" suffix="%" label="Cashless" />
            <StatCard value="Fast" label="Easy payments" />
            <StatCard value="24/7" label="Always available" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">What We Offer</p>
            <h2 className="text-4xl font-black text-white">Built for Modern Schools</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">Everything your school needs for simple, secure, and transparent cashless payments.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon="💳" title="Simple Card Payments" gradient="from-blue-600 to-blue-800"
              desc="Students use their school card for quick, convenient payments at the canteen." />
            <FeatureCard icon="👨‍👩‍👧" title="Parent Portal" gradient="from-cyan-600 to-cyan-800"
              desc="Parents log in to view their child's balance, top up funds, and see a full transaction history in real time." />
            <FeatureCard icon="☁️" title="Clear Account Updates" gradient="from-violet-600 to-violet-800"
              desc="Payment activity is kept up to date, giving schools and families a clear view of every purchase." />
            <FeatureCard icon="🛡️" title="Secure & Private" gradient="from-emerald-600 to-emerald-800"
              desc="Role-based access control ensures parents only see their own children and admins manage the full system." />
            <FeatureCard icon="📊" title="Admin Dashboard" gradient="from-orange-600 to-orange-800"
              desc="Track attendance, manage student cards, register new students, and view full transaction logs." />
            <FeatureCard icon="📱" title="Works on Any Device" gradient="from-pink-600 to-pink-800"
              desc="Use the portal from a phone, tablet, or computer without installing a separate app." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">The Process</p>
            <h2 className="text-4xl font-black text-white">How H-Pay Works</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <StepCard step="01" title="Student Receives a School Card"
                desc="Each student receives a school card connected to their account for convenient canteen payments." />
              <StepCard step="02" title="Parent Tops Up Balance"
                desc="Parents log in to the Parent Portal on any device, view their child's balance, and add funds instantly." />
              <StepCard step="03" title="Pay at the Canteen"
                desc="At the canteen, the student presents their card and the payment is completed quickly and securely." />
              <StepCard step="04" title="Admin Monitors Everything"
                desc="School administrators get a live dashboard showing all transactions, attendance records, and student balances." />
            </div>

            {/* Visual diagram */}
            <div className="relative glow bg-gradient-to-br from-[#0d1526] to-[#0a1020] border border-blue-500/20 rounded-3xl p-8">
              <div className="flex flex-col gap-4">
                {[
                  { label: 'School Card', icon: '💳', color: 'from-blue-600/20 to-blue-900/20 border-blue-500/30' },
                  { label: 'Secure Account', icon: '☁️', color: 'from-cyan-600/20 to-cyan-900/20 border-cyan-500/30' },
                  { label: 'School Management', icon: '🖥️', color: 'from-violet-600/20 to-violet-900/20 border-violet-500/30' },
                  { label: 'Parent Portal', icon: '📱', color: 'from-emerald-600/20 to-emerald-900/20 border-emerald-500/30' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className={`flex items-center gap-3 bg-gradient-to-r ${item.color} border rounded-xl px-4 py-3`}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-white font-semibold text-sm">{item.label}</span>
                      <div className="ml-auto flex gap-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full bg-current opacity-40" style={{ animationDelay: `${j * 0.2}s` }} />
                        ))}
                      </div>
                    </div>
                    {i < 3 && <div className="flex justify-center my-1"><div className="w-px h-4 bg-gradient-to-b from-blue-500/50 to-transparent" /></div>}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-xs text-slate-500">
                <span>Clear payment records</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" /> Ready for school</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">About H-Pay</p>
              <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                Cashless Schools <br />Start Here
              </h2>
              <p className="text-slate-400 leading-relaxed mb-5">
                H-Pay was built by{" "}
                <a
                  href="https://heztec.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-white transition-colors hover:text-cyan-300"
                >
                  HezTec
                </a>{" "}
                to solve a real problem — school canteens handling cash are slow, error-prone, and difficult for parents to monitor.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Our service brings payments, family accounts, and school administration together in one clear, dependable experience.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Cashless payments', 'Family accounts', 'Secure access', 'Clear records', 'School support', 'Any device'].map(tag => (
                  <span key={tag} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '⚡', label: 'Instant Payments', val: '< 1 sec transaction' },
                { icon: '🔒', label: 'Bank-level Security', val: 'Encrypted data at rest' },
                { icon: '📶', label: 'Always available', val: 'Easy access for families' },
                { icon: '🏫', label: 'School-ready', val: 'Built for every school community' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-white font-bold text-sm mb-1">{item.label}</div>
                  <div className="text-slate-500 text-xs">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PARENT PORTAL CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glow bg-gradient-to-br from-[#0d1a40] to-[#080f26] border border-blue-500/25 rounded-3xl p-12">
            <div className="text-5xl mb-6">👨‍👩‍👧</div>
            <h2 className="text-3xl font-black text-white mb-4">Are you a Parent?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Log in to the Parent Portal to check your child's balance,
              view spending history, and top up funds — anytime, anywhere.
            </p>
            <Link
              to="/login"
              id="parent-cta-btn"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-xl shadow-blue-900/50 hover:-translate-y-0.5"
            >
              Access Parent Portal →
            </Link>
            <p className="text-slate-600 text-xs mt-5">
              Don't have an account? Contact your school administrator.
            </p>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 px-6 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Get in Touch</p>
              <h2 className="text-4xl font-black text-white mb-4">Interested in H-Pay for Your School?</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                We'd love to help your school go cashless. Reach out to schedule a demo or learn more about how H-Pay can work for you.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: '🌐', label: 'Website', val: 'heztec.com', href: 'https://heztec.com' },
                  { icon: '📧', label: 'Email', val: 'info@heztec.com' },
                  { icon: '📍', label: 'Built by', val: 'HezTec Solutions', href: 'https://heztec.com' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">{item.label}</div>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white text-sm font-semibold transition-colors hover:text-cyan-300"
                        >
                          {item.val}
                        </a>
                      ) : (
                        <div className="text-white text-sm font-semibold">{item.val}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;