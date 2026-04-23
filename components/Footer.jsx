import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#064e3b] border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link
              to="/"
              className="text-sm font-medium hover:text-indigo-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-4">
                 
                 <div className="bg-emerald-600 p-1.5 rounded-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
                <span className="text-xl font-black text-white tracking-tight ">
                  HPAY
                </span>
              </div>
            </Link>

            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Empowering schools with secure, real-time RFID payment solutions.
              Built for speed, designed for parents.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-emerald-400 font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-emerald-100/80">
              <li>
                <a
                  href="/register"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Admin Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/portal"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Parent Portal
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Transaction History
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-emerald-400 font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-emerald-100/80">
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  API Docs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-emerald-400 font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-emerald-100/80">
              <li className="flex items-center gap-2">
                <span className="bg-emerald-800">📧</span> getheztec@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-emerald-800">📍</span> Anambra, Nigeria
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-emerald-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} HezTec. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-emerald-200">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
