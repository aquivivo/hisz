window.AQV = window.AQV || {};

AQV.authInit = async () => {
  if(!window.firebase || !window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === "PASTE_ME"){
    AQV.toast("Firebase no configurado aún. Conecta tu proyecto para activar login.");
    return null;
  }
  if(!firebase.apps.length){
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  return firebase.auth();
};

AQV.login = async (email, password) => {
  const auth = await AQV.authInit();
  if(!auth) return;
  await auth.signInWithEmailAndPassword(email, password);
};

AQV.register = async (email, password) => {
  const auth = await AQV.authInit();
  if(!auth) return;
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  // Optional: send email verification
  try{ await cred.user.sendEmailVerification(); }catch(e){}
  // Create user profile
  const db = firebase.firestore();
  await db.collection("users").doc(cred.user.uid).set({
    email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    isAdmin: false,
    lang: "es"
  }, { merge: true });
};

AQV.resetPassword = async (email) => {
  const auth = await AQV.authInit();
  if(!auth) return;
  await auth.sendPasswordResetEmail(email);
};
