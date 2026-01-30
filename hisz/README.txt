AquiVivo Español — baza aplikacji (statyczne HTML + Firebase)

FLOW:
- login.html -> espanel.html (panel) -> course.html -> lessonpage.html / ejercicio.html
- admin.html (panel admina w osobnym pliku)

KOLORY:
- assets/css/styles.css (flaga Hiszpanii: czerwony + żółty)

FIREBASE:
- Wklej config w assets/js/firebase.js
- Włącz Email/Password w Authentication
- Firestore: kolekcje: users, levels, topics, lessons, exercises

ROLA ADMINA:
- Po rejestracji user ma isAdmin=false.
- Ustaw isAdmin=true w dokumencie users/{uid} w Firestore (ręcznie),
  żeby wejść do admin.html

SEED:
- Jeśli baza pusta, aplikacja próbuje zasilić levels/topics + demo lekcję.

UWAGA:
- Gdy Firebase nie jest skonfigurowany, strony działają w trybie demo (bez auth).
