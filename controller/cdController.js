const { ObjectId } = require('mongodb');

let cdsCollection;

function setCollection(collection) {
    cdsCollection = collection;
}

function validarCd(body) {
    const erros = [];
    if (!body.titulo || typeof body.titulo !== 'string') erros.push("Título é obrigatório (string).");
    if (!body.artista || typeof body.artista !== 'string') erros.push("Artista é obrigatório (string).");
    if (body.autorId && !ObjectId.isValid(body.autorId)) erros.push("Autor ID inválido.");
    if (!body.ano || typeof body.ano !== 'string') erros.push("Ano é obrigatório (string).");
    if (!body.genero || typeof body.genero !== 'string') erros.push("Gênero é obrigatório (string).");
    return erros;
}

async function getAllCds(req, res) {
    try {
        const q = (req.query.q || '').trim();

        const filtro = q
            ? {
                $or: [
                    { titulo: { $regex: q, $options: 'i' } },
                    { artista: { $regex: q, $options: 'i' } },
                    { ano: { $regex: q, $options: 'i' } },
                    { genero: { $regex: q, $options: 'i' } },
                ],
            }
            : {};

        const cds = await cdsCollection.find(filtro).sort({ _id: -1 }).toArray();
        res.json(cds);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar CDs");
    }
}

async function getCdById(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const cd = await cdsCollection.findOne({ _id: new ObjectId(id) });

        if (!cd) return res.status(404).send("CD não encontrado.");
        res.json(cd);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar CD");
    }
}

async function createCd(req, res) {
    try {
        const erros = validarCd(req.body);
        if (erros.length) return res.status(400).json({ erros });

        const { titulo, artista, autorId, ano, genero } = req.body;
        const novo = { titulo, artista, autorId, ano, genero, createdAt: new Date() };

        const resultado = await cdsCollection.insertOne(novo);

        res.status(201).json({ _id: resultado.insertedId, ...novo });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao inserir CD");
    }
}

async function updateCd(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const update = {};
        for (const k of ['titulo', 'artista', 'autorId', 'ano', 'genero']) {
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

        const resultado = await cdsCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: 'after' }
        );

        // Handle different driver versions/configurations
        const doc = resultado.value !== undefined ? resultado.value : resultado;

        if (!doc) return res.status(404).send("CD não encontrado.");
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao atualizar CD");
    }
}

async function deleteCd(req, res) {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("ID inválido.");

        const resultado = await cdsCollection.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 0) return res.status(404).send("CD não encontrado.");
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao deletar CD");
    }
}

module.exports = {
    setCollection,
    getAllCds,
    getCdById,
    createCd,
    updateCd,
    deleteCd
};
