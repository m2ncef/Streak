import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Card(props){
    if (props.img == 'https://image.tmdb.org/t/p/w500null') {
    }
    else {
        useEffect(()=>{
            document.querySelector("#root > div:nth-child(5) > div:nth-child(2) > section:nth-child(6)").scrollTo(0, 0);
            document.querySelector("#root > div:nth-child(5) > div:nth-child(2) > section:nth-child(8)").scrollTo(0, 0);
        })
        return(
            <>
                <Link href='#' className="movieCard" to={`/${props.show === 'true' ? 'tv' : 'movie'}/${props.id}`}>
                    <img src={props.img}></img>
                </Link>
            </>
        )
    }
}