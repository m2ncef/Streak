import { useEffect } from "react";
import Loading from "../Components/Loading";
import Nav from '../Components/Nav'
import Footer from '../Components/Footer'
export default () => {
    useEffect(()=>{
        const libraryArray = JSON.parse(localStorage.getItem("library"));
        if(libraryArray){
            Promise.all(libraryArray.map((id) =>
            fetch(`https://api.themoviedb.org/3/${id}?api_key=84120436235fe71398e95a662f44db8b`)
                .then((response) => response.json())
                .then((data) => {
                    if(id.includes('movie')){
                        const row = `
                        <a href=${id}>
                            <div class="ListCard">
                            <div class="background-image" style="background-image: url(https://image.tmdb.org/t/p/w500${data.backdrop_path});"></div>
                            <img src='https://image.tmdb.org/t/p/w500${data.poster_path}'></img>
                                <div>
                                    <p>Movie</p>
                                    <h3>${data.title}</h3>
                                    <h5>⭐️ ${data.vote_average}/10</h5>
                                    <h5>${data.release_date}</h5>
                                </div>
                            </div>
                        </a>
                        `;
                        document.querySelector(".Cards").innerHTML += row;
                    } else {
                        const row = `
                        <a href=${id}>
                            <div class="ListCard">
                            <div class="background-image" style="background-image: url(https://image.tmdb.org/t/p/w500${data.backdrop_path});"></div>
                            <img src='https://image.tmdb.org/t/p/w500${data.poster_path}'></img>
                                <div style='line-height:1;'>
                                    <p>TV Show</p>
                                    <h3>${data.name}</h3>
                                    <h5>⭐️ ${data.vote_average}/10</h5>
                                    <h5>${data.first_air_date}</h5>
                                </div>
                            </div>
                        </a>
                        `;
                        document.querySelector(".Cards").innerHTML += row;
                    }
                })
            ))
        }
    }, [])
    return(
        <>
        <Loading/>
        <Nav/>
        <div style={{margin:'1vh'}}>
            <h3 style={{marginLeft:'2vh'}}>My List</h3>
            <div className="Cards"></div>
        </div>
        <Footer/>
        </>
    )
}