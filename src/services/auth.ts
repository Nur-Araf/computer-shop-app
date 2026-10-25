// src/services/auth.ts
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export const AuthService = {
  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    return credential.user;
  },

  async register(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    return credential.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
