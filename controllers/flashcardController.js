const Flashcard = require('../models/Flashcard');
const Word = require('../models/Word');

exports.getFlashcards = async (req, res) => {
  try {
    const { date } = req.query;
    let query = { user: req.user._id };

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.date = queryDate;
    }

    const flashcards = await Flashcard.find(query)
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

exports.getTodayFlashcards = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let flashcard = await Flashcard.findOne({
      user: req.user._id,
      date: today
    }).populate({
      path: 'words.word',
      model: 'Word'
    });

    if (!flashcard) {
      flashcard = await Flashcard.create({
        user: req.user._id,
        date: today,
        words: []
      });
      // Populate after creation
      await flashcard.populate({
        path: 'words.word',
        model: 'Word'
      });
    }

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

exports.markFlashcardCompleted = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { completed: true },
      { new: true }
    ).populate({
      path: 'words.word',
      model: 'Word'
    });

    if (!flashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found'
      });
    }

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

exports.createFlashcard = async (req, res) => {
  try {
    const { date, title } = req.body;
    
    const flashcardDate = date ? new Date(date) : new Date();
    flashcardDate.setHours(0, 0, 0, 0);

    // Check if flashcard already exists for this date
    const existingFlashcard = await Flashcard.findOne({
      user: req.user._id,
      date: flashcardDate
    });

    if (existingFlashcard) {
      return res.status(400).json({
        status: 'error',
        message: 'Flashcard already exists for this date'
      });
    }

    const flashcard = await Flashcard.create({
      user: req.user._id,
      date: flashcardDate,
      title: title || `Flashcards - ${flashcardDate.toLocaleDateString()}`,
      words: []
    });

    // Populate after creation
    await flashcard.populate({
      path: 'words.word',
      model: 'Word'
    });

    res.status(201).json({
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

exports.updateFlashcard = async (req, res) => {
  try {
    const { title } = req.body;

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title },
      { new: true }
    ).populate({
      path: 'words.word',
      model: 'Word'
    });

    if (!flashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found'
      });
    }

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

exports.deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!flashcard) {
      return res.status(404).json({
        status: 'error',
        message: 'Flashcard not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};