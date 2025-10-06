const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/words', require('./routes/words'));
app.use('/api/flashcards', require('./routes/flashcards'));

const MONGO_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    });
  }
  cached.conn = await cached.promise;
  console.log("✅ MongoDB connected");
  return cached.conn;
}

// Call inside async function
(async () => {
  try {
    await connectToDatabase();
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
})();



module.exports = app;
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));