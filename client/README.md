# Client

React single-page app for the shift overlap API in the repository root. It is
built with [Vite](https://vite.dev) and tested with Vitest and React Testing
Library.

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Dev server on <http://localhost:3001> |
| `npm test`        | Vitest + React Testing Library        |
| `npm run build`   | Production bundle in `dist/`          |
| `npm run preview` | Serve the built bundle on port 3001   |

Point the app at the API with `VITE_API_BASE_URL` (see `.env.example`). Vite
reads it at build time. Linting runs from the root (`npm run lint`).
Full setup instructions live in the [root README](../README.md).
