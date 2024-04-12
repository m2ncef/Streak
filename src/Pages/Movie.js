import { useParams } from "react-router-dom";
import Nav from "../Components/Nav";
import { useEffect, useState } from "react";
import MovieCard from '../Components/MovieCard'
import Footer from "../Components/Footer";
import Loading from "../Components/Loading";
import { toast } from "react-hot-toast";
import MovieScraper from "../Components/MovieScraper";
import AdBanner from '../Components/AdBanner'
export default function Movie() {
    const [similar, setSimilar] = useState([])
    const [recom, setRecom] = useState([])
    const [player, setPlayer] = useState(false)
    const [data, setData] = useState("")
    const params = useParams()
    function saveToLibrary(data) {
        document.querySelector(".ListButton").classList.add("buttonDisabled")
        var a = [];
        a = JSON.parse(localStorage.getItem('library')) || [];
        a.push(data);
        localStorage.setItem('library', JSON.stringify(a));
        toast.success('Added To Your List.', {
            position: "bottom-center"
        })
    }
    function openPlayer() {
        setPlayer(true)
        document.querySelector(".Player").style.display = "flex"
    }
    useEffect(() => {
        document.querySelector(".close").addEventListener('click', function () {
            document.querySelector(".Player").style.display = "none"
            if (document.querySelector(".Player video")) {
                document.querySelector(".Player video").pause()
            }
        })
        document.querySelector(".Loader").style.opacity = '1'
        document.querySelector(".Loader").style.zIndex = '999999'
        const fetchData = async () => {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${params.id}?api_key=84120436235fe71398e95a662f44db8b`)
            const data = await res.json()
            setData(data)
            for (const i in data.genres) {
                document.querySelector(".genres").innerHTML += `<span>${data.genres[i].name}</span>`
            }
            document.querySelector(".ListButton").classList.remove("buttonDisabled")
            document.title = `Streak  | ${data.title}`
            await setTimeout(function () {
                document.querySelector(".Loader").style.opacity = '0'
                document.querySelector(".Loader").style.zIndex = '-1'
            }, 2000)
            const recommendations = await fetch(`https://api.themoviedb.org/3/movie/${params.id}/recommendations?api_key=84120436235fe71398e95a662f44db8b`)
            const recomData = await recommendations.json()
            const card = []
            for (const i in recomData.results) {
                card.push({
                    img: recomData.results[i].poster_path,
                    id: recomData.results[i].id
                })
                setRecom(card)
            }
            const similar = await fetch(`https://api.themoviedb.org/3/movie/${params.id}/similar?api_key=84120436235fe71398e95a662f44db8b`)
            const similarData = await similar.json()
            const card1 = []
            for (const i in similarData.results) {
                card1.push({
                    img: similarData.results[i].poster_path,
                    id: similarData.results[i].id
                })
                setSimilar(card1)
            }
        }
        fetchData()
        document.querySelector(".genres").innerHTML = ""
    }, [params.id])
    return (
        <>
            <Loading />
            <img className="MovieBackground" src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}></img>
            <img className="backdrop" src={data.backdrop_path && `https://image.tmdb.org/t/p/w500${data.backdrop_path}`}></img>
            <Nav />
            <div>
                <div className="mainInfosContainer">
                    <div className="MovieInfos">
                        <img src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}></img>
                        <div>
                            <h2>{data.title}</h2>
                            <p style={{ color: '#505050', fontSize: '15px', fontStyle: 'italic', fontWeight: '500', textShadow: '0 0 5px #151515' }}>{data.tagline}</p><br />
                            <div style={{display:'flex', flexDirection:'row'}}>
                                <a className="ListButton" href="#" onClick={() => saveToLibrary(`/movie/${params.id}`)}><i className="fa fa-bookmark" aria-hidden="true"></i>&nbsp;&nbsp;List</a>
                                <a href="#" onClick={() => openPlayer()}><i className="fa fa-play" aria-hidden="true"></i>&nbsp;&nbsp;Play</a>
                            </div>
                        </div>
                    </div>
                    <div style={{ margin: '0 3vh' }}>
                        <div className="genres"></div>
                        <p className="rating">⭐️ {data.vote_average}/10 • 👥 {data.popularity}</p>
                        <p className="desc">{data.overview}</p>
                        <p className="DateAndLangs">🌐 {data ? data.spoken_languages[0].english_name : 'English'} • 📅 {data.release_date}</p>
                    </div>
                </div>
                <div style={{ margin: '3vh' }}>
                    {(recom.length > 1) && (<>
                        <h3>Recommendations</h3>
                        <section className="recom">
                            {recom.map((m, i) => {
                                return <MovieCard img={m.img} id={m.id}></MovieCard>
                            })}
                        </section>
                    </>)}
                    {(similar.length > 1) && (
                        <>
                            <h3>Similar</h3>
                            <section className="recom">
                                {similar.map((m) => {
                                    return <MovieCard img={m.img} id={m.id}></MovieCard>
                                })}
                            </section>
                        </>
                    )}
                </div>
                <div className="Player">
                    <div className="close"><i className="fa fa-times" aria-hidden="true"></i></div>
                    {player && (<MovieScraper id={params.id} />)}
                </div>
            </div>
            <Footer />
        </>
    )
}