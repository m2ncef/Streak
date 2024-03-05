import { Link } from "react-router-dom";
import Header from "../Components/Header";
import { useEffect, useState } from "react";
import MovieCard from '../Components/MovieCard'
import Footer from "../Components/Footer";
import Loading from "../Components/Loading";
import { useNavigate } from "react-router-dom";
export default function Home() {
    const [link, setLink] = useState(null)
    const [latest, setLatest] = useState([])
    const [trending, setTrending] = useState([])
    const [popular, setPopular] = useState([])
    const [popularTV, setPopularTV] = useState([])
    useEffect(() => {
        document.title = 'Streak '
        const fetchData = async () => {
            const trending = await fetch('https://api.themoviedb.org/3/movie/popular?api_key=84120436235fe71398e95a662f44db8b')
            const trendingData = await trending.json()
            const randomIndex = Math.floor(Math.random() * 20)
            setLink(trendingData.results[randomIndex].id)
            document.querySelector(".MainMovie img").src = `https://image.tmdb.org/t/p/w500${trendingData.results[randomIndex].poster_path}`
            document.querySelector(".MainBackdrop img").src = `https://image.tmdb.org/t/p/w500${trendingData.results[randomIndex].poster_path}`
            document.querySelector(".MainMovieInfos h2").innerHTML = trendingData.results[randomIndex].title
            document.querySelector(".MainMovieDesktop h1").innerHTML = trendingData.results[randomIndex].title
            document.querySelector(".MainMovieDesktop a").href = `/movie/${trendingData.results[randomIndex].id}`
            document.querySelector(".MainMovieDesktop h3").innerHTML = trendingData.results[randomIndex].overview
            document.querySelector(".MainMovieDesktop p").innerHTML = `⭐️ ${String(trendingData.results[randomIndex].vote_average).slice(0,3)}/10 • 👥 ${trendingData.results[randomIndex].popularity} • 📅 ${String(trendingData.results[randomIndex].release_date).slice(0, 4)}`
            document.querySelector(".MainMovieInfos h4").innerHTML = `${trendingData.results[randomIndex].release_date} • ${trendingData.results[randomIndex].vote_average}/10`
            const card = []
            for (const i in trendingData.results) {
                card.push({
                    img: trendingData.results[i].poster_path,
                    id: trendingData.results[i].id
                })
                setTrending(card)
            }
            const popularM = await fetch("https://api.themoviedb.org/3/movie/top_rated?api_key=84120436235fe71398e95a662f44db8b")
            const popularData = await popularM.json()
            const popular = []
            for (const i in popularData.results) {
                popular.push({
                    img: popularData.results[i].poster_path,
                    id: popularData.results[i].id
                })
                setPopular(popular)
            }
            const latest = await fetch("https://api.themoviedb.org/3/trending/tv/week?api_key=84120436235fe71398e95a662f44db8b")
            const latestData = await latest.json()
            const l = []
            for (const i in latestData.results) {
                l.push({
                    img: latestData.results[i].poster_path,
                    id: latestData.results[i].id
                })
                setLatest(l)
            }
            const popularT = await fetch("https://api.themoviedb.org/3/tv/top_rated?api_key=84120436235fe71398e95a662f44db8b")
            const popularTData = await popularT.json()
            const popularTV = []
            for (const i in popularTData.results) {
                popularTV.push({
                    img: popularTData.results[i].poster_path,
                    id: popularTData.results[i].id
                })
                setPopularTV(popularTV)
            }
        }
        fetchData()
    }, [])
    return (
        <>
            <Loading />
            <Header></Header>
            <div className="Container">
                <div className="Types">
                    <h1><Link to='/tv'>Shows</Link></h1>
                    <h1><Link to='/movie'>Movies</Link></h1>
                    <h1><Link to='/list'>My List</Link></h1>
                </div>
                <div className="MainBackdrop">
                    <img width="100%" height="100%" src></img>
                </div>
                <div className="MainMovie">
                    <Link to={`/movie/${link}`}>
                        <img src></img>
                        <div className="MainMovieInfos">
                            <h2></h2>
                            <h4></h4>
                        </div>
                    </Link>
                    <div className="MainMovieDesktop">
                        <h1></h1>
                        <p></p>
                        <h3 style={{margin:0, textAlign:'start', textShadow:'none', fontWeight:300}}></h3>
                        <a className="DesktopBtn"><i className="fa fa-play" aria-hidden="true"></i>&nbsp;&nbsp;Play</a>
                    </div>
                </div>
                <div style={{ margin: "1vh", top: '3vh', position: 'relative' }}>
                    <h2 style={{ marginLeft: '1vh' }}>Trending Movies</h2>
                    <section className="trendingScroll">
                        {trending.map((m) => {
                            return <MovieCard img={m.img} id={m.id}></MovieCard>
                        })}
                    </section>
                    <h2 style={{ marginLeft: '1vh' }}>Popular Movies</h2>
                    <section className="trendingScroll">
                        {popular.map((m) => {
                            return <MovieCard img={m.img} id={m.id}></MovieCard>
                        })}
                    </section>
                    <h2 style={{ marginLeft: '1vh' }}>Latest TV Series</h2>
                    <section className="trendingScroll">
                        {latest.map((m) => {
                            return <MovieCard img={m.img} id={m.id} show='true'></MovieCard>
                        })}
                    </section>
                    <h2 style={{ marginLeft: '1vh' }}>Popular TV Series</h2>
                    <section className="trendingScroll">
                        {popularTV.map((m) => {
                            return <MovieCard img={m.img} id={m.id} show='true'></MovieCard>
                        })}
                    </section>
                </div>
            </div>
            <Footer style={{ position: 'relative', top: '10vh', margin: '1vh' }} />
        </>
    )
}