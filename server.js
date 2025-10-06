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

// MongoDB Connection with better configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocab-app';

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  bufferCommands: false, // Disable mongoose buffering
  // bufferMaxEntries: 0, // and MongoDB driver buffering
};

// Connection function with retry logic
const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('MongoDB Connected Successfully');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Initialize connection
connectWithRetry();


// Health check endpoint
app.get('/health', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ 
      status: 'success', 
      message: 'Server is healthy',
      database: 'connected'
    });
  } else {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database not connected',
      database: 'disconnected'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SSC CGL Vocab App API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));