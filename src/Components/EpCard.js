export default (props) => {
    const openIframe = () => {
        window.location.href = '#'
        sessionStorage.setItem('ep', props.number)
        document.querySelector(".Player").style.display = 'flex'
    }
    return(
    <div className="EPCard" onClick={openIframe}>
        <p>Episode {props.number}</p>
        <img src={props.img}></img>
    </div>
    )
}