# AHP Engine - Decision Intelligence Tool

![AHP Engine Mockup](./assets/mockup.png)

![AHP Engine Banner](https://img.shields.io/badge/AHP-Engine-blue?style=for-the-badge&logo=react)
![Bun](https://img.shields.io/badge/Bun-v1.3.10-black?style=for-the-badge&logo=bun)

**AHP Engine** to zaawansowane narzędzie do wspierania procesów decyzyjnych oparte na metodzie **Analytic Hierarchy Process (AHP)**, opracowanej przez Thomasa L. Saaty'ego. Aplikacja pozwala na obiektywne porównanie wielu wariantów (alternatyw) na podstawie zestawu zdefiniowanych kryteriów, biorąc pod uwagę ich wagę oraz spójność logiczną ocen.

---

## 🚀 Główne Funkcje

- **Wieloetapowy Kreator Decyzji:** Intuicyjny proces od definicji struktury po finalny ranking.
- **Wsparcia dla Wielu Ekspertów:** Możliwość dodawania wielu decydentów i automatycznej agregacji ich opinii przy użyciu średniej geometrycznej.
- **Analiza Wrażliwości (Sensitivity Analysis):** Interaktywne suwaki w widoku wyników, pozwalające na dynamiczną zmianę wag kryteriów i obserwowanie zmian w rankingu w czasie rzeczywistym.
- **Porównywanie Parami (Pairwise Comparison):** Wykorzystanie skali Saaty'ego do precyzyjnego określania preferencji.
- **Automatyczna Konwersja Wartości:** Możliwość wpisania surowych danych (np. cena w PLN, waga w kg), które system automatycznie zamienia na relacje AHP.
- **Weryfikacja Spójności (Consistency Check):** Obliczanie współczynnika CR (Consistency Ratio) w czasie rzeczywistym, informujące czy dokonane oceny są logicznie spójne.
- **Generowanie Raportów PDF:** Profesjonalny eksport wyników, wliczając wagi, rankingi i statusy spójności.
- **Nowoczesne Wizualizacje:** Szyte na miarę komponenty SVG (wykresy słupkowe, pierścieniowe) z dynamicznymi animacjami.
- **Design Premium:** Interfejs typu *Glassmorphism* z rozmytymi tłami (backdrop-blur), płynnymi przejściami i pełną responsywnością.

---

## 🛠 Jak to działa? (Proces AHP)

### Krok 0: Eksperci
Zdefiniuj grupę osób podejmujących decyzję. System pozwoli każdemu ekspertowi na niezależną ocenę, a następnie wyciągnie matematyczny konsensus.

### Krok 1: Struktura
Zdefiniuj co chcesz ocenić (Alternatywy) oraz jakie czynniki są dla Ciebie istotne (Kryteria). Możesz określić kierunek kryterium:
- **MAX:** Im wyższa wartość, tym lepiej (np. jakość, wydajność).
- **MIN:** Im niższa wartość, tym lepiej (np. cena, czas dostawy).

### Krok 2: Macierz Kryteriów
Porównaj kryteria między sobą, określając który czynnik jest ważniejszy i w jakim stopniu. Możesz przeglądać oceny indywidualne lub wynik zagregowany.

### Krok 3: Ocena Alternatyw
Dla każdego kryterium oceń, jak wypadają poszczególne opcje. Możesz to zrobić manualnie (suwakami) lub wpisując konkretne wartości liczbowe z tabeli specyfikacji.

### Krok 4: Wyniki i Symulacja
System wykonuje syntezę wag i prezentuje ostateczny ranking. Wykorzystaj **Analizę Wrażliwości**, aby sprawdzić "co by było gdyby" (np. gdyby cena stała się dwa razy ważniejsza niż jakość).

---

## 🧮 Matematyka w tle

Silnik obliczeniowy (`ahpEngine.ts`) implementuje standardowy algorytm AHP:
1. **Agregacja GDM (Group Decision Making):** Wykorzystanie średniej geometrycznej do syntezy macierzy porównań wszystkich ekspertów.
2. **Budowa macierzy porównań** na podstawie suwaków (skala 1-9) lub relacji wartości liczbowych.
3. **Normalizacja kolumn** i wyliczanie średnich wierszowych w celu uzyskania wektora wag.
4. **Wyznaczanie współczynników CI i CR** w celu walidacji poprawności logicznej ocen.

---

## 💻 Stos Technologiczny

- **Framework:** [React 19](https://react.dev/)
- **Runtime:** [Bun](https://bun.sh/)
- **Stylizacja:** Tailwind CSS (v4)
- **Komponenty UI:** Radix UI / customowy system designu (Glassmorphism)
- **Raporty:** [html2pdf.js](https://github.com/eKoopmans/html2pdf.js/)
- **Ikony:** Lucide React
- **Animacje:** Tailwind transitions & CSS Keyframes

---

## ⚙️ Instalacja i Uruchomienie

Aby zainstalować zależności:
```bash
bun install
```

Aby uruchomić serwer deweloperski:
```bash
bun dev
```

Aby zbudować wersję produkcyjną:
```bash
bun run build
bun start
```

---

## 📁 Struktura Projektu

- `src/components/ahp/ahpEngine.ts` - Logika matematyczna (AHP, agragacja, konwersja danych).
- `src/components/ahp/AHPCalculator.tsx` - Główny silnik aplikacji (Wizard).
- `src/components/ahp/Step0-4` - Implementacja poszczególnych kroków procesu.
- `src/components/ahp/types.ts` - Definicje typów danych (Expert, ConsistencyResult, etc.).
- `src/styles/globals.css` - Definicje systemu designu i efektów szklanych surfaces.

---

*Wspieraj swoje decyzje nauką, nie tylko przeczuciem.*
