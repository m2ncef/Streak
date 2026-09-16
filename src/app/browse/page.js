'use client'
import dynamic from 'next/dynamic'

const Explore = dynamic(() => import('@/views/Explore'), { ssr: false })
export default function Page() {
  return <Explore />
}
