import { Link } from "react-router-dom";

export default function Card(props){
    if (props.img == 'https://image.tmdb.org/t/p/w500null') {
        console.log(`${props.id} doesnt have a poster`)
    }
    else {
        return(
            <>
            <Link href='#' className="movieCard" to={`/${props.show === 'true' ? 'tv' : 'movie'}/${props.id}`}>
                <img src={props.img}></img>
            </Link>
            </>
        )
    }
}