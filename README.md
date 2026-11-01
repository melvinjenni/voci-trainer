# Voci Trainer

A playful web app to train French / English (and more) vocabulary — fast and easy.
All data is stored **locally in your browser** (IndexedDB). No account, works offline.

## Features (v0.1)

- **Text import** — paste a list, one card per line. Choose the separator (Tab, `=`, `;`, `/`, `,`, `-`
  or a custom one) or hit **auto-detect**. Live preview flags any lines that don’t split cleanly.
- **3-stage writing trainer** — every card climbs stage 1 → 3:
  1. **Recognize** — pick the right translation.
  2. **Type it (with hint)** — type the answer with the first letters shown.
  3. **Type it exactly 1:1** — type the answer exactly as imported.
  A correct answer moves the card up a stage; a wrong one drops it back a stage. All cards at
  stage 3 = deck mastered.
- **Swipe flashcards** — swipe right if you knew it, left if you didn’t (or use the buttons).
- **Games** — coming soon (match pairs, multiple choice, speed round).

## Run it

```bash
npm install
npm run dev      # open the printed http://localhost:5173 URL
```

Build for production / deploy (e.g. Vercel or Netlify):

```bash
npm run build    # output in dist/
npm run preview  # preview the production build locally
```

## Tech

React + TypeScript + Vite · Tailwind CSS · Framer Motion · Zustand + IndexedDB (idb-keyval).

## Roadmap

- Games (Phase 4).
- Optional login + cloud sync across devices.
- PDF import.
- Lenient matching toggle already exists in the store (`settings.lenient`); a settings screen to
  toggle it is planned.
