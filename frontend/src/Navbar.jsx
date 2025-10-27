import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ showAbout, setShowAbout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-full bg-white/80 shadow-md py-4 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowAbout && setShowAbout(false); navigate('/'); }}>
        {/* Coach tactics board SVG icon */}
        <span className="inline-block h-8 w-8 rounded bg-blue-600 flex items-center justify-center mr-2 border border-blue-300">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
            <rect x="4" y="6" width="24" height="20" rx="3" fill="#fff" stroke="#1976d2" strokeWidth="2" />
            <circle cx="10" cy="12" r="2" fill="#1976d2" />
            <circle cx="22" cy="20" r="2" fill="#43a047" />
            <circle cx="22" cy="12" r="2" fill="#d32f2f" />
            <circle cx="10" cy="20" r="2" fill="#fbc02d" />
            <path d="M12 12 Q16 16 22 12" stroke="#1976d2" strokeWidth="1.5" fill="none" />
            <path d="M10 20 Q16 16 22 20" stroke="#1976d2" strokeWidth="1.5" fill="none" />
            <rect x="4" y="6" width="24" height="20" rx="3" stroke="#1976d2" strokeWidth="2" />
          </svg>
        </span>
        <span className="text-2xl font-bold text-blue-700 tracking-tight">CoachBoard</span>
      </div>
      <div className="flex gap-4 items-center">
        <button
          className={`px-4 py-1 rounded-full font-semibold transition-all duration-200 shadow-sm bg-gray-100 text-blue-700 hover:bg-blue-50`}
          onClick={() => { setShowAbout && setShowAbout(false); navigate('/login'); }}
        >
          Log In
        </button>
        <button
          className={`px-4 py-1 rounded-full font-semibold transition-all duration-200 shadow-sm bg-gray-100 text-green-700 hover:bg-green-50`}
          onClick={() => { setShowAbout && setShowAbout(false); navigate('/signup'); }}
        >
          Sign Up
        </button>
        <button
          className={`px-4 py-1 rounded-full font-semibold transition-all duration-200 shadow-sm ${showAbout ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-yellow-700 hover:bg-yellow-50'}`}
          onClick={() => { setShowAbout && setShowAbout(true); if (location.pathname !== '/') navigate('/'); }}
        >
          About
        </button>
      </div>
    </nav>
  );
}
