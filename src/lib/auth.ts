import { GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, linkWithPopup, signInWithPopup } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { auth, db } from './firebase';
import { doc, getDoc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const emailSignIn = async (email: string, password: string): Promise<{ user: User; role: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    const userRef = doc(db, 'users', result.user.uid);
    let role = 'user';
    try {
      const userSnap = await getDocFromServer(userRef);
      if (!userSnap.exists()) {
        role = email === 'ceo.nicopadilla@gmail.com' ? 'super_admin' : 'user';
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName || email.split('@')[0],
          role: role,
          createdAt: new Date().toISOString()
        });
      } else {
        role = userSnap.data().role;
      }
    } catch (e: any) {
      if (!e.message?.includes('offline')) {
        console.error('Failed to access user doc locally during login:', e);
      }
      role = email === 'ceo.nicopadilla@gmail.com' ? 'super_admin' : 'user';
    }
    
    return { user: result.user, role };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignIn = async (): Promise<{ user: User; role: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    
    const userRef = doc(db, 'users', result.user.uid);
    let role = 'user';
    try {
      const userSnap = await getDocFromServer(userRef);
      if (!userSnap.exists()) {
        if (result.user.email === 'ceo.nicopadilla@gmail.com') {
          role = 'super_admin';
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName || result.user.email?.split('@')[0],
            role: role,
            createdAt: new Date().toISOString()
          });
        } else {
          await auth.signOut();
          throw new Error('Google Sign-In is restricted to Super Admin only. Please use Email/Password.');
        }
      } else {
        role = userSnap.data().role;
      }
    } catch (e: any) {
      if (!e.message?.includes('offline') && !e.message?.includes('restricted')) {
        console.error('Failed to access user doc locally during login:', e);
      }
      if (e.message?.includes('restricted')) throw e;
      role = result.user.email === 'ceo.nicopadilla@gmail.com' ? 'super_admin' : 'user';
      if (role !== 'super_admin') {
          await auth.signOut();
          throw new Error('Google Sign-In is restricted to Super Admin only. Please use Email/Password.');
      }
    }
    
    return { user: result.user, role };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const connectGoogleDrive = async () => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  try {
    // Try link with popup if they signed in with email, but if already linked it might fail
    let result;
    try {
        result = await linkWithPopup(auth.currentUser, provider);
    } catch (e: any) {
        if (e.code === 'auth/credential-already-in-use') {
            result = await signInWithPopup(auth, provider);
        } else {
            throw e;
        }
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    }
  } catch (err) {
    console.error('Error connecting to drive', err);
    throw err;
  }
};

export const createNewUser = async (email: string, password: string, role: string) => {
  // Use a secondary app instance to prevent signing out the current admin user
  const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
  const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const userId = cred.user.uid;
    // Set Firestore doc
    await setDoc(doc(db, 'users', userId), {
      email,
      displayName: email.split('@')[0],
      role,
      createdAt: new Date().toISOString()
    });
    // Sign out secondary
    await secondaryAuth.signOut();
    return userId;
  } catch (e: any) {
    console.error('Failed to create user:', e);
    if (e.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password authentication is not enabled. Please enable it in your Firebase Console -> Authentication -> Sign-in method.');
    }
    throw e;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
