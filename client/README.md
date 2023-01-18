# Client

React single-page app for the shift overlap exercise. It is a
[Create React App](https://github.com/facebook/create-react-app) project and
talks to the Express API in the repository root.

| Command         | What it does                          |
| --------------- | ------------------------------------- |
| `npm start`     | Dev server on <http://localhost:3001> |
| `npm test`      | Jest + React Testing Library          |
| `npm run build` | Production bundle in `build/`         |
| `npm run lint`  | ESLint over `src/`                    |

Point the app at the API with `REACT_APP_API_BASE_URL` (see `.env.example`).
Full setup instructions live in the [root README](../README.md).
