import { useEffect, useRef } from 'react'
export default function Banner() {
    const banner = useRef()

    const atOptions = {
		'key' : '029102634405a9c2dabd7bd8bf03a86c',
		'format' : 'iframe',
		'height' : 60,
		'width' : 468,
		'params' : {}
    }
    useEffect(() => {
        if (banner.current && !banner.current.firstChild) {
            const conf = document.createElement('script')
            const script = document.createElement('script')
            script.type = 'text/javascript'
            script.src = `//www.topcreativeformat.com/${atOptions.key}/invoke.js`
            conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`

            banner.current.append(conf)
            banner.current.append(script)
        }
    }, [banner])

    return <div style={{textAlign:"center", margin:"0 3vh"}} ref={banner}></div>
}