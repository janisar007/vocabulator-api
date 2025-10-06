const Word = require('../models/Word');
const Flashcard = require('../models/Flashcard');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.createWord = async (req, res) => {
  try {

    // Check if word already exists for this user
    const existingWord = await Word.findOne({ 
      user: req.user._id, 
      word: new RegExp(`^${req.body.word}$`, 'i') 
    });

    if (existingWord) {
      return res.status(400).json({
        status: 'error',
        message: 'Word already exists in your vocabulary'
      });
    }

    const wordData = {
      ...req.body,
      user: req.user._id
    };

    const word = await Word.create(wordData);

    res.status(201).json({
      status: 'success',
      data: { word }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAllWords = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user._id };

    if (search) {
      query.word = { $regex: search, $options: 'i' };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const words = await Word.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Word.countDocuments(query);

    res.json({
      status: 'success',
      data: { words },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateWord = async (req, res) => {
  try {
    const word = await Word.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!word) {
      return res.status(404).json({
        status: 'error',
        message: 'Word not found'
      });
    }

    res.json({
      status: 'success',
      data: { word }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteWord = async (req, res) => {
  try {
    const word = await Word.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!word) {
      return res.status(404).json({
        status: 'error',
        message: 'Word not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Word deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};


exports.getGeminiData = async (req, res) => {
  try {
    const word = await Word.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!word) {
      return res.status(404).json({
        status: 'error',
        message: 'Word not found'
      });
    }

    const prompt = `
      For the English word "${word.word}" which is important for SSC CGL exam preparation, provide:
      
      1. Hindi meaning (हिंदी अर्थ) - provide only the Hindi meaning without English translation
      2. 3 different and understandable usage examples in English sentences that are relevant for competitive exams
      3. Learning tips and tricks to remember this word quickly for SSC CGL exam
      
      Format the response as valid JSON without any markdown formatting:
      {
        "hindiMeaning": "string",
        "usageExamples": ["string1", "string2", "string3"],
        "learningTips": "string"
      }
      
      Important: Return only the JSON object, no additional text or explanations.
    `;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    // Simple extraction - look for JSON between curly braces
    const jsonStart = geminiText.indexOf('{');
    const jsonEnd = geminiText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in response');
    }

    const jsonString = geminiText.substring(jsonStart, jsonEnd);
    const geminiData = JSON.parse(jsonString);

    // Update word
    word.geminiData = {
      hindiMeaning: geminiData.hindiMeaning || '',
      usageExamples: Array.isArray(geminiData.usageExamples) ? geminiData.usageExamples.slice(0, 3) : [],
      learningTips: geminiData.learningTips || '',
      fetchedAt: new Date()
    };
    
    await word.save();

    res.json({
      status: 'success',
      data: { word }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.addToFlashcard = async (req, res) => {
  try {
    const { date } = req.body;
    const wordId = req.params.id;

    const word = await Word.findOne({
      _id: wordId,
      user: req.user._id
    });

    if (!word) {
      return res.status(404).json({
        status: 'error',
        message: 'Word not found'
      });
    }

    // Parse the date or use today's date
    const flashcardDate = date ? new Date(date) : new Date();
    flashcardDate.setHours(0, 0, 0, 0);

    // Find or create flashcard for the specified date
    let flashcard = await Flashcard.findOne({
      user: req.user._id,
      date: flashcardDate
    });

    if (!flashcard) {
      flashcard = await Flashcard.create({
        user: req.user._id,
        date: flashcardDate,
        words: [],
        title: `Flashcards - ${flashcardDate.toLocaleDateString()}`
      });
    }

    // Check if word already exists in this flashcard
    const wordExists = flashcard.words.some(w => 
      w.word.toString() === wordId
    );

    if (!wordExists) {
      flashcard.words.push({ word: wordId });
      await flashcard.save();
    }

    // Populate the flashcard with word details
    await flashcard.populate({
      path: 'words.word',
      model: 'Word'
    });

    res.json({
      status: 'success',
      data: { flashcard }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.removeFromFlashcard = async (req, res) => {
  try {
    const { date } = req.body;
    const wordId = req.params.id;

    const flashcardDate = date ? new Date(date) : new Date();
    flashcardDate.setHours(0, 0, 0, 0);

    const flashcard = await Flashcard.findOne({
      user: req.user._id,
      date: flashcardDate
    });

    if (!flashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found for the specified date'
      });
    }

    // Remove word from flashcard
    flashcard.words = flashcard.words.filter(w => 
      w.word.toString() !== wordId
    );

    await flashcard.save();
    
    // Populate after update
    await flashcard.populate({
      path: 'words.word',
      model: 'Word'
    });

    res.json({
      status: 'success',
      data: { flashcard }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getWordFlashcards = async (req, res) => {
  try {
    const wordId = req.params.id;

    const flashcards = await Flashcard.find({
      user: req.user._id,
      'words.word': wordId
    })
    .populate({
      path: 'words.word',
      model: 'Word'
    })
    .sort({ date: -1 });

    res.json({
      status: 'success',
      data: { flashcards }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getWord = async (req, res) => {
  try {
    const word = await Word.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!word) {
      return res.status(404).json({
        status: 'error',
        message: 'Word not found'
      });
    }

    res.json({
      status: 'success',
      data: { word }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};