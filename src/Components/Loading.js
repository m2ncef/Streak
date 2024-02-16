import React, { useEffect, useState } from "react";
import logo from './icon.png'

export default (props) => {
    useEffect(()=>{
        window.location.href = "#"
        setTimeout(function(){
            document.querySelector(".Loader").style.opacity = '0'
            document.querySelector(".Loader").style.zIndex = '-1'
        }, (props.time ? props.time : 3000))
    })
    return (
        <div className={`Loader`}>
            <img src={logo} alt="Loader icon" />
        </div>
    );
};
