# Aplikacja webowa do rekomendacji gier

Aplikacja webowa stworzona w ramach pracy licencjackiej, która personalizuje propozycje gier wideo na podstawie preferencji użytkownika oraz jego historii grania.

## 🚀 O projekcie

Aplikacja analizuje dane wprowadzone przez użytkownika i sugeruje 10 tytułów najlepiej dopasowanych do jego gustu. Mechanizm rekomendacji działa lokalnie po stronie klienta.

### Główne funkcje:
* **Personalizacja:** Rekomendacje oparte na ulubionych gatunkach, tematyce, posiadanych konsolach oraz preferowanej długości rozgrywki.
* **Historia grania:** System bierze pod uwagę gry, w które użytkownik już grał, czas poświęcony na rozgrywkę oraz oceny w skali 1-5.
* **Baza danych gier:** Integracja z danymi pochodzącymi z serwisu **IGDB**.
* **Autoryzacja:** Bezpieczne logowanie i rejestracja użytkowników.

## 🛠️ Technologie

* **Frontend:** React + TypeScript + Vite
* **Baza danych:** Firebase Firestore
* **Autoryzacja:** Firebase Authentication
* **Stylizacja:** Tailwind CSS + daisyUI
