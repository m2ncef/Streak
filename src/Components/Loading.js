import React, { useEffect, useState } from "react";
import logo from './icon.png'

export default () => {
    useEffect(()=>{
        window.location.href = "#"
        setTimeout(function(){
            document.querySelector(".Loader").style.display = 'none'
        }, 3000)
    })
    return (
        <div className={`Loader`}>
            <img src={logo} alt="Loader icon" />
        </div>
    );
};
