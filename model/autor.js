const mongoose = require('mongoose');

const autorSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  nomeCompleto: { type: String, required: true },
  nacionalidade: { type: String, required: true }
});

module.exports = mongoose.model('Autor', autorSchema);
