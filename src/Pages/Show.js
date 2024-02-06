import { useParams } from "react-router-dom";
import Nav from "../Components/Nav";
import { useEffect, useState } from "react";
import MovieCard from '../Components/MovieCard'
import Footer from "../Components/Footer";
import Loading from "../Components/Loading";
import { toast } from "react-hot-toast";
import EpCard from "../Components/EpCard";
import ShowScraper from "../Components/ShowScraper";
export default function Movie(){
    const [similar, setSimilar] = useState([])
    const [recom, setRecom] = useState([])
    const [epCount, setepCount] = useState(1)
    const [sCount, setsCount] = useState(1)
    const [epCard, setEpCard] = useState([])
    const params = useParams()
    function saveToLibrary(data){
        document.querySelector(".ListButton").classList.add("buttonDisabled")
        var a = [];
        a = JSON.parse(localStorage.getItem('library')) || [];
        a.push(data);
        localStorage.setItem('library', JSON.stringify(a));
        toast.success('Added To Your List.', {
            position: "bottom-center"
          })
    }
    useEffect(()=>{
        document.querySelector(".close").addEventListener('click', function(){
            document.querySelector(".Player").style.display = "none"
        })
        document.querySelectorAll(".EPCard").forEach(card => card.onclick = function () {
            var epNumber = card.querySelector('p').textContent.replace(/\D/g, '')
            setepCount(epNumber)
        });
    })
    useEffect(()=>{
        async function EPS(){
            const response = await fetch(`https://api.themoviedb.org/3/tv/${params.id}/season/${document.querySelector("#seasonSelector").value.replace(/\D/g, "")}?api_key=84120436235fe71398e95a662f44db8b`)
            const data = await response.json()
            const EPs = []
            for(const i in data.episodes){
                EPs.push({
                    number: data.episodes[i].episode_number,
                    img: `https://image.tmdb.org/t/p/w185${data.episodes[i].still_path}`
                })
                setEpCard(EPs)
            }
        }
        document.querySelector("#seasonSelector").addEventListener('change', function(){
            setsCount(document.querySelector("#seasonSelector").value.replace(/\D/g, ""))
            EPS()
        })
        document.querySelector(".Loader").style.display = "flex"
        const fetchData = async () =>{
            const res = await fetch(`https://api.themoviedb.org/3/tv/${params.id}?api_key=84120436235fe71398e95a662f44db8b`)
            const data = await res.json()
            document.querySelector(".ListButton").classList.remove("buttonDisabled")
            if(data.backdrop_path == null) {
                document.querySelector(".backdrop").style.display = "none"
            }else {
                document.querySelector(".backdrop").src = `https://image.tmdb.org/t/p/w500${data.backdrop_path}`
            }
            document.querySelector(".MovieInfos img").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`
            document.querySelector(".MovieInfos div h3").innerHTML = data.name
            document.querySelector(".MovieBackground").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`
            document.querySelector(".MovieInfos div p").innerHTML = data.status
            var i = 1;
            while (i<=data.number_of_seasons){
                document.querySelector(".EPS select").innerHTML += `<option>Season ${i}</option>`
                i++
            }
            document.querySelector(".rating").innerHTML =  `⭐️ ${data.vote_average}/10 • 👥 ${data.popularity}`
            document.querySelector(".DateAndLangs").innerHTML =  `🌐 ${data.spoken_languages[0].english_name} • 📅 ${data.first_air_date}`
            document.querySelector(".desc").innerHTML = data.overview
            document.title = `Streak  | ${data.name}`
            for(const i in data.genres){
                document.querySelector(".genres").innerHTML += `<span>${data.genres[i].name}</span>`
            }
            const recommendations = await fetch(`https://api.themoviedb.org/3/tv/${params.id}/recommendations?api_key=84120436235fe71398e95a662f44db8b`)
            const recomData = await recommendations.json()
            const card = []
            for(const i in recomData.results){
                card.push({
                    img: `https://image.tmdb.org/t/p/w500${recomData.results[i].poster_path}`,
                    id: recomData.results[i].id
                })
                setRecom(card)
            }
            const similar = await fetch(`https://api.themoviedb.org/3/tv/${params.id}/similar?api_key=84120436235fe71398e95a662f44db8b`)
            const similarData = await similar.json()
            const card1 = []
            for(const i in similarData.results){
                card1.push({
                    img: `https://image.tmdb.org/t/p/w500${similarData.results[i].poster_path}`,
                    id: similarData.results[i].id
                })
                setSimilar(card1)
            }
            EPS()
        }
        fetchData()
        document.querySelector(".EPS select").innerHTML = ""
        document.querySelector(".genres").innerHTML = ""
    }, [params.id])
    return(
        <>
        <Loading/>
        <img className="MovieBackground"></img>
        <img className="backdrop" src></img>
            <Nav/>
            <div>
                <div className="MovieInfos">
                    <img src=""></img>
                    <div>
                        <p style={{fontSize:'small',fontWeight:'500', backgroundColor:'#151515EE', padding:'1vh', borderRadius:'1vh', color:'#4fff4fcf', width:'fit-content'}}></p>
                        <h3></h3>
                        <a className="ListButton" href="#" onClick={()=>saveToLibrary(`/tv/${params.id}`)}><i className="fa fa-bookmark" aria-hidden="true"></i>&nbsp;&nbsp;List</a>
                    </div>
                </div>
                <div style={{margin:'3vh'}}>
                    <div className="genres"></div>
                    <p className="rating"></p>
                    <p className="desc"></p>
                    <p className="DateAndLangs"></p>
                    <div className="EPS">
                        <select id="seasonSelector"></select>
                        <div className="EPslider">
                            {epCard.map(card=>{
                                return(<EpCard number={card.number} img={card.img}/>)
                            })}
                        </div>
                    </div>
                    <h3>Recommendations</h3>
                    <section className="recom">
                    {recom.map((m)=>{
                        return <MovieCard img={m.img} id={m.id} show='true'></MovieCard>
                    })}
                    </section>
                    <h3>Similar</h3>
                    <section className="recom">
                    {similar.map((m)=>{
                        return <MovieCard img={m.img} id={m.id} show='true'></MovieCard>
                    })}
                    </section>
                </div>
                <div className="Player">
                    <div className="close"><i class="fa fa-times" aria-hidden="true"></i></div>
                    <ShowScraper id={params.id} s={sCount} e={epCount}></ShowScraper>
                    <div style={{zIndex:'-1', margin:'0vh 5vh', position:'fixed'}}>Fetching Data...</div>
                </div>
            </div>
            <Footer/>
        </>
    )
}