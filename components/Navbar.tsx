import { ThemeToggle } from "./theme-toggle"

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4">
      {/* Other navbar items */}
      <ThemeToggle />
    </nav>
  )
}