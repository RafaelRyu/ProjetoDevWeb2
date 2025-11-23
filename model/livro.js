const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const uri = "mongodb+srv://suzukifurukawarafaelryu_db_user:r7VbYBPLhWbynOkM@projetoweb2.jd8mcyb.mongodb.net/?appName=ProjetoWeb2";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB com MongoClient!");
  } catch (err) {
    console.error("Erro ao conectar com MongoDB:", err);
    process.exit(1);
  }
}
connectToMongo();

// Helper para acessar a coleção
function livrosCollection() {
  return client.db("ProjetoWeb2").collection("Livros");
}

// Validação simples
function validarLivro(body) {
  const erros = [];
  if (!body.titulo || typeof body.titulo !== 'string') erros.push("Título é obrigatório (string).");
  if (!body.autor || typeof body.autor !== 'string') erros.push("Autor é obrigatório (string).");
  if (!body.nome || typeof body.nome !== 'string') erros.push("Nome é obrigatório (string).");
  if (!body.genero || typeof body.genero !== 'string') erros.push("Gênero é obrigatório (string).");
  return erros;
}

// Listar livros (com filtro opcional ?q=)
app.get('/livros', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const col = livrosCollection();

    const filtro = q
      ? {
          $or: [
            { titulo: { $regex: q, $options: 'i' } },
            { autor: { $regex: q, $options: 'i' } },
            { nome: { $regex: q, $options: 'i' } },
            { genero: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const livros = await col.find(filtro).sort({ _id: -1 }).toArray();
    res.json(livros);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar livros");
  }
});

// Obter livro por ID
app.get('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

    const col = livrosCollection();
    const livro = await col.findOne({ _id: new ObjectId(id) });

    if (!livro) return res.status(404).send("Livro não encontrado.");
    res.json(livro);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar livro");
  }
});

// Criar livro
app.post('/livros', async (req, res) => {
  try {
    console.log('chamou')
    const erros = validarLivro(req.body);
    if (erros.length) return res.status(400).json({ erros });

    const { titulo, autor, nome, genero } = req.body;
    const novo = { titulo, autor, nome, genero, createdAt: new Date() };

    const col = livrosCollection();
    const resultado = await col.insertOne(novo);

    res.status(201).json({ _id: resultado.insertedId, ...novo });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao inserir livro");
  }
});

// Atualizar livro por ID (substituição parcial - PATCH)
app.patch('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

    // Campos permitidos
    const update = {};
    for (const k of ['titulo', 'autor', 'nome', 'genero']) {
      if (req.body[k] !== undefined) {
        if (typeof req.body[k] !== 'string' || !req.body[k].trim()) {
          return res.status(400).send(`Campo ${k} deve ser uma string não vazia.`);
        }
        update[k] = req.body[k];
      }
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).send("Nenhum campo válido para atualizar.");
    }
    update.updatedAt = new Date();

    const col = livrosCollection();
    const resultado = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!resultado.value) return res.status(404).send("Livro não encontrado.");
    res.json(resultado.value);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao atualizar livro");
  }
});

// Substituição completa (PUT opcional)
app.put('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

    const erros = validarLivro(req.body);
    if (erros.length) return res.status(400).json({ erros });

    const { titulo, autor, nome, genero } = req.body;
    const doc = { titulo, autor, nome, genero, updatedAt: new Date() };

    const col = livrosCollection();
    const resultado = await col.findOneAndReplace(
      { _id: new ObjectId(id) },
      doc,
      { returnDocument: 'after' }
    );

    if (!resultado.value) return res.status(404).send("Livro não encontrado.");
    res.json(resultado.value);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao substituir livro");
  }
});

// Deletar livro por ID
app.delete('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

    const col = livrosCollection();
    const resultado = await col.deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) return res.status(404).send("Livro não encontrado.");
    res.status(204).send(); // Sem conteúdo
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao deletar livro");
  }
});

// (Opcional) criar índice de texto para melhorar buscas
async function criarIndices() {
  try {
    const col = livrosCollection();
    await col.createIndex(
      { titulo: "text", autor: "text", nome: "text", genero: "text" },
      { name: "livros_text_index" }
    );
    console.log("Índice de texto criado para Livros.");
  } catch (err) {
    console.error("Falha ao criar índice:", err);
  }
}
criarIndices();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
