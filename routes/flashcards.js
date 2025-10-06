const express = require('express');
const { protect } = require('../controllers/authController');
const {
  getFlashcards,
  getTodayFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  markFlashcardCompleted
} = require('../controllers/flashcardController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFlashcards)
  .post(createFlashcard);

router.route('/:id')
  .patch(updateFlashcard)
  .delete(deleteFlashcard);

router.get('/today', getTodayFlashcards);
router.patch('/:id/complete', markFlashcardCompleted);

module.exports = router;