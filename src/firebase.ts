import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserAccount, AccountType } from './types';

export { firebaseConfig };

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Validate Connection to Firestore (MANDATORY per Firebase guidelines)
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore: client is currently offline or connecting.");
    }
  }
}
testFirestoreConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Instant Email Sign-In (Creates or aligns Firebase Auth session so writes succeed)
export async function signInInstant(
  email: string,
  displayName?: string,
  accountType: AccountType = 'normal',
  businessName?: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const trimmedName = displayName?.trim() || cleanEmail.split('@')[0] || 'DealSphere Member';

  try {
    const userCredential = await signInAnonymously(auth);
    const fbUser = userCredential.user;
    try {
      await updateProfile(fbUser, { displayName: trimmedName });
    } catch {}

    localStorage.setItem(`user_role_${fbUser.uid}`, accountType);
    if (businessName) {
      localStorage.setItem(`user_biz_${fbUser.uid}`, businessName);
    }

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        id: fbUser.uid,
        name: trimmedName,
        email: cleanEmail,
        accountType: accountType,
        businessName: businessName || '',
        businessBio: accountType === 'business' ? 'Affiliate product curator and deal marketer' : 'Deal enthusiast',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }, { merge: true });
    } catch (err) {
      console.warn('Could not persist instant user doc to firestore:', err);
    }

    return {
      id: fbUser.uid,
      name: trimmedName,
      email: cleanEmail,
      accountType,
      businessName: businessName || '',
      businessBio: accountType === 'business' ? 'Affiliate product curator and deal marketer' : 'Deal enthusiast',
      joinedDate: 'Sep 2026'
    };
  } catch (err) {
    console.info('Firebase anonymous auth not enabled or restricted; using offline-ready user account:', err);
    return createGoogleUserAccount(cleanEmail, trimmedName, accountType, businessName);
  }
}

// Google Sign-In helper
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      console.warn(
        `Firebase Auth: Domain "${window.location.hostname}" is not authorized yet in Firebase Console. Add it at https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`
      );
    } else if (error?.code === 'auth/popup-closed-by-user') {
      console.info('Google Sign-in popup closed by user.');
    } else {
      console.warn('Google Sign-In issue:', error?.message || error);
    }
    throw error;
  }
}

// Email & Password Sign In
export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return userCredential.user;
  } catch (error: any) {
    console.warn('Sign In error:', error?.code, error?.message);
    throw error;
  }
}

// Email & Password Sign Up (Registration)
export async function signUpWithEmail(
  email: string, 
  pass: string, 
  displayName?: string,
  accountType: AccountType = 'normal',
  businessName?: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    const trimmedName = displayName?.trim() || 'DealSphere Member';
    try {
      await updateProfile(fbUser, {
        displayName: trimmedName,
      });
    } catch (e) {
      console.warn('Could not set displayName on profile:', e);
    }

    // Persist role & profile in localStorage
    localStorage.setItem(`user_role_${fbUser.uid}`, accountType);
    if (businessName) {
      localStorage.setItem(`user_biz_${fbUser.uid}`, businessName);
    }

    // Also store user profile doc in Firestore
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        id: fbUser.uid,
        name: trimmedName,
        email: fbUser.email || email.trim().toLowerCase(),
        accountType: accountType,
        businessName: businessName || '',
        businessBio: accountType === 'business' ? 'Affiliate product curator and deal marketer' : '',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    } catch (err) {
      console.warn('Could not write initial user doc to firestore:', err);
    }

    return fbUser;
  } catch (error: any) {
    console.warn('Sign Up error:', error?.code, error?.message);
    throw error;
  }
}

// Sign-Out helper
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Sign Out info:', error);
  }
}

// Generate consistent user account structure
export function createGoogleUserAccount(
  email: string, 
  displayName?: string,
  accountType: AccountType = 'normal',
  businessName?: string
): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  // Safe alphanumeric ID matching Firestore rules /^[a-zA-Z0-9_\-]+$/
  const rawId = btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '');
  const id = `user_${rawId.slice(0, 24)}`;
  
  let formattedName = 'Member';
  if (displayName && displayName.trim() && !displayName.includes('@') && !/^\w\d+$/i.test(displayName.trim())) {
    formattedName = displayName.trim();
  } else {
    formattedName = 'DealSphere Member';
  }
  
  const savedRoleKey = `user_role_${id}`;
  const savedBizKey = `user_biz_${id}`;
  const savedRole = (typeof window !== 'undefined' ? (localStorage.getItem(savedRoleKey) as AccountType) : null) || accountType;
  const savedBiz = (typeof window !== 'undefined' ? localStorage.getItem(savedBizKey) : null) || (businessName || '');

  return {
    id,
    name: formattedName,
    email: cleanEmail,
    accountType: savedRole,
    businessName: savedBiz,
    businessBio: savedRole === 'business' ? 'Affiliate product curator and deal marketer' : 'Deal enthusiast',
    joinedDate: 'Sep 2026',
  };
}

