import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets, NotFoundError } from '@movie-web/providers'
import { useEffect, useState } from 'react';
import Plyr from "plyr-react"
import "plyr-react/plyr.css"

export default (props) => {
    const [streamLink, setStreamLink] = useState("");
    const [captions, setCaptions] = useState([]);
    const [thumbnail, setThumbnail] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        fetch(`https://api.themoviedb.org/3/movie/${props.id}?api_key=84120436235fe71398e95a662f44db8b`)
            .then(r => r.json())
            .then(data => {
                setThumbnail(`https://image.tmdb.org/t/p/w500${data.backdrop_path}`);
                async function scrape() {
                    const proxyUrl = 'https://streak-api.netlify.app/';
                    const providers = makeProviders({
                        fetcher: makeStandardFetcher(fetch),
                        proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
                        target: targets.BROWSER,
                      })
                    const media = {
                        type: 'movie',
                        title: data.title,
                        releaseYear: data.release_date.substring(0, 4),
                        tmdbId: props.id
                    };
                    const output = await providers.runAll({
                        media: media,
                        sourceOrder: ['flixhq']
                    });
                    setStreamLink(output.stream.playlist);
                    if (!output.stream.playlist) {
                        if (output.stream.qualities && output.stream.qualities["720"] && output.stream.qualities["720"].url) {
                            setStreamLink(output.stream.qualities["720"].url);
                        } else if (output.stream.qualities && output.stream.qualities["420"] && output.stream.qualities["420"].url) {
                            setStreamLink(output.stream.qualities["420"].url);
                        } else {
                            setStreamLink(output.stream.qualities["360"].url);
                        }
                    }                    
                    setCaptions(output.stream.captions);
                    setLoading(false);
            }
            scrape();
        })
    }, [props.id])
    return (
        <>
            {(!loading && streamLink) ? ( 
                <Plyr
                    source={{
                        type: 'video',
                        sources: [{
                            src: streamLink
                        }],
                        playsinline: true,
                        autoplay: true,
                        fullscreen: { enabled: true, fallback: true, iosNative: false, container: null },
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
                        poster: thumbnail,
                        tracks: captions.map(caption=>({
                            kind: 'captions',
                            src: caption.url,
                            srclang: caption.language,
                            label: caption.language,
                        }))
                    }}
                />
            ) : <div>Loading... sbr chwiya sahbi</div>}
        </>
    )
}
