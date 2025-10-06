// Seed initial data for rooms and badges (idempotent)
module.exports.up = async function up(db) {
  // Seed rooms data
  const rooms = [
    {
      name: "Celeb Gossip",
      description: "Latest celebrity drama, scandals, and tea from Hollywood and beyond",
      icon: "🌟",
      gradient: "gradient-primary",
      isTrending: true,
      memberCount: 12547,
      recentPostCount: 234,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      name: "Movies",
      description: "Honest reviews, hot takes, and discussions about the latest films",
      icon: "🎬",
      gradient: "gradient-accent",
      isTrending: true,
      memberCount: 8934,
      recentPostCount: 156,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      name: "Gaming",
      description: "Game reviews, industry news, and gaming community drama",
      icon: "🎮",
      gradient: "gradient-warm",
      isTrending: true,
      memberCount: 15623,
      recentPostCount: 312,
      lastActivity: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
    },
    {
      name: "Campus Tea",
      description: "University drama, professor gossip, and student life stories",
      icon: "🏫",
      gradient: "gradient-primary",
      isTrending: false,
      memberCount: 6789,
      recentPostCount: 189,
      lastActivity: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
    },
    {
      name: "Memes",
      description: "Viral content, internet culture, and meme reviews",
      icon: "😂",
      gradient: "gradient-accent",
      isTrending: false,
      memberCount: 9876,
      recentPostCount: 445,
      lastActivity: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
    },
    {
      name: "Music",
      description: "Artist drama, album reviews, and music industry tea",
      icon: "🎵",
      gradient: "gradient-warm",
      isTrending: false,
      memberCount: 5432,
      recentPostCount: 98,
      lastActivity: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
    },
    {
      name: "Fashion",
      description: "Style fails, designer drama, and fashion week gossip",
      icon: "👗",
      gradient: "gradient-primary",
      isTrending: false,
      memberCount: 4321,
      recentPostCount: 67,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      name: "Tech",
      description: "Silicon Valley drama, startup fails, and tech industry tea",
      icon: "💻",
      gradient: "gradient-accent",
      isTrending: false,
      memberCount: 7890,
      recentPostCount: 123,
      lastActivity: new Date(Date.now() - 6 * 60 * 1000) // 6 minutes ago
    }
  ];

  // Insert rooms if they don't exist
  for (const room of rooms) {
    try {
      await db.collection('rooms').updateOne(
        { name: room.name },
        { $setOnInsert: room },
        { upsert: true }
      );
    } catch (err) {
      console.warn(`Failed to seed room ${room.name}:`, err.message);
    }
  }

  // Seed badges data
  const badges = [
    {
      name: "Tea Connoisseur",
      description: "Spilled 50+ posts that got major reactions",
      icon: "☕",
      rarity: "rare",
      requirements: {
        postsRequired: 50,
        reactionsRequired: 1000
      },
      isActive: true
    },
    {
      name: "Gossip Guru",
      description: "Master of celebrity drama and hot takes",
      icon: "👑",
      rarity: "legendary",
      requirements: {
        postsRequired: 100,
        reactionsRequired: 5000,
        category: "Celeb Gossip"
      },
      isActive: true
    },
    {
      name: "Movie Buff",
      description: "Expert reviewer in Movies room",
      icon: "🎬",
      rarity: "common",
      requirements: {
        postsRequired: 25,
        category: "Movies"
      },
      isActive: true
    },
    {
      name: "Anonymous Legend",
      description: "Been active for 100+ days",
      icon: "👻",
      rarity: "legendary",
      requirements: {
        daysActive: 100
      },
      isActive: true
    },
    {
      name: "Gaming Guru",
      description: "Top contributor in Gaming room",
      icon: "🎮",
      rarity: "rare",
      requirements: {
        postsRequired: 75,
        category: "Gaming"
      },
      isActive: true
    },
    {
      name: "Campus Insider",
      description: "University drama expert",
      icon: "🏫",
      rarity: "common",
      requirements: {
        postsRequired: 30,
        category: "Campus Tea"
      },
      isActive: true
    }
  ];

  // Insert badges if they don't exist
  for (const badge of badges) {
    try {
      await db.collection('badges').updateOne(
        { name: badge.name },
        { $setOnInsert: badge },
        { upsert: true }
      );
    } catch (err) {
      console.warn(`Failed to seed badge ${badge.name}:`, err.message);
    }
  }
};

module.exports.down = async function down(db) {
  // Remove seeded data
  await db.collection('rooms').deleteMany({});
  await db.collection('badges').deleteMany({});
};
