'use client'
import dynamic from 'next/dynamic'

const Error = dynamic(() => import('@/views/404'), { ssr: false })
export default function NotFound() {
  return <Error />
}
