'use client'
import dynamic from 'next/dynamic'

const Settings = dynamic(() => import('@/views/Settings'), { ssr: false })
export default function Page() {
  return <Settings />
}
