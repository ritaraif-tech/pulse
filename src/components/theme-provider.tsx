"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider(
  props: React.ComponentProps<typeof NextThemesProvider>
) {
  return (
    <NextThemesProvider
      // The theme script only needs to run on the server-rendered HTML; on the
      // client, mark it inert so React doesn't warn about rendering a <script>
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
      {...props}
    />
  )
}
