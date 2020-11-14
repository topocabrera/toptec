import * as firebase from "firebase";
import "firebase/database";
import "firebase/auth";
import "firebase/firestore";

let config = {
  apiKey: "AIzaSyB31L20GfT5Gpz8ZGRnQy56BNze6Jvsi_Q",
  authDomain: "toptec-6a5ef.firebaseapp.com",
  databaseURL: "https://toptec-6a5ef.firebaseio.com",
  projectId: "toptec-6a5ef",
  storageBucket: "toptec-6a5ef.appspot.com",
  messagingSenderId: "996609770390",
  appId: "1:996609770390:web:805010f6a1e028688f53b7",
};

firebase.initializeApp(config);

const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default firebase.database();
export const firestore = firebase.firestore();

export const signInWithGoogle = () => {
  auth.signInWithPopup(provider);
};

export const generateUserDocument = async (user, additionalData) => {
  if (!user) return;

  const userRef = firestore.doc(`users/${user.uid}`);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { email, displayName, photoURL } = user;
    try {
      await userRef.set({
        displayName,
        email,
        photoURL,
        ...additionalData,
      });
    } catch (error) {
      console.error("Error creating user document", error);
    }
  }
  return getUserDocument(user.uid);
};

const getUserDocument = async (uid) => {
  if (!uid) return null;
  try {
    const userDocument = await firestore.doc(`users/${uid}`).get();

    return {
      uid,
      ...userDocument.data(),
    };
  } catch (error) {
    console.error("Error fetching user", error);
  }
};
