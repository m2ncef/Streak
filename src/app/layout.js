import './globals.css'

export const metadata = {
  title: 'Streak',
  description:
    'Watch Latest TV Series & Movies For Free ! Unlimited streaming movies for free now - No sign up - No Buffering - One Click Streaming. by @m2ncef',
  keywords:
    'streak, streaak, netflix, movies, netlify, moncef, moncef guezzi, guezzi, github, watch movies',
  openGraph: {
    title: 'Streak',
    description:
      'Watch Latest TV Series & Movies For Free ! Unlimited streaming movies for free now - No sign up - No Buffering - One Click Streaming. by @m2ncef',
    images: [
      'https://socialify.git.ci/m2ncef/Streak/image?description=1&font=Inter&language=1&name=1&owner=1&theme=Dark',
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'Streak',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
    shortcut: '/icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
