'use client'
import { usePathname } from "next/navigation"
import Nav from "../Components/Nav"
import Footer from '../Components/Footer'
export default function Error(){
    const pathname = usePathname()
    return(
    <>
    <Nav/>
    <div className="errorPage">
        <h1>Error 404</h1>
        <h6>'{(pathname || '').substring(1)}'</h6>
        <p>Page Not Found</p>
    </div>
    <Footer style={{position:'fixed', bottom:0, left:0, right:0}}/>
    </>)
}