import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Card(props){
    if (props.img == 'https://image.tmdb.org/t/p/w500null') {
    }
    else {
        useEffect(()=>{
            if (document.querySelector(".recom")) {
                document.querySelectorAll(".recom").forEach(sct=>{
                    sct.scrollTo(0, 0)
                })
            }
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