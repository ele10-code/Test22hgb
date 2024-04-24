import express from 'express';
import fetch from 'node-fetch';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: 'json' };
const app = express(); // Crea un'istanza di Express
const PORT = process.env.PORT || 3001; // Imposta la porta del server
// Middleware per consentire le richieste da qualsiasi origine
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});
// Rotta base per verificare che il server sia in esecuzione
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Rotta per ottenere tutti i post
app.get('/posts', async (req, res) => {
    console.log(req.query); // Questo mostrerà tutti i parametri della query passati alla richiesta
    try {
        const response = await fetch('https://22hbg.com/wp-json/wp/v2/posts/');
        // casting esplicito del risultato della funzione json() al tipo Post[]:
        let posts = await response.json(); // Converte la risposta in formato JSON e la tipizza come un array di oggetti 'Post'
        // const posts = await response.json(); // Converte la risposta in formato JSON
        res.json(posts); // Invia i post come risposta
    }
    catch (error) {
        res.status(500).json({ error: 'Unable to fetch data' });
    }
});
// Rotta per ottenere i post filtrati
app.get('/posts-filtered', async (req, res) => {
    console.log(req.query); // Questo ti mostrerà tutti i parametri della query passati alla richiesta
    const title = typeof req.query.title === 'string' ? req.query.title : undefined; // Recupera il parametro 'title' dalla query
    // const items = typeof req.query.items === 'string' ? parseInt(req.query.items, 10) : undefined; // Recupera il parametro 'items' dalla query
    let items = typeof req.query.items === 'string' ? parseInt(req.query.items, 10) : undefined;
    // Verifica che il parametro 'items' sia un numero valido (se presente)
    if (items !== undefined && isNaN(items)) {
        return res.status(400).json({ error: 'Invalid items parameter' });
    }
    try {
        const response = await fetch('https://22hbg.com/wp-json/wp/v2/posts/');
        let posts = await response.json();
        // let posts = await response.json(); // Converte la risposta in formato JSON
        // Filtra i post per titolo, se il parametro 'title' è presente
        if (title) {
            posts = posts.filter(post => post.title.rendered.toLowerCase().includes(title.toLowerCase()));
        }
        // Limita il numero di post, se il parametro 'items' è presente
        if (items) {
            posts = posts.slice(0, items);
            // posts = posts.slice(0, parseInt(items));
        }
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ error: 'Unable to fetch data' });
    }
});
// Avvio del server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
