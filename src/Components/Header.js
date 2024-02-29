import { Link } from "react-router-dom";

export default function Header(){
    return(
        <div className="Header">
            <Link to={'/settings'}>
                <i className="fa fa-cog" aria-hidden="true"></i>
            </Link>
            <div>
                <h1>Streak</h1>
            </div>
            <Link to={'/tv'}>
                <i className="fa fa-search" aria-hidden="true"></i>
            </Link>
        </div>
    )
}