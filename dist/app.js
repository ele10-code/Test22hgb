import express from 'express';
import fetch from 'node-fetch';
import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger.json' assert { type: 'json' };
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Ottenere il percorso del file corrente con il nuovo sistema di moduli ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Crea un client Redis
import { createClient } from 'redis';
// Importa il pacchetto pg per PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;
// Assumi che Redis sia in esecuzione con le impostazioni predefinite
const redisClient = createClient({
    url: 'redis://localhost:6380'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
// Configurazione della connessione al database PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Test',
    password: 'password',
    port: 5432, // Porta predefinita di PostgreSQL
});
// Imposto il TTL per gli elementi della cache in secondi
const CACHE_TTL = 3600; // 1 ora
// discommenta se puoi provare a usare la cache in memoria invece di Redis
// let cache: Cache = {};
// Crea un'istanza di Express e imposta la porta del server a 3001
const app = express(); // Crea un'istanza di Express
const PORT = process.env.PORT || 3002; // Imposta la porta del server
// Funzione asincrona per configurare Swagger
async function setupSwagger() {
    const swaggerModule = await import('./swagger');
    swaggerModule.default(app);
}
// Crea un oggetto Swagger-jsdoc senza specificare opzioni esplicite
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Documentazione automatica della tua API',
        },
    },
    apis: ['./src/app.ts'], // Specifica il percorso del file in cui sono definite le API
};
// Connessione al server Redis
(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
        // Carica il file swagger.json
        const swaggerDocumentPath = path.join(__dirname, 'swagger.json');
        const swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocumentPath, 'utf8'));
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        app.use(express.json()); // Middleware per parsing di JSON
        // Middleware per consentire le richieste da qualsiasi origine
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
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
        /* function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
          const key = req.originalUrl;
          if (cache[key]) {
            console.log('Cache hit!');
            res.send(cache[key]);
          } else {
            console.log('Cache miss');
            next();
          }
        } */
        //1 opzione
        /* function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
          const key = req.originalUrl;
          const item = cache[key];
        
          if (item) {
            if (Date.now() < item.expiry) {
              console.log('Cache hit!');
              res.send(item.value);
            } else {
              console.log('Cache expired, fetching new data...');
              // Rimuovi l'elemento scaduto dalla cache
              delete cache[key];
              next();
            }
          } else {
            console.log('Cache miss');
            next();
          }
        } */
        //2 opzione
        // Middleware di cache che utilizza Redis per memorizzare i dati in cache
        async function cacheMiddleware(req, res, next) {
            const key = req.originalUrl;
            try {
                const cacheResult = await redisClient.get(key);
                if (cacheResult != null) {
                    console.log('Cache hit!');
                    res.send(JSON.parse(cacheResult));
                }
                else {
                    console.log('Cache miss');
                    // Capture the response using a custom response mechanism
                    const originalSend = res.send.bind(res);
                    res.send = (body) => {
                        const valueToCache = JSON.stringify(body);
                        redisClient.setEx(key, CACHE_TTL, valueToCache)
                            .then(() => console.log('Response cached'))
                            .catch(err => console.error('Redis setEx error:', err));
                        // Restore the original send function and send the response
                        res.send = originalSend; // Restore original function to avoid issues on subsequent requests
                        return originalSend(body);
                    };
                    next();
                }
            }
            catch (err) {
                console.error('Redis get error:', err);
                next();
            }
        }
        // Utilizzo questo metodo per aggiungere elementi alla cache
        // da discommentare se si vuole utilizzare la cache in memoria invece di Redis
        /* function addToCache(key: string, value: any) {
          const expiry = Date.now() + CACHE_TTL * 1000;
          cache[key] = { value: JSON.stringify(value), expiry };
        } */
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
                // Salvo i post nella cache prima di inviarli al client
                const key = req.originalUrl;
                // da discommentare se si vuole utilizzare la cache in memoria invece di Redis
                // addToCache(key, posts);
                res.json(posts);
                /*     const key = req.originalUrl;
                    cache[key] = JSON.stringify(posts)
                    res.json(posts); */
            }
            catch (error) {
                res.status(500).json({ error: 'Unable to fetch data' });
            }
        });
        // Endpoint per sincronizzare i dati dal feed al database
        app.get('/sync-db', async (req, res) => {
            try {
                const response = await fetch('https://22hbg.com/wp-json/wp/v2/posts/');
                let posts = await response.json(); // Converte la risposta in formato JSON e la tipizza come un array di oggetti 'Post'
                // Scrivi i nuovi post nel database
                await pool.query('TRUNCATE TABLE posts'); // Cancella i post esistenti
                await Promise.all(posts.map(post => pool.query('INSERT INTO posts(id, title, content) VALUES($1, $2, $3)', [post.id, post.title.rendered, post.content.rendered])));
                res.json({ message: 'Data synchronized successfully' });
            }
            catch (error) {
                console.error('Error synchronizing data:', error);
                res.status(500).json({ error: 'Unable to synchronize data' });
            }
        });
        // Endpoint per ottenere i post dal database
        app.get('/posts-db', async (req, res) => {
            try {
                const { rows } = await pool.query('SELECT * FROM posts');
                res.json(rows);
            }
            catch (error) {
                console.error('Error fetching data from database:', error);
                res.status(500).json({ error: 'Unable to fetch data from database' });
            }
        });
        // Avvio del server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Error connecting to Redis:', err);
    }
})();
