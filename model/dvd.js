
const mongoose = require('mongoose');

const dvdSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  nome: { type: String, required: true },
  capacidade: { type: Number, required: true }
});

module.exports = mongoose.model('DVDs', dvdSchema);