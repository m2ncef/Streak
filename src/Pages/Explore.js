import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MovieCard from '../Components/MovieCard'
import Nav from "../Components/Nav";
import Loading from "../Components/Loading";
export default function Explore () {
    const params = useParams()
    const [movie, setMovie] = useState([])
    const [pageCounter, setPageCounter] = useState(1)
    const imgPath = 'https://image.tmdb.org/t/p/w342'
    async function fetchSearch(q){
        const search = await fetch(`https://api.themoviedb.org/3/search/${params.q}?query=${q}&api_key=84120436235fe71398e95a662f44db8b`)
        const searchData = await search.json()
        const card = []
        for(const i in searchData.results){
            card.push({
                img: `${imgPath}${searchData.results[i].poster_path}`,
                id: searchData.results[i].id
            })
            setMovie(card)
        }
    }
    const HandleSearch = () => {
        var search = document.querySelector(".searchBar input").value
        fetchSearch(search)
    }
    useEffect(()=>{
        async function fetchExplore(){
            const explore = await fetch(`https://api.themoviedb.org/3/discover/${params.q}?api_key=84120436235fe71398e95a662f44db8b&page=${pageCounter}`)
            const exploreData = await explore.json()
            const card = []
            for(const i in exploreData.results){
                card.push({
                    img: `${imgPath}${exploreData.results[i].poster_path}`,
                    id: exploreData.results[i].id
                })
                setMovie(card)
            }
        }
        fetchExplore()
    }, [params.q, pageCounter])
    return(
        <>
            <Nav/>
            <div className="searchBar">
                <input type="text" placeholder="Type to search..."></input>
                <button onClick={HandleSearch}>Search</button>
            </div>
            <div className="exploreTypes">
                <Link to={'/explore/tv'}>Shows</Link>
                <Link to={'/explore/movie'}>Movie</Link>
            </div>
             <section className="explore">
                {movie.map((m)=>{
                    return <MovieCard img={m.img} id={m.id} show={params.q == 'tv' ? 'true' : 'false'}></MovieCard>
                })}
                <a href="#" className="loadMore" onClick={()=>setPageCounter(pageCounter + 1)}>Load More</a>
            </section>
        </>
    )
}