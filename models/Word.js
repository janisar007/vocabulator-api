const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  userMeaning: {
    type: String,
    default: ''
  },
  synonyms: [{
    word: String,
    meaning: String
  }],
  antonyms: [{
    word: String,
    meaning: String
  }],
  details: {
    actualMeaning: String,
    sentences: [String],
    oneWordSubstitutes: [String]
  },
  geminiData: {
    hindiMeaning: String,
    usageExamples: [String],
    learningTips: String,
    fetchedAt: Date
  },
  isInFlashcard: {
    type: Boolean,
    default: false
  },
  flashcardDate: Date
}, {
  timestamps: true
});

wordSchema.index({ user: 1, word: 1 });
wordSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Word', wordSchema);