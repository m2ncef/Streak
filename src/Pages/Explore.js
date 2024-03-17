import { Link, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MovieCard from '../Components/MovieCard'
import Nav from "../Components/Nav";
import Footer from "../Components/Footer";
import Loading from "../Components/Loading";
import AdBanner from '../Components/AdBanner'
export default function Explore (props) {
    const loc = useLocation()
    const params = useParams()
    const [movie, setMovie] = useState([])
    const [loader, setLoader] = useState(false)
    const [pageCounter, setPageCounter] = useState(1)
    async function fetchSearch(q){
        const search = await fetch(`https://api.themoviedb.org/3/search/${params.q ? params.q : props.type}?query=${q}&api_key=84120436235fe71398e95a662f44db8b&include_adult=false`)
        const searchData = await search.json()
        const card = []
        for(const i in searchData.results){
            card.push({
                img: searchData.results[i].poster_path,
                id: searchData.results[i].id
            })
            setMovie(card)
        }
    }
    useEffect(()=>{
        if((params.q ? params.q : props.type )== 'tv'){
            document.querySelector("#root > div.exploreTypes > a:nth-child(2)").classList.remove('selected')
            document.querySelector("#root > div.exploreTypes > a:nth-child(1)").classList.add('selected')
        } else {
            document.querySelector("#root > div.exploreTypes > a:nth-child(2)").classList.add('selected')
            document.querySelector("#root > div.exploreTypes > a:nth-child(1)").classList.remove('selected')
        }
        document.querySelector(".searchBar input").addEventListener('change', function(){
            fetchSearch(document.querySelector(".searchBar input").value)
        })
        async function fetchExplore(){
            const explore = await fetch(`https://api.themoviedb.org/3/discover/${params.q ? params.q : props.type}?api_key=84120436235fe71398e95a662f44db8b&page=${pageCounter}?include_adult=false?sort_by=popularity.asc`)
            const exploreData = await explore.json()
            const card = []
            for(const i in exploreData.results){
                card.push({
                    img: exploreData.results[i].poster_path,
                    id: exploreData.results[i].id
                })
                setMovie(card)
            }
        }
        fetchExplore()
    }, [params.q, pageCounter, props.type])
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
                <input type="text" placeholder="Type to search..." onChange={(e)=>fetchSearch(e.target.value)}></input>
                <button onClick={()=>fetchSearch(document.querySelector(".searchBar input[type='text']").value)}>Search</button>
            </div>
            <div className="exploreTypes">
                <Link to={'/tv'} onClick={handleClick}>Shows</Link>
                <Link to={'/movie'} onClick={handleClick}>Movie</Link>
            </div>
            <AdBanner/>
             <section className="explore">
                <div>
                    {movie.map((m)=>{
                        return <MovieCard img={m.img} id={m.id} show={(params.q ? params.q : props.type) == 'tv' ? 'true' : 'false'}></MovieCard>
                    })}
                </div>
                <a href="#" className="loadMore" onClick={()=>setPageCounter(pageCounter + 1)}>Load More</a>
            </section>
            <Footer/>
        </>
    )
}