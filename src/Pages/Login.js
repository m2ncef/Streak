import { EmojiButton } from '@joeattardi/emoji-button';
import { useEffect } from 'react';
import Footer from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
export default () => {
    var navigate = useNavigate()
    function startWatching () {
        if(document.querySelector(".User input").value.length==4 && localStorage.getItem("UserEmoji")){
            document.querySelector(".User input").style.border = '1px solid green'
            localStorage.setItem("UserPIN", document.querySelector(".User input").value)
            sessionStorage.setItem("L", true)
            setTimeout(() => {
                navigate('/home')
            }, 500);
        if(!localStorage.getItem("UserEmoji")){
            document.querySelector(".trigger").style.border = "1px solid red"
        }
        } else {
            document.querySelector(".User input").style.border = '1px solid red'
        }
    }
    function login(){
        if((document.querySelector(".User input").value==localStorage.getItem("UserPIN")) && localStorage.getItem("UserEmoji")){
            document.querySelector(".User input").style.border = '1px solid green'
            sessionStorage.clear()
            setTimeout(() => {
                navigate('/home')
            }, 500);
        } else {
            document.querySelector(".User input").style.border = '1px solid red'
        }
    }
    useEffect(()=>{
        const picker = new EmojiButton();
        const trigger = document.querySelector('.trigger');
        picker.on('emoji', selection => {
            trigger.innerHTML = selection.emoji;
            localStorage.setItem("UserEmoji", selection.emoji)
        });
        if(trigger){
            trigger.addEventListener('click', () => {
                picker.togglePicker(trigger)
            });
        }
    }, [])
    if(!localStorage.getItem("UserPIN")){
        return(
            <div className='loginContainer'>
                <div className='User'>
                    <p style={{marginBottom:'5vh'}}>Create Your Watching Profile</p>
                    <h1 className='trigger'>🧑🏻‍🦱</h1>
                    <input type='password' maxLength={4} placeholder='4 Digits' id='pinCode'></input>
                    <button onClick={()=>startWatching()}>Start Watching</button>
                </div>
                <Footer style={{position:'fixed', bottom:0}}/>
            </div>
        )
    }
    else {
        return(
            <div className='loginContainer'>
                <div className='User'>
                    <p style={{marginBottom:'5vh'}}>Login to your profile</p>
                    <h1>{localStorage.getItem("UserEmoji")}</h1>
                    <input type='password' maxLength={4} placeholder='Your PIN' id='pinCode'></input>
                    <button onClick={()=>login()}>Start Watching</button>
                </div>
                <Footer style={{position:'fixed', bottom:0}}/>
            </div>
        )
    }
}