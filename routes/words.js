const express = require('express');
const { protect } = require('../controllers/authController');
const {
  createWord,
  getAllWords,
  getWord,
  updateWord,
  deleteWord,
  getGeminiData,
  addToFlashcard,
  removeFromFlashcard,
  getWordFlashcards
} = require('../controllers/wordController');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createWord)
  .get(getAllWords);

router.route('/:id')
  .get(getWord)
  .patch(updateWord)
  .delete(deleteWord);

router.post('/:id/gemini', getGeminiData);
router.post('/:id/flashcards', addToFlashcard);
router.delete('/:id/flashcards', removeFromFlashcard);
router.get('/:id/flashcards', getWordFlashcards);

module.exports = router;