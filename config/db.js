const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(express.json()); // Para interpretar JSON no corpo das requisições

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
  }
}

connectToMongo();

// Exemplo de rota que lê dados de uma coleção
app.get('/usuarios', async (req, res) => {
  try {
    const collection = client.db("ProjetoWeb2").collection("usuarios");
    const usuarios = await collection.find({}).toArray();
    res.json(usuarios);
  } catch (err) {
    res.status(500).send("Erro ao buscar usuários");
  }
});

// Exemplo de rota que insere dados
app.post('/usuarios', async (req, res) => {
  try {
    const collection = client.db("ProjetoWeb2").collection("usuarios");
    const resultado = await collection.insertOne(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(500).send("Erro ao inserir usuário");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
