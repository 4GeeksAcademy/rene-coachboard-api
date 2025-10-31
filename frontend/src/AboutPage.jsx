import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col items-center justify-center">
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
    </div>
  );
}
