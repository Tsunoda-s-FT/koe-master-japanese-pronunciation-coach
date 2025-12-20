import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user, resendVerificationEmail } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  if (status !== 'expired') {
    return <>{children}</>;
  }

  const handleResend = async () => {
    try {
      await resendVerificationEmail();
      setEmailSent(true);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      alert("Failed to send email. Please try again later.");
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-slate-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Access Expired</h2>
          <p className="text-slate-500">
            Your 72-hour provisional access has ended. <br/>
            Please verify your email address to continue using Koe-Master.
          </p>
          <div className="py-2">
            <span className="inline-block bg-slate-100 px-4 py-2 rounded-lg text-slate-700 font-mono text-sm border border-slate-200">
              {user?.email}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResend}
            disabled={emailSent}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-slate-400"
          >
            {emailSent ? 'Verification Email Sent!' : 'Resend Verification Email'}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full text-slate-400 font-bold py-3 rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            Log out / Use another account
          </button>
        </div>
      </div>
    </div>
  );
};
