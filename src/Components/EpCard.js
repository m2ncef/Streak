export default (props) => {
    const openIframe = () => {
        window.location.href = '#'
        sessionStorage.setItem('ep', props.number)
        document.querySelector(".Player").style.display = 'flex'
    }
    return(
    <div className="EPCard" onClick={openIframe}>
        <p style={{margin:0, fontSize:'small', color:'dimgray'}}>Ep {props.number} • {props.minutes}mins • {props.vote}/10</p>
        <img src={props.img}></img>
        <p style={{margin:0}}>{props.title}</p>
    </div>
    )
}