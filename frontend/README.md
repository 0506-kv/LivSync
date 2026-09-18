# LivSync Frontend

React frontend for LivSync, built with Vite and Tailwind CSS.

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4 through `@tailwindcss/vite`
- ESLint 10
- Optional UI/runtime libraries listed in dependencies: `axios`, `framer-motion`, `lucide-react`, `react-icons`, and `react-router-dom`

## Installation

From the `frontend` folder:

```bash
npm install
```

## Configuration

No frontend environment variables are currently required by the codebase.

The `.gitignore` file already excludes:

- `.env`
- `node_modules`

If API calls are added later, create a local `.env` file and use Vite-style variables, for example:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Only variables prefixed with `VITE_` are exposed to browser code by Vite.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server. By default, Vite serves the app at `http://localhost:5173`.

```bash
npm run build
```

Creates a production build in `dist`.

```bash
npm run preview
```

Serves the production build locally for preview.

```bash
npm run lint
```

Runs ESLint against the frontend source.

## Frontend Routes

The frontend currently does not define React Router routes.

| Route | Source | Description |
| --- | --- | --- |
| `/` | `src/main.jsx` renders `src/App.jsx` | Main app entry rendered into `#root` from `index.html` |

`react-router-dom` is installed, but it is not currently used in `src/App.jsx`.

## Current App Entry

- `index.html` provides the root DOM element: `<div id="root"></div>`
- `src/main.jsx` mounts the React app with `createRoot`
- `src/App.jsx` currently renders a simple `App` placeholder
- `src/index.css` imports Tailwind with `@import "tailwindcss";`
- `vite.config.js` enables the React and Tailwind Vite plugins

## Development Notes

Run the backend separately from the `backend` folder if the frontend needs API data. The backend defaults to `http://localhost:4000`.
