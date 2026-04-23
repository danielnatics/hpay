import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Landing = () => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleStartClick = () => {
    if (session) {
      // If already logged in, send them to the home dashboard
      navigate('/');
    } else {
      // If not logged in, send them to login
      navigate('/login');
    }
  };

return (
    <div className="bg-emerald-100">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-50 text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full px-3 py-1 text-sm leading-6 text-emerald-600 ring-1 ring-emerald-900/10 hover:ring-emerald-900/20">
              HezTech IoT Solutions v1.0
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-emerald-800 sm:text-6xl ">
            Modernize Your School Payments with <span className="text-emerald-600">H-Pay</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A secure, RFID-based cloud payment system for students. Track balances, 
            register new cards, and manage transactions in real-time with ESP32 & Supabase.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={handleStartClick}
              className="rounded-lg bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all transform hover:-translate-y-1"
            >
              {session ? "Enter Dashboard" : "Admin Login"}
            </button>
            <Link 
              to={session ? "/parentPortal" : "/login"} 
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-emerald-700"
            >
              Parent Portal <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white/50 backdrop-blur-md py-24 sm:py-32 border-t border-emerald-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-3 lg:gap-x-8">
            <FeatureCard 
              emoji="💳" 
              title="RFID Integration" 
              desc="Tap-and-go technology for seamless on-campus purchases using ESP32." 
            />
            <FeatureCard 
              emoji="☁️" 
              title="Cloud Sync" 
              desc="Instant data synchronization between physical hardware and Supabase." 
            />
            <FeatureCard 
              emoji="🛡️" 
              title="Secure Access" 
              desc="Role-based encryption ensuring data privacy for both schools and families." 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Small helper component for the grid
const FeatureCard = ({ emoji, title, desc }) => (
  <div className="text-center p-6 rounded-2xl hover:bg-emerald-50 transition-colors">
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-lg font-bold text-emerald-900">{title}</h3>
    <p className="mt-2 text-gray-600">{desc}</p>
  </div>
);

export default Landing;