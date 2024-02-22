import { useEffect, useState } from "react";
import Loading from "../Components/Loading";
import Nav from '../Components/Nav'
import Icon from '../Components/icon.png'
import { useNavigate } from "react-router-dom";
import Footer from "../Components/Footer";
export default () => {
    const [lastMessage, setlastMessage] = useState("")
    const [lastUpdate, setlastUpdate] = useState("")
    let navigate = useNavigate()
    useEffect(()=>{
        fetch('https://api.github.com/repos/m2ncef/Streak/commits')
        .then(r=>r.json())
        .then(data=>{
            setlastMessage(`Updates: ${data[0].commit.message}, done by ${data[0].commit.committer.name}`)
            var dateString = data[0].commit.committer.date
            var date = new Date(dateString)
            const formattedDate = date.toLocaleString();
            setlastUpdate(formattedDate)
        })
    })
    return(
        <>
        <Loading/>
        <Nav/>
        <div>
            <div className="webappDetails">
                <img src={Icon}></img>
                <h3 style={{margin:"1vh"}}>Streak</h3>
                <h4>Movies & Series without Ads !</h4>
                <h5 style={{margin:'5px'}}>Developed by <font style={{color:'#ff742d'}} onClick={()=>window.open('https://instagram.com/m2ncef', '_blank')}>moncef</font></h5>
                <br/>
                <div style={{color:'gray', margin:'2vh 0vh -2vh 0vh', fontSize:'small', textAlign:'center'}}>
                    <p style={{lineHeight:"2vh", margin:"1vh 3vh"}}>{lastMessage} at {lastUpdate}</p>
                </div>
            </div>
            <div className="infosContainer">
                {/* <h4 style={{marginLeft:"3vh"}}>Your Profile</h4>
                <div className="userInfos">
                    <h1>{localStorage.getItem("UserEmoji")}</h1>
                    <div style={{display:'flex',flexDirection:'column'}}>
                        <p>Your PIN: </p>
                        <p>{localStorage.getItem("UserPIN")}</p>
                    </div>
                </div> */}
                <h2 style={{margin:'2vh'}}>Credits</h2>
                <p style={{margin:'0vh 2vh'}}>APIs Used</p>
                <a href="https://www.themoviedb.org/" target="_blank">TMDB (Fetching Titles, Images, Trendings...)</a>
                <a href="https://github.com/m2ncef/streak" target="_blank">Streak-API (Fetching streaming links & captions)</a>
                <a href="https://artplayer.org/document/en" target="_blank">ArtPlayer (.m3u8 streaming links player)</a>
                <p>Streak-API does not host any files, it merely links to 3rd party services. Legal issues should be taken up with the file hosts and providers. Streak is not responsible for any media files shown by the video providers.</p>
            </div>
            <div className="settingsList">
                <h4 onClick={()=>{
                    localStorage.setItem("Library", '')
                }}>Clear Library</h4>
                <h4 onClick={()=>{
                    localStorage.setItem("UserPIN", '')
                    localStorage.setItem("UserEmoji", '')
                    navigate('/')
                }} style={{color:'red'}}>Delete Profile</h4>
            </div>
        </div>
        <Footer/>
        </>
    )
}