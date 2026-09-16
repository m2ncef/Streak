'use client'
import dynamic from 'next/dynamic'

const ModulesGuide = dynamic(() => import('@/views/ModulesGuide'), { ssr: false })
export default function Page() {
  return <ModulesGuide />
}
