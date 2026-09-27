import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HubPage } from './pages/HubPage'
import { HomePage } from './pages/HomePage'
import { PuzzlePage } from './pages/PuzzlePage'
import { RepeatShell } from './repeat/RepeatShell'
import { RepeatDeckPage } from './repeat/pages/RepeatDeckPage'
import { RepeatHomePage } from './repeat/pages/RepeatHomePage'
import { RepeatSettingsPage } from './repeat/pages/RepeatSettingsPage'
import { RepeatStudyPage } from './repeat/pages/RepeatStudyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/puzzles" element={<HomePage />} />
        <Route path="/play/:slug" element={<PuzzlePage />} />
        <Route path="/repeat" element={<RepeatShell />}>
          <Route index element={<RepeatHomePage />} />
          <Route path="decks/:slug" element={<RepeatDeckPage />} />
          <Route path="study/:slug" element={<RepeatStudyPage />} />
          <Route path="settings" element={<RepeatSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
