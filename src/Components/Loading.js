'use client'
import { useEffect } from 'react'
import Footer from './Footer'

export default function Loading({ time }) {
  useEffect(() => {
    const ms = time || 2500
    const t = setTimeout(() => {
      const el = document.querySelector('.Loader')
      if (!el) return
      el.style.opacity = '0'
      el.style.zIndex = '-1'
    }, ms)
    return () => clearTimeout(t)
  }, [time])

  return (
    <div className="Loader">
      <img src="/icon.png" alt="Loader icon" />
      <Footer style={{ bottom: 0, position: 'fixed' }} />
    </div>
  )
}
