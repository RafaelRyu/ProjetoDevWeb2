const express = require('express');
const router = express.Router();
const cdController = require('../controller/cdController');

router.get('/', cdController.getAllCds);
router.get('/:id', cdController.getCdById);
router.post('/', cdController.createCd);
router.patch('/:id', cdController.updateCd);
router.delete('/:id', cdController.deleteCd);

module.exports = router;
