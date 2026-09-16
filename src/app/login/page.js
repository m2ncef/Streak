'use client'
import dynamic from 'next/dynamic'

const Login = dynamic(() => import('@/views/Login'), { ssr: false })
export default function Page() {
  return <Login />
}
