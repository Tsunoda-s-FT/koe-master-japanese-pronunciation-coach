import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  sendEmailVerification 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserStatus = 'guest' | 'provisional' | 'expired' | 'verified';

interface AuthContextType {
  user: User | null;
  status: UserStatus;
  isLoading: boolean;
  remainingHours: number | null; // 残り時間（時間単位）
  checkStatus: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'guest',
  isLoading: true,
  remainingHours: null,
  checkStatus: async () => {},
  resendVerificationEmail: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<UserStatus>('guest');
  const [isLoading, setIsLoading] = useState(true);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);

  const PROVISIONAL_LIMIT_HOURS = 72;

  const calculateStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setStatus('guest');
      setRemainingHours(null);
      return;
    }

    // すでにメール認証済み、またはプロバイダ認証（Google等）の場合は verified
    // 注: Google認証の場合 emailVerified は true になる
    if (currentUser.emailVerified) {
      setStatus('verified');
      setRemainingHours(null);
      return;
    }

    // メール未認証の場合、Firestoreから登録日時を取得して期限判定
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let registeredAtDate: Date;

      if (userDoc.exists()) {
        const data = userDoc.data();
        // Firestore Timestamp to Date
        registeredAtDate = data.registeredAt?.toDate() || new Date(currentUser.metadata.creationTime || Date.now());
      } else {
        // ドキュメントがない場合（稀なケース）、Authのメタデータを使用し、ドキュメントを作成しておく
        registeredAtDate = new Date(currentUser.metadata.creationTime || Date.now());
        // 非同期で書き込んでおく（awaitしない）
        setDoc(userDocRef, { 
          email: currentUser.email, 
          registeredAt: serverTimestamp() 
        }, { merge: true });
      }

      const now = new Date();
      const diffMs = now.getTime() - registeredAtDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const remaining = Math.max(0, PROVISIONAL_LIMIT_HOURS - diffHours);

      setRemainingHours(Math.floor(remaining));

      if (diffHours < PROVISIONAL_LIMIT_HOURS) {
        setStatus('provisional');
      } else {
        setStatus('expired');
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      // エラー時は安全側に倒して provisional にするか、リトライを促す
      // ここでは暫定的に provisional とする
      setStatus('provisional');
      setRemainingHours(PROVISIONAL_LIMIT_HOURS); 
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await calculateStatus(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ステータス再確認用（タイマーやアクション後など）
  const checkStatus = async () => {
    if (user) {
      await user.reload(); // Authのステータス（emailVerifiedなど）を最新にする
      await calculateStatus(auth.currentUser); // reload後のuserオブジェクトを使って再計算
    }
  };

  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      status, 
      isLoading, 
      remainingHours,
      checkStatus,
      resendVerificationEmail 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
