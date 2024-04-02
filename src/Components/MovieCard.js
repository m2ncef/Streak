import { useEffect } from "react";

export default function Card(props) {
    const imgPath = 'https://image.tmdb.org/t/p/w342';
    
    useEffect(() => {
        if (!/null/.test(props.img) && document.querySelector(".recom")) {
            document.querySelectorAll(".recom").forEach(sct => {
                sct.scrollTo(0, 0);
            });
        }
    }, [props.img]);

    if (!/null/.test(props.img)) {
        return (
            <a href={`/${props.show === 'true' ? 'tv' : 'movie'}/${props.id}`} className="movieCard">
                <img src={`${imgPath}${props.img}`} alt="Movie Thumbnail"></img>
            </a>
        );
    }

    return null;
}
```
