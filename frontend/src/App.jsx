

import { useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import LandingPage from './LandingPage';
import AboutPage from './AboutPage';
import RoleCaptureModal from './RoleCaptureModal';
import TeamsDashboard from './TeamsDashboard';
import TeamsManager from './TeamsManager';
import PlayerTeamsManager from './PlayerTeamsManager';
import Navbar from './Navbar';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  console.log('App.jsx debug:', { loading, profileLoading, user });

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Profile fetch error:', error);
        }
        setProfile(data || null);
        setProfileLoading(false);
      });
  }, [user]);

  // Redirect after login based on role
  useEffect(() => {
    if (user && profile && (location.pathname === '/' || location.pathname === '/login')) {
      if (profile.role === 'coach' || profile.role === 'assistant') {
        navigate('/teams', { replace: true });
      } else if (profile.role === 'player') {
        navigate('/player-teams', { replace: true });
      } else {
        navigate('/teams', { replace: true }); // fallback
      }
    }
  }, [user, profile, location.pathname, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 transition-opacity duration-500 animate-fadein">
        <div className="bg-white p-8 rounded shadow flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <div className="text-lg text-gray-700 font-medium">Loading...</div>
        </div>
        <style>{`
          @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
          .animate-fadein { animation: fadein 0.7s; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Always show Navbar except for login/signup/forgot-password */}
      {!(location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password') && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/teams" element={user ? <TeamsManager /> : <Navigate to="/login" />} />
        <Route path="/player-teams" element={user ? <PlayerTeamsManager /> : <Navigate to="/login" />} />
        <Route path="/team/:teamId" element={user ? <TeamsDashboard user={user} profile={profile} /> : <Navigate to="/login" />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/"
          element={
            !user ? (
              <LandingPage />
            ) : profile ? (
              profile.role === 'player' ? (
                <Navigate to="/player-teams" />
              ) : (
                <Navigate to="/teams" />
              )
            ) : (
              <div className="flex items-center justify-center min-h-screen">Loading profile...</div>
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
