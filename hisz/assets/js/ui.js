window.AQV = window.AQV || {};

AQV.qs = (sel, root=document) => root.querySelector(sel);
AQV.qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
AQV.getParam = (k) => new URLSearchParams(location.search).get(k);

AQV.toast = (msg) => {
  const el = AQV.qs("#toast");
  if(!el) return alert(msg);
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove("show"), 2400);
};

AQV.guard = async ({requireAuth=true, requireAdmin=false}={}) => {
  // If Firebase isn't configured yet, skip guards (dev-friendly)
  if(!window.firebase || !window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === "PASTE_ME"){
    return { user: null, admin: false, skipped: true };
  }

  const auth = firebase.auth();
  const user = await new Promise(resolve=>{
    const unsub = auth.onAuthStateChanged(u=>{ unsub(); resolve(u||null); });
  });

  if(requireAuth && !user){
    location.href = "login.html";
    return;
  }

  let admin = false;
  if(user && requireAdmin){
    const db = firebase.firestore();
    const snap = await db.collection("users").doc(user.uid).get();
    admin = !!snap.data()?.isAdmin;
    if(!admin){
      location.href = "espanel.html";
      return;
    }
  }
  return { user, admin };
};

AQV.signOut = async () => {
  if(window.firebase && firebase.auth){
    await firebase.auth().signOut();
  }
  localStorage.removeItem("aqv_last");
  location.href = "login.html";
};

AQV.saveLast = (obj) => localStorage.setItem("aqv_last", JSON.stringify(obj||{}));
AQV.loadLast = () => {
  try{ return JSON.parse(localStorage.getItem("aqv_last")||"{}"); } catch(e){ return {}; }
};
