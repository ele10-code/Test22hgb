// Importazione dei moduli necessari
import express from 'express';
import fetch from 'node-fetch'; // Assicurati di avere installato node-fetch come dipendenza
// Creazione dell'istanza dell'applicazione Express
const app = express();
const PORT = process.env.PORT || 3000; // Porta del server, con fallback su 3000 se non specificato
// Rotta base per verificare che il server sia in esecuzione
app.get('/', (req, res) => {
    res.send('Hello World!');
});
// Rotta per ottenere i post dal feed JSON
app.get('/feed', async (req, res) => {
    try {
        const response = await fetch('https://22hbg.com/wp-json/wp/v2/posts/');
        const posts = await response.json();
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
