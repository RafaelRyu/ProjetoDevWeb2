const express = require('express');
const router = express.Router();
const dvdController = require('../controller/dvdController');

router.get('/', dvdController.getAllDvds);
router.get('/:id', dvdController.getDvdById);
router.post('/', dvdController.createDvd);
router.patch('/:id', dvdController.updateDvd);
router.delete('/:id', dvdController.deleteDvd);

module.exports = router;
