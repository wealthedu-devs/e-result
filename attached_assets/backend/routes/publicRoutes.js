// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { checkResult, downloadResultPDF } = require('../controllers/publicController');
const { validate, checkResultSchema } = require('../validators');

router.post('/check-result', validate(checkResultSchema), checkResult);
router.get('/result-pdf/:resultId', downloadResultPDF);
router.post('/register-school', validate(schoolSchema), registerSchool);
module.exports = router;