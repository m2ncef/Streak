import React, { useEffect } from 'react'

export default function AdTest() {
    useEffect(() => {
        const script = document.createElement('script');
        script.async = true;
        script.src = '//thubanoa.com/1?z=7242303';
        script.setAttribute('data-cfasync', 'false');
        document.body.appendChild(script);
    
        return () => {
          document.body.removeChild(script);
        };
      }, []);
    return (
        <div></div>
    )
}
