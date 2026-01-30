/**
 * Data contracts (Firestore)
 *
 * collections:
 * - levels: { code:"A1", title:"A1", order:1 }
 * - topics: { level:"A1", slug:"saludos", title:"Saludos y presentaciones", kind:"gramatica"|"vocab", order:1, published:true }
 * - lessons: { level:"A1", topicSlug:"saludos", html:"<h2>..</h2>", updatedAt:..., published:true }
 * - exercises: { level:"A1", topicSlug:"saludos", order:1, type:"choice"|"fill", prompt:"...", options:[...], answer:"...", explanation:"..." }
 * - progress: docId = userId_level_topicSlug -> { userId, level, topicSlug, lessonSeen:true, exerciseDoneCount:3, updatedAt:... }
 */

window.AQV = window.AQV || {};

AQV.db = async () => {
  if(!window.firebase || !window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === "PASTE_ME"){
    return null;
  }
  if(!firebase.apps.length){
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  return firebase.firestore();
};

AQV.seedIfEmpty = async () => {
  const db = await AQV.db();
  if(!db) return;

  const levelsSnap = await db.collection("levels").limit(1).get();
  if(!levelsSnap.empty) return;

  const batch = db.batch();
  const levels = [
    { code:"A1", title:"A1 — Principiante", order:1 },
    { code:"A2", title:"A2 — Básico", order:2 },
    { code:"B1", title:"B1 — Intermedio", order:3 },
  ];
  levels.forEach(l=>{
    batch.set(db.collection("levels").doc(l.code), l, { merge:true });
  });

  const topics = [
    { level:"A1", slug:"saludos", title:"Saludos y presentaciones", kind:"vocab", order:1, published:true },
    { level:"A1", slug:"ser-estar", title:"Ser vs estar", kind:"gramatica", order:2, published:true },
    { level:"A1", slug:"numeros", title:"Números y edades", kind:"vocab", order:3, published:true },
  ];
  topics.forEach(t=>{
    const id = `${t.level}_${t.slug}`;
    batch.set(db.collection("topics").doc(id), t, { merge:true });
  });

  const demoLesson = {
    level:"A1",
    topicSlug:"saludos",
    published:true,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    html: `
      <h2 style="margin: 18px 0 10px; color:var(--yellow);">🎯 Objetivo</h2>
      <div style="color:rgba(255,255,255,.86); line-height:1.65">
        Después de esta lección podrás:
        <br>• Presentarte en español
        <br>• Preguntar “¿cómo estás?”
        <br>• Despedirte de forma natural
      </div>

      <h2 style="margin: 18px 0 10px; color:var(--yellow);">🧠 Vocabulario clave</h2>
      <div class="card" style="margin:10px 0; background:rgba(255,255,255,.06);">
        <div style="display:grid; gap:10px">
          <div><b>Hola</b> — Cześć / Witaj</div>
          <div><b>Buenos días</b> — Dzień dobry (rano)</div>
          <div><b>¿Cómo estás?</b> — Jak się masz?</div>
          <div><b>Encantado/a</b> — Miło mi</div>
          <div><b>Hasta luego</b> — Do zobaczenia</div>
        </div>
      </div>

      <h2 style="margin: 18px 0 10px; color:var(--yellow);">🗣️ Mini diálogo</h2>
      <div class="card" style="margin:10px 0; background:rgba(255,255,255,.06);">
        <div style="line-height:1.7">
          <b>A:</b> Hola, me llamo Ana. ¿Y tú?<br>
          <b>B:</b> Hola, soy Tom. Encantado.<br>
          <b>A:</b> Igualmente. ¿Cómo estás?<br>
          <b>B:</b> Muy bien, gracias. ¿Y tú?<br>
          <b>A:</b> Bien. Hasta luego.<br>
          <b>B:</b> ¡Chao!
        </div>
      </div>
    `
  };
  batch.set(db.collection("lessons").doc("A1_saludos"), demoLesson, { merge:true });

  await batch.commit();
};

AQV.listLevels = async () => {
  const db = await AQV.db(); if(!db) return [];
  const snap = await db.collection("levels").orderBy("order").get();
  return snap.docs.map(d=>d.data());
};

AQV.listTopics = async (level) => {
  const db = await AQV.db(); if(!db) return [];
  const snap = await db.collection("topics").where("level","==",level).orderBy("order").get();
  return snap.docs.map(d=>d.data());
};

AQV.getLesson = async ({level, topicSlug}) => {
  const db = await AQV.db(); if(!db) return null;
  const docId = `${level}_${topicSlug}`;
  const doc = await db.collection("lessons").doc(docId).get();
  return doc.exists ? doc.data() : null;
};

AQV.saveLesson = async ({level, topicSlug, html, published}) => {
  const db = await AQV.db(); if(!db) return;
  const docId = `${level}_${topicSlug}`;
  await db.collection("lessons").doc(docId).set({
    level, topicSlug,
    html,
    published: !!published,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge:true });
};

AQV.listExercises = async ({level, topicSlug}) => {
  const db = await AQV.db(); if(!db) return [];
  const snap = await db.collection("exercises")
    .where("level","==",level)
    .where("topicSlug","==",topicSlug)
    .orderBy("order")
    .get();
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
};

AQV.saveExercise = async ({level, topicSlug, order, type, prompt, options, answer, explanation}) => {
  const db = await AQV.db(); if(!db) return;
  const ref = db.collection("exercises").doc();
  await ref.set({
    level, topicSlug, order: Number(order)||1,
    type: type || "choice",
    prompt: prompt || "",
    options: Array.isArray(options) ? options : [],
    answer: answer || "",
    explanation: explanation || "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
};

AQV.deleteExercise = async (id) => {
  const db = await AQV.db(); if(!db) return;
  await db.collection("exercises").doc(id).delete();
};
