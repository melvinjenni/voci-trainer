import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Home from './routes/Home'
import Import from './routes/Import'
import Deck from './routes/Deck'
import Write from './routes/Write'
import Flashcards from './routes/Flashcards'
import Games from './routes/Games'
import Settings from './routes/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'import', element: <Import /> },
      { path: 'settings', element: <Settings /> },
      { path: 'deck/:deckId', element: <Deck /> },
      { path: 'deck/:deckId/write', element: <Write /> },
      { path: 'deck/:deckId/flashcards', element: <Flashcards /> },
      { path: 'deck/:deckId/games', element: <Games /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
