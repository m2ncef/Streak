import { Link, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MovieCard from '../Components/MovieCard'
import Nav from "../Components/Nav";
import Footer from "../Components/Footer";
import Loading from "../Components/Loading";
export default function Explore () {
    const loc = useLocation()
    const params = useParams()
    const [movie, setMovie] = useState([])
    const [loader, setLoader] = useState(false)
    const [pageCounter, setPageCounter] = useState(1)
    const imgPath = 'https://image.tmdb.org/t/p/w342'
    async function fetchSearch(q){
        const search = await fetch(`https://api.themoviedb.org/3/search/${params.q}?query=${q}&api_key=84120436235fe71398e95a662f44db8b&include_adult=false`)
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
        handleClick()
    }
    useEffect(()=>{
        if(params.q == 'tv'){
            document.querySelector("#root > div.exploreTypes > a:nth-child(2)").classList.remove('selected')
            document.querySelector("#root > div.exploreTypes > a:nth-child(1)").classList.add('selected')
        } else {
            document.querySelector("#root > div.exploreTypes > a:nth-child(2)").classList.add('selected')
            document.querySelector("#root > div.exploreTypes > a:nth-child(1)").classList.remove('selected')
        }
        async function fetchExplore(){
            const explore = await fetch(`https://api.themoviedb.org/3/discover/${params.q}?api_key=84120436235fe71398e95a662f44db8b&page=${pageCounter}?include_adult=false?sort_by=popularity.asc`)
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
    function handleClick() {
        setLoader(true);
        setTimeout(() => {
          setLoader(false);
        }, 500)
      }
    return(
        <>
        {loader && <Loading time={2000}/>}
            <Nav/>
            <div className="searchBar">
                <input type="text" placeholder="Type to search..."></input>
                <button onClick={HandleSearch}>Search</button>
            </div>
            <div className="exploreTypes">
                <Link to={'/explore/tv'} onClick={handleClick}>Shows</Link>
                <Link to={'/explore/movie'} onClick={handleClick}>Movie</Link>
            </div>
             <section className="explore">
                <div>
                    {movie.map((m)=>{
                        if(!m.img.includes('null')){
                            return <MovieCard img={m.img} id={m.id} show={params.q == 'tv' ? 'true' : 'false'}></MovieCard>
                        }
                    })}
                </div>
                <a href="#" className="loadMore" onClick={()=>setPageCounter(pageCounter + 1)}>Load More</a>
            </section>
            <Footer/>
        </>
    )
}