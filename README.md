# Cding

Cding is a lightweight code snippet manager built with Node.js. It lets you save snippets, tag them by language, and review them quickly in a simple browser-based dashboard.

## Features

- Add snippets with a title, language, description, and code block
- Search existing snippets by title or language
- Delete snippets you no longer need
- Persistent storage in a local JSON file
- No external dependencies required

## Run locally

```bash
npm start
```

Then open http://localhost:3000 in your browser.

## Run tests

```bash
npm test
```

## Project structure

- `src/server.js` — HTTP server and API layer
- `public/` — frontend UI assets
- `data/snippets.json` — persisted snippet storage
