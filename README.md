# Test22hgb

web service che consenta di interrogarlo tramite REST-API.

## Prerequisiti

Prima di iniziare, assicurati di avere installato i seguenti software:

- Node.js
- PostgreSQL
- Redis

## Installazione

Per iniziare a utilizzare questo progetto, segui i seguenti passaggi:

1. Clona il repository:
   ```bash
   git clone [url-del-tuo-repository]
   cd [nome-della-cartella-del-progetto]
2. Per installare le dipendenze, utilizza: 
   ``` npm install --save-dev typescript @types/node @types/express ```

## Utilizzo
Per avviare l'applicazione, esegui:
  ``` npm start```

L'applicazione sarà disponibile all'indirizzo http://localhost:3002

## API Endpoints
- GET /posts
Descrizione: Restituisce l’elenco di tutti i post.
URL: http://localhost:3002/posts
- GET /posts-filtered
Descrizione: Restituisce l'elenco di tutti i post filtrando secondo i parametri specificati.
Parametri:
title: Testo da ricercare nel titolo dei post.
items: Numero di post da ritornare.
URL: http://localhost:3002/posts-filtered?title=<testo>&items=<numero>
- GET /sync-db
Descrizione: Legge i contenuti dal feed e li scrive all’interno della tabella ‘posts’ del database.
URL: http://localhost:3002/sync-db
- GET /posts-db
Descrizione: Legge e ritorna i contenuti presenti all’interno della tabella ‘posts’ del database.
URL: http://localhost:3002/posts-db

## Documentazione API
Per visualizzare la documentazione dell'API, visita:
```bash
      http://localhost:3002/api-docs


Questa documentazione è stata generata con Swagger e ti permetterà di vedere tutti i punti di accesso disponibili e di testarli direttamente tramite l'interfaccia utente di Swagger.
