import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UI_STRINGS } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  canDismiss?: boolean; // 閉じてゲスト利用可能かどうか
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'signup',
  canDismiss = true 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostRegistration(result.user, true); // Googleは即Verified扱いだがDB登録はする
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'signup' && !agreed) {
      setError("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await handlePostRegistration(result.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/user-not-found') msg = "User not found.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Firestoreにユーザーデータを作成（初回のみ）
  const handlePostRegistration = async (user: any, isGoogle = false) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Googleログインで既存ユーザーの場合も考慮し、setDoc with mergeを使用
      // 新規登録時のみ registeredAt をセットしたいが、
      // merge: true なので既存データがあれば上書きされない... わけではない。
      // registeredAt が既に存在するかチェックするのが丁寧だが、
      // 簡易実装として「未設定ならセット」のようなロジックはセキュリティルール等でも担保できる。
      // ここではクライアントサイドで簡易的に、signupフローなら必ずセットする形にする。
      // Googleログインの場合は毎回ここを通るが、registeredAtを更新したくない場合は
      // { merge: true } で registeredAt を渡さない手もあるが、初回かどうかわからない。
      // 厳密には getDoc して確認する。
      
      const payload: any = { email: user.email };
      // メール認証の場合はSignup時のみここに来るのでセットしてOK
      // Googleの場合はLoginでもここに来る可能性があるので注意が必要
      if (!isGoogle || mode === 'signup') { 
         // 注: GoogleログインはUI上Signup/Login区別曖昧だが、
         // 厳密な初回判定なしでも、上書きされて困るデータがなければ一旦 update でよい。
         // ただし「72時間」の起点が更新されるとまずいので、
         // 本来は Cloud Functions トリガーで作成するのがベスト。
         // クライアントサイド実装としては、setDocのmergeを利用し、registeredAtは書き込まない（AuthContext側で補完する）
         // または、ここで初回のみ書き込む。
         
         // AuthContext側で「ドキュメントがなければ作成」しているので、
         // ここでは email 更新程度にとどめておくのが安全策。
         // 明示的に作成したい場合は以下。
         payload.lastLoginAt = serverTimestamp();
      }
      
      await setDoc(userDocRef, payload, { merge: true });

    } catch (e) {
      console.error("Firestore update error:", e);
      // Auth自体は成功しているのでスルー
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-center relative">
          {canDismiss && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Start Your Journey'}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            {mode === 'login' ? 'Login to continue practicing' : 'Create an account to track progress'}
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          
          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {mode === 'signup' && (
              <label className="flex items-start gap-3 p-1 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                  />
                  <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                  I agree to the <a href="#" className="text-indigo-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 font-bold hover:underline">Privacy Policy</a>.
                </span>
              </label>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
            </button>
          </form>
          
          <div className="text-center">
            <button 
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-indigo-600 font-bold hover:underline text-sm"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
