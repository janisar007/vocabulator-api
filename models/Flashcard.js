const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  words: [{
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completed: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

flashcardSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);