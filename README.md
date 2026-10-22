# Cismo

A small website that helps Iker through a craving for a cigarette. Alpha built
it on 2026-10-21, because Iker asked: "when I crave a cigarette, the app must
help me not smoke". Text only, no voice (Iker, 2026-10-21). The page is in
Vietnamese.

The page is on GitHub Pages: https://programever.github.io/cismo/ . It only
works with Iker's own link, which has a secret key after the `#`. Without the
key the page shows nothing.

## What it does

- **Home.** How long since the last cigarette, how many cravings Iker beat
  today and in total, one big button "Tôi đang thèm thuốc" (I crave a
  cigarette), and one reason at a time with a small picture. "↻ Lý do khác"
  shows another one, in random order: every reason comes once before any comes
  again (Iker, 2026-10-21: random, many, quotes, pictures, a button). "Xem tất
  cả lý do" opens the whole list. A small link at the bottom records a
  cigarette smoked outside a craving session (it asks first).
- **The 5-minute session.** A craving is strongest for a few minutes, then it
  fades. The session fills those minutes:
  1. Slow breathing for 2 minutes: a circle grows for 4 seconds (breathe in)
     and shrinks for 6 seconds (breathe out).
  2. A glass of water (30 seconds).
  3. Moving for 2 minutes: stairs, push-ups or a fast walk.
  4. Iker's reasons.
  A random reason is shown under every step and changes every 20 seconds, or
  at once with "↻ Lý do khác". "Bước tiếp" skips to
  the next step. "Dừng" goes straight to the question.
- **The question.** "Did it pass?" Iker chooses: it passed (one craving
  beaten), 5 more minutes, or "I smoked". "I smoked" is only written down, never
  judged, and the counter starts again. "Close" records nothing.
- The screen stays on during a session.

## The data

The data lives in the same Firestore database (Google's online database) as
Haba and Trani: project `habits-433f8`. Everything is under Iker's secret key:

- `cismo/{key}/events/{id}` = `{"t": "2026-10-21T22:10:05+07:00", "kind": "won"}`
  or `"kind": "smoked"`.
- `cismo/{key}/reasons/{id}` = `{"text": "...", "n": 1}`. Iker's personal
  reasons, written by Alpha (Iker asked Alpha to choose them). They are mixed
  with the general reasons in `src/reasons.ts`.

The key is never in this code or in git. On Alpha's box it is `CISMO_KEY` in
the one `.env` file. The page remembers the key on the phone after the first
visit, so the home-screen icon also works.

The Firebase config block at the top of `src/app.ts` is public by design. What
protects the data is the set of rules in the Firebase console (Firestore
Database, Rules tab). Haba, Trani and Cismo share one set of rules, so **always
paste the whole block below**, never only one part. The same block is in the
READMEs of all three apps; keep them the same.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /records/{id} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['t', 'item'])
        && request.resource.data.t is string
        && request.resource.data.t.size() == 25
        && request.resource.data.item in ['core', 'jog', 'read', 'meditate', 'kid', 'wife', 'spend', 'drink', 'work', 'problem', 'happy', 'normal', 'sad'];
      allow delete: if true;
      allow update: if false;
    }
    match /trani/{day} {
      allow read: if true;
      allow create, update: if day.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        && request.resource.data.keys().hasOnly(['day', 'feel'])
        && request.resource.data.day == day
        && (!('feel' in request.resource.data) || request.resource.data.feel in ['easy', 'ok', 'hard', 'cramp']);
      allow delete: if true;
    }
    match /cismo/{key}/events/{id} {
      allow read, delete: if key.size() >= 20;
      allow create: if key.size() >= 20
        && request.resource.data.keys().hasOnly(['t', 'kind'])
        && request.resource.data.t is string
        && request.resource.data.t.size() == 25
        && request.resource.data.kind in ['won', 'smoked'];
      allow update: if false;
    }
    match /cismo/{key}/reasons/{id} {
      allow read, delete: if key.size() >= 20;
      allow create: if key.size() >= 20
        && request.resource.data.keys().hasOnly(['text', 'n'])
        && request.resource.data.text is string
        && request.resource.data.text.size() <= 300
        && request.resource.data.n is int;
      allow update: if false;
    }
  }
}
```

In plain words, for Cismo: whoever has a key of at least 20 letters can read,
add and delete the records under that key. Records cannot be changed. Nobody
can list the keys, so without the link nobody can find the data.

## Haba mark

"I smoked" also marks Problem in Haba, once per day (Iker, 2026-10-21). Like
everything here, it is only written down, never judged. The code is
`src/haba-mark.ts`, a copy of `haba/shared/haba-mark.ts`. The browser test
fakes Haba, so it never writes to Iker's real habit data.

## Files

| File | What it is |
|---|---|
| `src/index.html` | The page: home, session, question. |
| `src/style.css` | The look. Light and dark mode. |
| `src/flow.ts` | The session steps, the breathing timing, the counting. No browser things, so it can be tested with node. |
| `src/reasons.ts` | The general reasons (health facts with their source, the race, family, quotes and sayings), the pictures, and the random order. Nothing personal: Iker's own reasons are in Firestore. |
| `src/app.ts` | The page logic: the key, Firestore, the session timer, the buttons. |
| `src/manifest.webmanifest`, `src/icon*` | Home-screen icon and app name. |
| `test/flow.test.ts` | Tests for `flow.ts`. |
| `test/browser.test.ts` | Test of the whole page in a headless browser against the real database, with a throwaway key. It deletes its records at the end. |
| `build.mjs` | The build: bundles `src/app.ts` with Firebase into `dist/app.js`, copies the static files. |
| `.github/workflows/deploy.yml` | Build and deploy on every push to `main`. |

## Build and deploy

Every push to `main` runs the workflow in `.github/workflows/deploy.yml` on
GitHub's machines: install, type-check, tests, build, then push `dist/` to the
`gh-pages` branch as one fresh commit. GitHub Pages serves that branch.

```
npm install            # once
npm test               # type-check and flow tests
npm run build          # makes dist/
npm run serve          # opens dist/ on http://127.0.0.1:8768 (add #KEY to the address)
npm run test:browser   # needs: npx playwright install chromium
```

`main` is kept as one squashed commit, like Haba and Trani, and `gh-pages` is
rebuilt as one fresh commit on every deploy. Both are force-pushed. That is
fine here: the repo is small and only Alpha writes to it.

## Rules of the counting

- A day starts at 04:00, not at midnight, like Haba.
- "Time without smoking" counts from the last cigarette. With no cigarette
  recorded yet, it counts from the first record.
