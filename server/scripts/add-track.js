/**
 * VELA — Add Custom Music Track
 * ─────────────────────────────
 * HOW TO USE:
 *
 *  1. Drop your audio file into:  server/public/audio/your-song.mp3
 *  2. Edit the TRACK object below with the correct details
 *  3. Run:  npm run add-track   (from the server/ folder)
 *
 * The song appears in the music selector immediately (no server restart needed).
 * Supported formats: .mp3  .wav  .ogg  .m4a
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Music from '../models/Music.model.js';

// ── EDIT THIS BLOCK ───────────────────────────────────────────────────────────
const TRACK = {
  title:      "Your Song Title",
  artist:     "Artist Name",
  genre:      "Urdu Pop",
  duration:   210,                    // seconds — rough estimate is fine
  audioUrl:   "/audio/your-file.mp3", // filename inside server/public/audio/
  coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
};
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await Music.findOne({ audioUrl: TRACK.audioUrl });
  if (exists) {
    await Music.findByIdAndUpdate(exists._id, TRACK);
    console.log(`✅ Updated: "${TRACK.title}"`);
  } else {
    await Music.create(TRACK);
    console.log(`✅ Added: "${TRACK.title}" by ${TRACK.artist}`);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
