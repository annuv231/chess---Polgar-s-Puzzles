import { SettingsPanel } from '@repeat/components/SettingsPanel'
import { getAllDecks } from '@repeat/decks'

export function RepeatSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Study preferences and local progress management.
      </p>
      <div className="mt-8">
        <SettingsPanel decks={getAllDecks()} />
      </div>
    </div>
  )
}
