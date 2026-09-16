'use client'
import dynamic from 'next/dynamic'

const List = dynamic(() => import('@/views/List'), { ssr: false })
export default function Page() {
  return <List />
}
