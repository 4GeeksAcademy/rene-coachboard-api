

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const aboutStory = (
  <div className="max-w-2xl mx-auto p-8 bg-white/95 rounded-2xl shadow-2xl mt-10 animate-fade-in">
    <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">About CoachBoard</h1>
    <p className="text-gray-700 text-lg mb-4 text-center">Founded by <span className="font-bold text-blue-700">Leinz Rene</span> on <span className="font-bold text-green-700">October 1st, 2025</span></p>
    <div className="text-gray-600 text-base leading-relaxed">
      <p>
        It was a crisp autumn evening, the gym buzzing with anticipation. Leinz Rene, a passionate coach and lifelong basketball enthusiast, found himself courtside at a local high school championship. The game was intense—players hustling, coaches shouting, parents cheering. But as the clock ticked down, Leinz noticed something: the chaos of communication, the frantic scribbling of plays on paper, the missed opportunities for real-time strategy.
      </p>
      <p className="mt-3">
        In that moment, as the final buzzer sounded and the crowd erupted, Leinz had an epiphany. What if there was a way to bring clarity, connection, and creativity to every coach and team? What if technology could empower coaches to design plays, manage teams, and inspire athletes—all in one place?
      </p>
      <p className="mt-3">
        That night, CoachBoard was born. Leinz poured his heart into building a platform that would revolutionize the way coaches lead. Today, CoachBoard is trusted by teams across the country, helping coaches turn their vision into victory. Whether you’re on the court, the field, or the sidelines, CoachBoard is your playbook for success.
      </p>
      <p className="mt-4 text-center font-semibold text-blue-700">Join the movement. Lead with CoachBoard.</p>
    </div>
  </div>
);

export default function LandingPage() {
  const [showAbout, setShowAbout] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      {/* Navbar */}
  <Navbar showAbout={showAbout} setShowAbout={setShowAbout} />
      {/* Main Content */}
      {!showAbout ? (
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl p-10 bg-white/90 rounded-2xl shadow-2xl flex flex-col items-center">
            <h1 className="text-5xl font-extrabold mb-2 text-center text-blue-700 tracking-tight drop-shadow">Welcome to CoachBoard</h1>
            <p className="mb-6 text-center text-gray-700 text-xl font-medium">Unleash your coaching potential. CoachBoard is your digital playbook—designed to inspire, organize, and empower every coach and team to achieve greatness.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
              <div className="bg-blue-50 rounded-xl p-4 shadow flex flex-col items-center">
                <svg className="h-8 w-8 mb-2" viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="20" rx="3" fill="#fff" stroke="#1976d2" strokeWidth="2"/><circle cx="10" cy="12" r="2" fill="#1976d2"/><circle cx="22" cy="20" r="2" fill="#43a047"/><path d="M12 12 Q16 16 22 12" stroke="#1976d2" strokeWidth="1.5" fill="none"/></svg>
                <h2 className="font-bold text-blue-700 mb-1">Design Winning Plays</h2>
                <p className="text-sm text-gray-600 text-center">Create, animate, and share plays for basketball, football, and more. Bring your vision to life with our interactive play designer.</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 shadow flex flex-col items-center">
                <svg className="h-8 w-8 mb-2" viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="20" rx="3" fill="#fff" stroke="#43a047" strokeWidth="2"/><circle cx="22" cy="12" r="2" fill="#d32f2f"/><circle cx="10" cy="20" r="2" fill="#fbc02d"/><path d="M10 20 Q16 16 22 20" stroke="#43a047" strokeWidth="1.5" fill="none"/></svg>
                <h2 className="font-bold text-green-700 mb-1">Manage Your Team</h2>
                <p className="text-sm text-gray-600 text-center">Invite players, track availability, and organize your roster. Keep everyone connected and focused on the goal.</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 shadow flex flex-col items-center">
                <svg className="h-8 w-8 mb-2" viewBox="0 0 32 32" fill="none"><rect x="4" y="6" width="24" height="20" rx="3" fill="#fff" stroke="#fbc02d" strokeWidth="2"/><circle cx="16" cy="13" r="2" fill="#fbc02d"/><path d="M10 20 Q16 16 22 20" stroke="#fbc02d" strokeWidth="1.5" fill="none"/></svg>
                <h2 className="font-bold text-yellow-700 mb-1">Game Day Success</h2>
                <p className="text-sm text-gray-600 text-center">Access box scores, chat with your team, and export stats. Everything you need for a winning game day is at your fingertips.</p>
              </div>
            </div>
            <div className="w-full flex flex-col items-center">
              <div className="mt-6 text-center text-gray-700 text-lg">
                <span className="font-semibold">Ready to transform your team?</span>
                <br />
                <span>Sign up now and discover the power of CoachBoard. No credit card required.</span>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500 text-xs">
              <span>CoachBoard is trusted by coaches and teams who want to win together. Start your journey today.</span>
            </div>
          </div>
        </main>
      ) : (
        aboutStory
      )}
    </div>
  );
}
