# Cding

Cding is a lightweight code snippet manager for saving, searching, and organizing reusable code snippets.

## Features

- Add snippets with a title, language, description, and code
- Search snippets by title, description, or language
- Delete snippets you no longer need
- Save data locally with no external database required
- Simple browser UI

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Run tests

```bash
npm test
```

## Project structure

- `src/server.js` — Node.js HTTP server and API
- `public/` — frontend files
- `data/snippets.json` — local snippet storage
