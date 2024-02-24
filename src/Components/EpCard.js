export default (props) => {
    const openIframe = () => {
        window.location.href = '#'
        sessionStorage.setItem('ep', props.number)
        document.querySelector(".Player").style.display = 'flex'
    }
    return (
        <div className="EPCard" onClick={openIframe}>
            <p id='epNumber' style={{ display: "none" }}>{props.epNumber}</p>
            <p style={{ margin: 0, fontSize: 'smaller', color: 'dimgray' }}>Ep {props.number} • {props.minutes}mins • {String(props.vote).slice(0, 3)}/10</p>
            <img src={props.img}></img>
            <p style={{ margin: 0 }}>{props.title}</p>
        </div>
    )
}