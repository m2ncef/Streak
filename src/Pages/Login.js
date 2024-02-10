import { EmojiButton } from '@joeattardi/emoji-button';
import { useEffect } from 'react';
import Footer from '../Components/Footer';
import { useNavigate } from 'react-router-dom';
import toastify from 'toastify-js';
import "toastify-js/src/toastify.css"

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
        } else if(!localStorage.getItem("UserEmoji")){
            toastify({
                text: "Select Your Emoji.",
                duration: 3000,
                gravity: "top",
                position: "center",
                stopOnFocus: true,
                style: {
                  background: "white",
                  color:'black',
                  borderRadius: '1vh'
                },
                onClick: function(){}
              }).showToast();
            document.querySelector(".User h1").style.border = "1px solid red"
        }
        else {
            toastify({
                text: "Enter a 4 digits pin for your profile.",
                duration: 3000,
                gravity: "top",
                position: "center",
                stopOnFocus: true,
                style: {
                  background: "white",
                  color:'black',
                  borderRadius: '1vh'
                },
                onClick: function(){}
              }).showToast();
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
            toastify({
                text: "Incorrect PIN, Try again.",
                duration: 3000,
                gravity: "top",
                position: "center",
                stopOnFocus: true,
                style: {
                  background: "white",
                  color:'black',
                  borderRadius: '1vh'
                },
                onClick: function(){}
              }).showToast();
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
                    <input type='password' maxLength={4} placeholder='4 Digits Code' id='pinCode'></input>
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