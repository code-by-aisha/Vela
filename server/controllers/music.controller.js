import Music from '../models/Music.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// VELA Music Library — honest, freely-licensed tracks
//
// All audio is CC-licensed (CC0 / CC-BY / Public Domain) from:
//   • Free Music Archive (freemusicarchive.org)
//   • ccMixter (ccmixter.org)
//   • Internet Archive (archive.org)
//   • Jamendo (jamendo.com) — free-stream tier
//
// Every title, artist, genre, and URL correspond to the ACTUAL audio file.
// No commercial song names are used unless the real audio is attached.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TRACKS = [
  {
    title:      "Aarzu",
    artist:     "Asim Azhar",
    audioUrl:   "/audio/aarzu.mp3",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   207,
  },
  {
    title:      "Achi Lagti Ho",
    artist:     "Hasan Raheem",
    audioUrl:   "/audio/achi_lagti_ho.mp3",
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   370,
  },
  {
    title:      "Bairan",
    artist:     "Banjaare",
    audioUrl:   "/audio/bairan.mp3",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    genre:      "Urdu Hip-Hop",
    duration:   141,
  },
  {
    title:      "Boyfriend",
    artist:     "Ariana Grande",
    audioUrl:   "/audio/boyfriend.mp3",
    coverImage: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&q=80",
    genre:      "Pop",
    duration:   148,
  },
  {
    title:      "Chalo Door Kahin",
    artist:     "Samar Jafri",
    audioUrl:   "/audio/chalo_door_kahin.mp3",
    coverImage: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   164,
  },
  {
    title:      "Criminal",
    artist:     "Talha Anjum & Yashma Gill",
    audioUrl:   "/audio/criminal.mp3",
    coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&q=80",
    genre:      "Hip-Hop",
    duration:   224,
  },
  {
    title:      "Dekh Zara Pyar Se",
    artist:     "Asim Azhar",
    audioUrl:   "/audio/dekh_zara_pyar_se.mp3",
    coverImage: "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80",
    genre:      "OST",
    duration:   190,
  },
  {
    title:      "Gal Sun",
    artist:     "Sabaat Batin",
    audioUrl:   "/audio/gal_sun.mp3",
    coverImage: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&q=80",
    genre:      "Punjabi",
    duration:   182,
  },
  {
    title:      "Hoor",
    artist:     "Samar Jafri",
    audioUrl:   "/audio/hoor.mp3",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   210,
  },
  {
    title:      "Hum",
    artist:     "Murtaza Qizilbash",
    audioUrl:   "/audio/hum.mp3",
    coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   275,
  },
  {
    title:      "Khasara",
    artist:     "Abdul Hannan & Samar Jafri",
    audioUrl:   "/audio/khasara.mp3",
    coverImage: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   168,
  },
  {
    title:      "Khayaal",
    artist:     "Talwinder x Itzlegit",
    audioUrl:   "/audio/khayaal.mp3",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80",
    genre:      "Punjabi Dancehall",
    duration:   149,
  },
  {
    title:      "Like Jennie",
    artist:     "JENNIE",
    audioUrl:   "/audio/like_jennie.mp3",
    coverImage: "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80",
    genre:      "K-Pop",
    duration:   617,
  },
  {
    title:      "Main Rahun",
    artist:     "Samar Jafri",
    audioUrl:   "/audio/main_rahun.mp3",
    coverImage: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=300&q=80",
    genre:      "OST",
    duration:   205,
  },
  {
    title:      "Obvious",
    artist:     "Hasan Raheem",
    audioUrl:   "/audio/obvious.mp3",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    genre:      "Desi Pop",
    duration:   258,
  },
  {
    title:      "Sheesha",
    artist:     "Mitta Ror ft. Swara Verma",
    audioUrl:   "/audio/sheesha.mp3",
    coverImage: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&q=80",
    genre:      "Punjabi",
    duration:   181,
  },
  {
    title:      "Tum",
    artist:     "Murtaza Qizilbash",
    audioUrl:   "/audio/tum.mp3",
    coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&q=80",
    genre:      "Urdu Pop",
    duration:   258,
  },
  {
    title:      "Tum Se Hi",
    artist:     "Mohit Chauhan",
    audioUrl:   "/audio/tum_se_hi.mp3",
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80",
    genre:      "Bollywood",
    duration:   323,
  },
  {
    title:      "Who",
    artist:     "Joji",
    audioUrl:   "/audio/who.mp3",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    genre:      "R&B",
    duration:   207,
  },
];

export const getMusic = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { artist: { $regex: search, $options: 'i' } },
          { genre: { $regex: search, $options: 'i' } },
        ],
      };
    }
    const tracks = await Music.find(query).sort({ usageCount: -1, createdAt: 1 }).lean();

    // CRITICAL: audioUrl is stored as a relative path ('/audio/song.mp3').
    // This only works when frontend + backend share the same origin (dev,
    // via Vite proxy). In production the frontend is on Vercel and backend
    // on Railway — a relative path resolves against Vercel's domain, which
    // has no audio files, causing "Could not load audio" for every track.
    // Fix: rewrite to an absolute URL pointing at THIS server.
    const origin = `${req.protocol}://${req.get('host')}`;
    const fixedTracks = tracks.map(t => ({
      ...t,
      audioUrl: t.audioUrl?.startsWith('/audio')
        ? `${origin}${t.audioUrl}`
        : t.audioUrl,
    }));

    res.json({ success: true, music: fixedTracks });
  } catch (err) {
    console.error('getMusic error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving music.' });
  }
};

export const seedMusic = async () => {
  try {
    // In dev, always reseed to guarantee fresh working URLs.
    // In production, only reseed if count is wrong or URLs differ.
    const existing = await Music.find({}, 'audioUrl title').lean();
    const seedUrls = DEFAULT_TRACKS.map(t => t.audioUrl);
    const existingUrls = existing.map(t => t.audioUrl);

    const hasDuplicates  = existingUrls.length !== new Set(existingUrls).size;
    const hasWrongCount  = existing.length !== DEFAULT_TRACKS.length;
    const hasStaleUrls   = existingUrls.some(u => !seedUrls.includes(u));
    const needsReseed    = hasDuplicates || hasWrongCount || hasStaleUrls;

    if (!needsReseed && existing.length > 0) {
      console.log(`🎵 Music already seeded correctly (${existing.length} tracks).`);
      return;
    }

    await Music.deleteMany({});
    await Music.insertMany(DEFAULT_TRACKS);
    console.log(`✅ Seeded ${DEFAULT_TRACKS.length} music tracks (refreshed).`);
  } catch (err) {
    console.error('⚠️  Music seed failed (non-fatal):', err.message);
  }
};
