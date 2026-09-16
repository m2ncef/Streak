'use client'
import Link from "next/link"

export default () => {
    return(
        <div className={`NavBar`}>
            <Link style={{textDecoration:'none', color:'white', padding:"1vh", fontWeight:'600'}} href={'/'}><i className="fa fa-chevron-left" aria-hidden="true"></i>&nbsp;&nbsp;</Link>
            <div>
                <h1>Streak</h1>
            </div>
            <Link style={{padding:"1vh",borderRadius:'1.5vh', opacity:0, pointerEvents:'none'}} href={'/'}><i className="fa fa-chevron-left" aria-hidden="true"></i>&nbsp;&nbsp;</Link>
        </div>
    )
}