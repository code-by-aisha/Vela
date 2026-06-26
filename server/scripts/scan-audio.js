/**
 * VELA — Auto-scan audio folder and add new files to music library
 * ────────────────────────────────────────────────────────────────
 * Run:  node scripts/scan-audio.js
 *
 * This scans server/public/audio/ and adds any files NOT yet in
 * the database as placeholder tracks. You can then edit the titles
 * and artists from the VELA admin or directly in MongoDB.
 *
 * Files already in the DB are skipped (no duplicates).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Music from '../models/Music.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
const SUPPORTED = ['.mp3', '.wav', '.ogg', '.m4a'];

// Cover images to rotate through for new tracks
const COVERS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&q=80',
  'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&q=80',
];

function prettify(filename) {
  // "arzu_asim_azhar.mp3" → "Arzu Asim Azhar"
  return filename
    .replace(/\.[^.]+$/, '')    // remove extension
    .replace(/[-_]/g, ' ')       // dashes/underscores → spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`Audio folder not found: ${AUDIO_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(AUDIO_DIR)
    .filter(f => SUPPORTED.includes(path.extname(f).toLowerCase()));

  console.log(`Found ${files.length} audio files in public/audio/\n`);

  let added = 0, skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const audioUrl = `/audio/${file}`;

    const exists = await Music.findOne({ audioUrl });
    if (exists) {
      console.log(`  ⏭  Skipped (already in DB): ${file}`);
      skipped++;
      continue;
    }

    const name = prettify(file);
    const track = {
      title:      name,
      artist:     'Unknown Artist',   // edit this later
      genre:      'Uncategorized',
      duration:   180,                // placeholder — edit if needed
      audioUrl,
      coverImage: COVERS[i % COVERS.length],
    };

    await Music.create(track);
    console.log(`  ✅ Added: "${name}"  →  ${audioUrl}`);
    added++;
  }

  console.log(`\nDone! ${added} added · ${skipped} skipped`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
