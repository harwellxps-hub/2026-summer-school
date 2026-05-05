# HarwellXPS School 2026 — Companion App

## Setup (first time only)
```
npm install
npm start
```

---

## Complete folder structure

```
harwellxps-electron/
├── main.js              ← never touch
├── preload.js           ← never touch
├── package.json         ← never touch
├── index.html           ← app UI
├── handbook.html        ← handbook (drop in when ready)
│
├── assets/
│   ├── slides/
│   │   ├── thu_beam_damage/          ← single deck: images go directly here
│   │   │   ├── slide_01.jpg
│   │   │   └── slide_02.jpg
│   │   └── fri_overlapping/          ← multiple decks: one subfolder per tutor
│   │       ├── mark_isaacs/
│   │       │   └── slide_01.jpg
│   │       └── david_morgan/
│   │           └── slide_01.jpg
│   │
│   ├── tools/                        ← self-contained HTML artefacts
│   │   ├── esca_game.html
│   │   ├── periodic_table.html
│   │   └── wagner_plot.html
│   │
│   └── handbook/                     ← handbook figures (optional)
│       └── section_1/
│           └── fig_01.jpg
│
└── content/
    ├── sessions.json
    ├── tutors.json
    ├── resources.json
    ├── config.json
    └── documents/
        ├── beam_damage.json         ✓ done
        ├── quant_challenge.json     ✓ done
        └── doublets.json            ← add when ready
```

---

## Adding content — no code changes needed

### Slides (single deck)
Drop JPEGs into `assets/slides/<session-id>/`
Use zero-padded filenames: slide_01.jpg, slide_02.jpg

### Slides (multiple decks — shared sessions)
Create named subfolders. The folder name becomes the button label.
```
assets/slides/fri_overlapping/
  mark_isaacs/     → button "Slides — Mark Isaacs"
  anna_regoutz/    → button "Slides — Anna Regoutz"
```

### Challenge document
Create `content/documents/<documentId>.json`:
```json
{
  "title": "Challenge Title",
  "sections": [
    { "title": "Overview", "body": "Text here." },
    { "title": "Task 1A",  "body": "Instructions." }
  ]
}
```

### HTML tool/game
Drop `.html` file into `assets/tools/`, then add to sessions.json:
```json
{ "id": "mon_beg_theory", ..., "tools": ["periodic_table"] }
```
Filename without extension must match the tool ID.

### New session
Add entry to `content/sessions.json`. Done.

### Handbook
Drop `handbook.html` into the root folder.
The Resources > Electronic Handbook button opens it full-screen automatically.

---

## Converting PPTX → slide images (Windows)

1. Install LibreOffice: https://www.libreoffice.org
2. Install Poppler: https://github.com/oschwartz10612/poppler-windows/releases (add to PATH)

```powershell
$session = "thu_beam_damage"
& "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf MySlides.pptx
mkdir assets\slides\$session
pdftoppm -jpeg -r 150 -jpegopt quality=82 MySlides.pdf assets\slides\$session\slide
```

Or export directly from PowerPoint: File → Export → Change file type → JPEG.

---

## Building installers

```bash
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
```
