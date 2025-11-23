const express = require('express');
const router = express.Router();
const autorController = require('../controller/autorController');

router.get('/', autorController.getAllAutores);
router.get('/:id', autorController.getAutorById);
router.post('/', autorController.createAutor);
router.patch('/:id', autorController.updateAutor);
router.delete('/:id', autorController.deleteAutor);

module.exports = router;
