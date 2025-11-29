import { ThemeToggle } from "./theme-toggle"
import { useTheme } from 'next-themes'

export function Navbar() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  }

  return (
    <nav 
      className="flex items-center justify-between p-4 transition-colors duration-300"
      style={{
        backgroundColor: theme.bg,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <ThemeToggle />
    </nav>
  )
}
