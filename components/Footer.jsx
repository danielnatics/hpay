import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-blue-500/10 bg-[#070c1a] text-white">
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black shadow-lg shadow-blue-500/25">
                H
              </span>
              <span className="text-xl font-black tracking-tight">
                H<span className="text-blue-400">-Pay</span>
              </span>
            </Link>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Secure, cashless school payments that help students pay simply,
              parents stay informed, and schools operate with confidence.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Built for connected schools
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="/#features" className="transition-colors hover:text-white">Features</a></li>
              <li><a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a></li>
              <li><Link to="/login" className="transition-colors hover:text-white">Parent Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              For schools
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="/#about" className="transition-colors hover:text-white">About H-Pay</a></li>
              <li><a href="/#contact" className="transition-colors hover:text-white">Request a demo</a></li>
            </ul>
          </div>

          <div id="footer-contact">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Contact
            </h4>
            <p className="text-sm leading-6 text-slate-400">
              Need help bringing secure cashless payments to your school?
            </p>
            <a
              href="mailto:getheztec@gmail.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-cyan-300"
            >
              <span className="text-cyan-400">✉</span>
              getheztec@gmail.com
            </a>
            <p className="mt-2 text-xs text-slate-500">Anambra, Nigeria</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-7 text-xs text-slate-500 md:flex-row">
          <p>© {year} HezTec. H-Pay is built for safer school commerce.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-slate-200">Privacy</a>
            <a href="#" className="transition-colors hover:text-slate-200">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
