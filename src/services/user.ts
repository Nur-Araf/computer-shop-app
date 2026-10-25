// src/services/user.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type AppRole = "admin" | "staff";

export interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const UserService = {
  async getUserByUid(uid: string): Promise<FirestoreUser | null> {
    const snapshot = await getDoc(doc(db, "users", uid));

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as FirestoreUser;
  },

  async getUserByEmail(email: string): Promise<FirestoreUser | null> {
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email.trim()),
      limit(1),
    );

    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];

    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as FirestoreUser;
  },
};
