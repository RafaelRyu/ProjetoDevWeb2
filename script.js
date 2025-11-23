const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

// Configuração da sessão
app.use(session({
  secret: "segredo-super-seguro",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Configuração da estratégia Google
passport.use(new GoogleStrategy({
  clientID: '961738074147-t2se5sq18l29agv440gq0o0fvsfie4ab.apps.googleusercontent.com',// coloque seu CLIENT_ID
  clientSecret: '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', // coloque seu CLIENT_SECRET
  callbackURL: "http://localhost:3000/auth/google/callback"
},
  (accessToken, refreshToken, profile, done) => {
    // Aqui você poderia salvar o usuário no MongoDB
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Iniciar login com Google
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback do Google
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    return res.redirect("/livrospage.html"); // se autenticado, vai para livros
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // segue para a rota protegida
  } else {
    return res.redirect('/auth/google'); // força login
  }
}

// Endpoint para verificar status de autenticação
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});



app.use(express.static(path.join(__dirname, 'public')));

// Rota opcional para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/livrospage.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "livrospage.html"));
});

app.get("/dvdspages.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "dvdspages.html"));
});

app.get("/cdspages.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "cdspages.html"));
});

app.get("/autorespages.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "autorespages.html"));
});


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json());

const uri = "mongodb+srv://suzukifurukawarafaelryu_db_user:r7VbYBPLhWbynOkM@projetoweb2.jd8mcyb.mongodb.net/?appName=ProjetoWeb2";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



// Helper para acessar a coleção
function livrosCollection() {
  return client.db("ProjetoWeb2").collection("livros");
}

const dvdRoutes = require('./routes/dvdRoutes');
const dvdController = require('./controller/dvdController');

// Helper para acessar a coleção de dvds
function dvdsCollection() {
  return client.db("ProjetoWeb2").collection("dvds");
}

const cdRoutes = require('./routes/cdRoutes');
const cdController = require('./controller/cdController');

// Helper para acessar a coleção de cds
function cdsCollection() {
  return client.db("ProjetoWeb2").collection("cds");
}

const autorRoutes = require('./routes/autorRoutes');
const autorController = require('./controller/autorController');

// Helper para acessar a coleção de autores
function autoresCollection() {
  return client.db("ProjetoWeb2").collection("autores");
}

// Injetar coleção no controller assim que conectar (ou lazy, mas aqui faremos lazy no request se preferir, 
// mas o padrão do controller foi setCollection. Vamos garantir que setCollection seja chamado.)
// Como a conexão é async, podemos chamar setCollection dentro de connectToMongo ou criar um middleware.
// Simplificação: chamar setCollection após a conexão ser estabelecida ou usar o getter direto no controller se refatorássemos.
// Dado o design atual do controller (setCollection), vamos ajustá-lo para ser chamado.

// Ajuste na conexão para configurar as coleções
async function connectToMongo() {
  try {
    await client.connect();
    console.log("Conectado ao MongoDB com MongoClient!");

    // Configurar coleções nos controllers
    dvdController.setCollection(client.db("ProjetoWeb2").collection("dvds"));
    cdController.setCollection(client.db("ProjetoWeb2").collection("cds"));
    autorController.setCollection(client.db("ProjetoWeb2").collection("autores"));

  } catch (err) {
    console.error("Erro ao conectar com MongoDB:", err);
    process.exit(1);
  }
}
connectToMongo();

app.use('/dvds', dvdRoutes);
app.use('/cds', cdRoutes);
app.use('/autores', autorRoutes);


// Validação simples
function validarLivro(body) {
  const erros = [];
  if (!body.titulo || typeof body.titulo !== 'string') erros.push("Título é obrigatório (string).");
  // Autor agora é opcional se autorId for fornecido, mas vamos manter autor como string por compatibilidade ou remover?
  // O requisito diz "campo para que possa ser inserido o id do autor".
  // Vamos permitir autorId opcionalmente, mas validar se for passado.
  if (body.autorId && !ObjectId.isValid(body.autorId)) erros.push("Autor ID inválido.");

  if (!body.ano || typeof body.ano !== 'string') erros.push("Ano é obrigatório (string).");
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
          { ano: { $regex: q, $options: 'i' } },
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

    const { titulo, autor, autorId, ano, genero } = req.body;
    const novo = { titulo, autor, autorId, ano, genero, createdAt: new Date() };

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
    for (const k of ['titulo', 'autor', 'autorId', 'ano', 'genero']) {
      if (req.body[k] !== undefined) {
        if (k === 'autorId') {
          if (req.body[k] && !ObjectId.isValid(req.body[k])) return res.status(400).send("Autor ID inválido.");
        } else if (typeof req.body[k] !== 'string' || !req.body[k].trim()) {
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

    // Handle different driver versions/configurations
    const doc = resultado.value !== undefined ? resultado.value : resultado;

    if (!doc) return res.status(404).send("Livro não encontrado.");
    res.json(doc);
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

    const { titulo, autor, autorId, ano, genero } = req.body;
    const doc = { titulo, autor, autorId, ano, genero, updatedAt: new Date() };

    const col = livrosCollection();
    const resultado = await col.findOneAndReplace(
      { _id: new ObjectId(id) },
      doc,
      { returnDocument: 'after' }
    );

    // Handle different driver versions/configurations
    const val = resultado.value !== undefined ? resultado.value : resultado;

    if (!val) return res.status(404).send("Livro não encontrado.");
    res.json(val);
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



const PORT = process.env.PORT || 3000;



app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});