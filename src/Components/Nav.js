import { Link } from "react-router-dom"

export default (props) => {
    return(
        <div className={`NavBar`}>
            <Link style={{textDecoration:'none', color:'white', padding:"1vh", fontWeight:'600'}} to={'/'}><i class="fa fa-chevron-left" aria-hidden="true"></i>&nbsp;&nbsp;</Link>
            <div>
                <h1>Streak</h1>
            </div>
            <Link style={{textDecoration:'none', color:'gray', padding:"1vh",background:'#15151566', borderRadius:'1.5vh', opacity:0, pointerEvents:'none'}} to={'/'}>Back</Link>
        </div>
    )
}