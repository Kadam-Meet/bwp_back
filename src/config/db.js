const mongoose = require('mongoose');

let isConnecting = false;
let cachedConnection = null;

function getMongoUri() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
  return uri;
}

function getMaskedMongoUri(uri) {
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const protocol = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const maskedAuth = url.username ? `${url.username}:***@` : '';
    const dbName = url.pathname && url.pathname !== '/' ? url.pathname : '';
    return `${protocol}${maskedAuth}${url.host}${dbName}`;
  } catch (_) {
    return '[masked-uri]';
  }
}

async function connectOnce() {
  if (cachedConnection) return cachedConnection;
  if (isConnecting) return mongoose.connection;
  isConnecting = true;

  const mongoUri = getMongoUri();
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  cachedConnection = mongoose.connection;
  return cachedConnection;
}

async function connectWithRetry({ retryDelayMs = 2000 } = {}) {
  console.log(`\n🗄️ ===== DATABASE CONNECTION =====`);
  console.log(`🗄️ [URI] ${getMaskedMongoUri(getMongoUri())}`);
  console.log(`🗄️ [RETRY_DELAY] ${retryDelayMs}ms`);
  console.log(`🗄️ ================================\n`);
  
  let attemptCount = 0;
  // Keep trying until success
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attemptCount++;
    try {
      console.log(`🔄 [DB] Connection attempt #${attemptCount}`);
      const conn = await connectOnce();
      console.log('✅ [DB] Connected to MongoDB successfully');
      console.log('✅ [DB] Connection state:', mongoose.connection.readyState);
      console.log('✅ [DB] Database name:', mongoose.connection.db.databaseName);
      console.log('✅ [DB] Host:', mongoose.connection.host);
      console.log('✅ [DB] Port:', mongoose.connection.port);
      
      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        console.log('🔗 [DB] Mongoose connected to MongoDB');
      });
      
      mongoose.connection.on('error', (err) => {
        console.log('❌ [DB] Mongoose connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('🔌 [DB] Mongoose disconnected from MongoDB');
      });
      
      return conn;
    } catch (err) {
      console.log(`❌ [DB] Connection attempt #${attemptCount} failed:`, err.message);
      console.log(`❌ [DB] Full error:`, err);
      console.log(`⏳ [DB] Retrying in ${retryDelayMs}ms...`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
}

function getMongooseConnection() {
  return mongoose.connection;
}

module.exports = {
  connectWithRetry,
  getMongooseConnection,
};


