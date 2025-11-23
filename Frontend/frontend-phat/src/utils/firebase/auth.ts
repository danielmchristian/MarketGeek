// Firebase authentication service
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

interface FirebaseAuthResult {
  data: {
    user: User | null;
    session: any;
  };
  error: { message: string } | null;
}

export class FirebaseAuth {
  // Sign up new user
  async signUp(email: string, password: string, metadata?: { name?: string; organization?: string }): Promise<FirebaseAuthResult> {
    try {
      console.log('🔥 Firebase: Attempting createUserWithEmailAndPassword...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('🔥 Firebase: User created successfully:', user.uid);
      
      // Store additional user data in Firestore
      if (metadata && user) {
        console.log('🔥 Firebase: Storing additional user data...');
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: metadata.name || '',
          organization: metadata.organization || '',
          created_at: new Date().toISOString()
        });
        console.log('🔥 Firebase: User data stored successfully');
      }
      
      return {
        data: { user, session: userCredential },
        error: null
      };
    } catch (error: any) {
      console.log('🔥 Firebase: Error caught:', error.code, error.message);
      return {
        data: { user: null, session: null },
        error: { message: error.message }
      };
    }
  }

  // Sign in existing user
  async signInWithPassword(email: string, password: string): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        data: { user: userCredential.user, session: userCredential },
        error: null
      };
    } catch (error: any) {
      return {
        data: { user: null, session: null },
        error: { message: error.message }
      };
    }
  }

  // Sign out user
  async signOut(): Promise<{ error: { message: string } | null }> {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export const firebaseAuth = new FirebaseAuth();
