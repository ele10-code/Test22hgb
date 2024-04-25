import express from 'express';
import fetch from 'node-fetch';
// import swaggerDocument from './swagger.json' assert { type: 'json' };
import setupSwagger from './swagger';
let cache = {};
// Crea un'istanza di Express e imposta la porta del server a 3001
const app = express(); // Crea un'istanza di Express
const PORT = process.env.PORT || 3001; // Imposta la porta del server
setupSwagger(app); // Configura e inizializza Swagger UI
// Middleware per consentire le richieste da qualsiasi origine
app.use((req, res, next) => {
    res.setHeader('Controllo accesso', '*');
    next();
});
// Rotta base per verificare che il server sia in esecuzione
app.get('/', (req, res) => {
    res.send('Hello World!');
});
/*

CACHE
1-soluzione
per implementare la logica di caching in modo tale che le varie richieste a determinati endpoint sfruttino la cache per evitare di effettuare richieste multiple al server remoto,
possiamo utilizzare la cache di Express.js, che è basata su una mappa chiave-valore.

Per implementare la cache, possiamo utilizzare un oggetto JavaScript per memorizzare i dati in cache.
Dobbiamo inoltre verificare se i dati sono già presenti nella cache prima di effettuare una richiesta al server remoto.
Se i dati sono presenti nella cache, possiamo restituire i dati dalla cache invece di effettuare una richiesta al server remoto.

2-soluzione
utilizzo di Redis per memorizzare i dati in cache. Redis è un database in memoria che può essere utilizzato per memorizzare dati in cache.
Per utilizzare Redis con Express.js, possiamo utilizzare il pacchetto redis per Node.js.
Per installare il pacchetto redis, possiamo eseguire il comando npm install redis.

*/
//creazione del middleware per la gestione della cache
// controlla se i dati sono presenti nella cache prima di effettuare una richiesta al server remoto
function cacheMiddleware(req, res, next) {
    const key = `${req.originalUrl}`;
    if (cache[key]) {
        console.log('Cache hit!');
        res.send(cache[key]);
        return;
    }
    console.log('Cache miss');
    const originalSend = res.send.bind(res);
    let responseData = Buffer.from('');
    // Patch the res.send method to intercept response data
    res.send = function (data) {
        if (typeof data === 'string') {
            responseData = Buffer.from(data);
        }
        else if (Buffer.isBuffer(data)) {
            responseData = data;
        }
        else {
            responseData = Buffer.from(JSON.stringify(data));
        }
        // Cache the response data
        cache[key] = responseData.toString('utf-8');
        // Send the response as usual
        return originalSend(data);
    };
    next();
}
// Rotta per ottenere tutti i post
app.get('/posts', cacheMiddleware, async (req, res) => {
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
app.get('/posts-filtered', cacheMiddleware, async (req, res) => {
    console.log(req.query); // Questo ti mostrerà tutti i parametri della query passati alla richiesta
    const title = typeof req.query.title === 'string' ? req.query.title : undefined; // Recupera il parametro 'title' dalla query
    // const items = typeof req.query.items === 'string' ? parseInt(req.query.items, 10) : undefined; // Recupera il parametro 'items' dalla query
    let items = typeof req.query.items === 'string' ? parseInt(req.query.items, 10) : undefined;
    // Verifica che il parametro 'items' sia un numero valido (se presente)
    if (items !== undefined && isNaN(items)) {
        return res.status(400).json({ error: 'Invalid items parameter' });
    }
    try {
        // Esegui una richiesta GET all'API per ottenere tutti i post
        const response = await fetch('https://22hbg.com/wp-json/wp/v2/posts/');
        let posts = await response.json(); // Converte la risposta in formato JSON e la tipizza come un array di oggetti 'Post'
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
