const { ObjectId } = require('mongodb');

let autoresCollection;

function setCollection(collection) {
    autoresCollection = collection;
}

function validarAutor(body) {
    const erros = [];
    if (!body.nome || typeof body.nome !== 'string') erros.push("Nome é obrigatório (string).");
    // Biografia e dataNascimento são opcionais, mas se vierem, devem ser strings
    if (body.biografia && typeof body.biografia !== 'string') erros.push("Biografia deve ser uma string.");
    if (body.dataNascimento && typeof body.dataNascimento !== 'string') erros.push("Data de Nascimento deve ser uma string.");
    return erros;
}

async function getAllAutores(req, res) {
    try {
        const q = (req.query.q || '').trim();

        const filtro = q
            ? {
                $or: [
                    { nome: { $regex: q, $options: 'i' } },
                    { biografia: { $regex: q, $options: 'i' } },
                ],
            }
            : {};

        const autores = await autoresCollection.find(filtro).sort({ _id: -1 }).toArray();
        res.json(autores);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar autores");
    }
}

async function getAutorById(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const autor = await autoresCollection.findOne({ _id: new ObjectId(id) });

        if (!autor) return res.status(404).send("Autor não encontrado.");
        res.json(autor);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar autor");
    }
}

async function createAutor(req, res) {
    try {
        const erros = validarAutor(req.body);
        if (erros.length) return res.status(400).json({ erros });

        const { nome, biografia, dataNascimento } = req.body;
        const novo = { nome, biografia, dataNascimento, createdAt: new Date() };

        const resultado = await autoresCollection.insertOne(novo);

        res.status(201).json({ _id: resultado.insertedId, ...novo });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao inserir autor");
    }
}

async function updateAutor(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const update = {};
        for (const k of ['nome', 'biografia', 'dataNascimento']) {
            if (req.body[k] !== undefined) {
                if (typeof req.body[k] !== 'string') {
                    // Allow empty string for optional fields if needed, but let's enforce string type
                    return res.status(400).send(`Campo ${k} deve ser uma string.`);
                }
                update[k] = req.body[k];
            }
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).send("Nenhum campo válido para atualizar.");
        }
        update.updatedAt = new Date();

        const resultado = await autoresCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after' }
        );

        // Handle different driver versions/configurations
        const doc = resultado.value !== undefined ? resultado.value : resultado;

        if (!doc) return res.status(404).send("Autor não encontrado.");
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao atualizar autor");
    }
}

async function deleteAutor(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const resultado = await autoresCollection.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 0) return res.status(404).send("Autor não encontrado.");
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao deletar autor");
    }
}

module.exports = {
    setCollection,
    getAllAutores,
    getAutorById,
    createAutor,
    updateAutor,
    deleteAutor
};
