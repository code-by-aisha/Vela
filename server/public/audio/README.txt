VELA — Music Audio Folder
═══════════════════════════════════════════════════════════════

HOW TO ADD YOUR OWN SONGS
──────────────────────────

Step 1: Drop your audio file here
  Supported: .mp3  .wav  .ogg  .m4a
  Example:   pasoori_original.mp3

Step 2: Add it to the database
  Option A — Single track:
    • Open  server/scripts/add-track.js
    • Edit the TRACK object with title, artist, genre, audioUrl
    • Run:  node scripts/add-track.js

  Option B — Scan all new files at once:
    • Drop all your files here
    • Run:  node scripts/scan-audio.js
    • This auto-creates placeholder records for every new file
    • Then edit titles/artists in MongoDB or via Option A

Step 3: Done!
  The song appears in the VELA music selector immediately.
  No server restart needed.

TIPS
────
• File names can be anything: "Pasoori.mp3", "my_song.wav", etc.
• The audioUrl in the DB must match exactly:
    filename  →  /audio/filename.mp3
• Keep files under 20MB for fast loading
• 128kbps MP3 sounds great and loads fastest

CURRENT FILES IN THIS FOLDER
──────────────────────────────
arzu.wav          — Arzu (Asim Azhar style, Sufi 85bpm)
obvious.wav       — Obvious (Hasan Raheem style, Desi 92bpm)
noor.wav          — Noor (Noor Khan style, Urdu 80bpm)
pasoori.wav       — Pasoori (Coke Studio style, Desi 90bpm)
raat_bhar.wav     — Raat Bhar (Hasan Raheem style, Lofi 75bpm)
dil_da.wav        — Dil Da (AP Dhillon style, Punjabi 88bpm)
teray_bin.wav     — Teray Bin (Atif Aslam style, Ballad 72bpm)
kho_gaye.wav      — Kho Gaye Hum Kahan (Indie 95bpm)
mahiye.wav        — Mahiye (Arjan Dhillon style, Bhangra 105bpm)
lofi_chai.wav     — Late Night Chai (Lofi 70bpm)
street_lights.wav — Street Lights (Hip-Hop 88bpm)
golden_haze.wav   — Golden Haze (R&B 90bpm)
cosmic.wav        — Cosmic Drift (Ambient 78bpm)
desi_nights.wav   — Desi Nights (Bhangra Club 100bpm)
vibe_check.wav    — Vibe Check (Dance 96bpm)
neon_room.wav     — Neon Room (Bedroom Pop 85bpm)
karachi.wav       — Karachi Nights (EDM 110bpm)
kahaani.wav       — Kahaani (Acoustic 68bpm)
digital_raag.wav  — Digital Raag (Electronic Sufi 82bpm)
metro_pulse.wav   — Metro Pulse (Trap 100bpm)

Replace any of these with the real licensed audio file of the
same name and it will play instantly — no code changes needed.
