const { ObjectId } = require('mongodb');

let dvdsCollection;

function setCollection(collection) {
    dvdsCollection = collection;
}

function validarDvd(body) {
    const erros = [];
    if (!body.titulo || typeof body.titulo !== 'string') erros.push("Título é obrigatório (string).");
    if (!body.diretor || typeof body.diretor !== 'string') erros.push("Diretor é obrigatório (string).");
    if (body.autorId && !ObjectId.isValid(body.autorId)) erros.push("Autor ID inválido.");
    if (!body.ano || typeof body.ano !== 'string') erros.push("Ano é obrigatório (string).");
    if (!body.genero || typeof body.genero !== 'string') erros.push("Gênero é obrigatório (string).");
    return erros;
}

async function getAllDvds(req, res) {
    try {
        const q = (req.query.q || '').trim();

        const filtro = q
            ? {
                $or: [
                    { titulo: { $regex: q, $options: 'i' } },
                    { diretor: { $regex: q, $options: 'i' } },
                    { ano: { $regex: q, $options: 'i' } },
                    { genero: { $regex: q, $options: 'i' } },
                ],
            }
            : {};

        const dvds = await dvdsCollection.find(filtro).sort({ _id: -1 }).toArray();
        res.json(dvds);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar DVDs");
    }
}

async function getDvdById(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const dvd = await dvdsCollection.findOne({ _id: new ObjectId(id) });

        if (!dvd) return res.status(404).send("DVD não encontrado.");
        res.json(dvd);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar DVD");
    }
}

async function createDvd(req, res) {
    try {
        const erros = validarDvd(req.body);
        if (erros.length) return res.status(400).json({ erros });

        const { titulo, diretor, autorId, ano, genero } = req.body;
        const novo = { titulo, diretor, autorId, ano, genero, createdAt: new Date() };

        const resultado = await dvdsCollection.insertOne(novo);

        res.status(201).json({ _id: resultado.insertedId, ...novo });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao inserir DVD");
    }
}

async function updateDvd(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const update = {};
        for (const k of ['titulo', 'diretor', 'autorId', 'ano', 'genero']) {
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

        const resultado = await dvdsCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after' }
        );

        // Handle different driver versions/configurations
        // If includeResultMetadata is false (default in some versions), it returns the doc directly.
        // If true, it returns { value: doc, ... }
        const doc = resultado.value !== undefined ? resultado.value : resultado;

        if (!doc) {
            return res.status(404).send("DVD não encontrado.");
        }
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao atualizar DVD");
    }
}

async function deleteDvd(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const resultado = await dvdsCollection.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 0) return res.status(404).send("DVD não encontrado.");
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao deletar DVD");
    }
}

module.exports = {
    setCollection,
    getAllDvds,
    getDvdById,
    createDvd,
    updateDvd,
    deleteDvd
};
