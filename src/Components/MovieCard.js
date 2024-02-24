import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Card(props) {
    const imgPath = 'https://image.tmdb.org/t/p/w342'
    if (!/null/.test(props.img)) {
        useEffect(() => {
            if (document.querySelector(".recom")) {
                document.querySelectorAll(".recom").forEach(sct => {
                    sct.scrollTo(0, 0)
                })
            }
        })
        return (
            <a href={`/${props.show === 'true' ? 'tv' : 'movie'}/${props.id}`} className="movieCard">
                <img src={`${imgPath}${props.img}`}></img>
            </a>
        )
    }
}