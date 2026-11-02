// src/lib/firebase.native.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getReactNativePersistence } from "firebase/auth";

import { firebaseConfig } from "./firebaseConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/already-initialized"
    ) {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export { app };
