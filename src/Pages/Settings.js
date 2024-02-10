import { useEffect } from "react";
import Loading from "../Components/Loading";
import Nav from '../Components/Nav'
import Icon from '../Components/icon.png'
import { useNavigate } from "react-router-dom";
export default () => {
    let navigate = useNavigate()
    return(
        <>
        <Loading/>
        <Nav/>
        <div>
            <div className="webappDetails">
                <img style={{marginBottom:"2vh"}} src={Icon}></img>
                <h3>Streak</h3>
                <h4>ZERO ADS STREAMING</h4>
                <h5 style={{margin:'5px'}}>Developed by <font style={{color:'plum'}} onClick={()=>window.open('https://instagram.com/m2ncef', '_blank')}>moncef</font></h5>
            </div>
            <div className="infosContainer">
                <h4 style={{marginLeft:"1vh"}}>Your Profile</h4>
                <div className="userInfos">
                    <h1>{localStorage.getItem("UserEmoji")}</h1>
                    <div style={{display:'flex',flexDirection:'column'}}>
                        <p>Your PIN: </p>
                        <p>{localStorage.getItem("UserPIN")}</p>
                    </div>
                </div>
                <h4 onClick={()=>{
                localStorage.clear()
                sessionStorage.clear()
                navigate('/')
                }}>Logout</h4>
            </div>
        </div>
        </>
    )
}