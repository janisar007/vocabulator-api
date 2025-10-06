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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocab-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));


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