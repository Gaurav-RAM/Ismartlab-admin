// src/state/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc /* optionally: getDocFromServer */ } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Auth is known now; allow UI to render immediately
      if (!firebaseUser) {
        if (!cancelled) { setUser(null); setLoading(false); }
        return;
      }
      if (!cancelled) { setUser({ uid: firebaseUser.uid }); setLoading(false); }

      // Background profile fetch; won’t block UI
      try {
        const ref = doc(db, 'users', firebaseUser.uid);
        // If debugging transport, temporarily try: const snap = await getDocFromServer(ref);
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() });
        }
      } catch (e) {
        console.error('Profile load failed:', e.code, e.message);
      }
    });

    return () => { cancelled = true; unsub(); };
  }, []);

  const login = async ({ email, password }) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const ref = doc(db, 'users', res.user.uid);
    const snap = await getDoc(ref); // or getDocFromServer(ref) during debugging
    if (!snap.exists()) throw new Error('User not found in Firestore');
    const data = { uid: res.user.uid, ...snap.data() };
    setUser(data);
    return data;
  };

  const logout = async () => { await signOut(auth); setUser(null); };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  if (loading) return 'Loading...';
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
