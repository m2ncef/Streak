import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets } from '@movie-web/providers'
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

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
                    const proxyUrl = 'https://proxy.f53.dev/';
                    const providers = makeProviders({
                        fetcher: makeStandardFetcher(fetch),
                        proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
                        target: targets.BROWSER,
                    });
                    const media = {
                        type: 'movie',
                        title: data.title,
                        releaseYear: data.release_date.substring(0, 4),
                        tmdbId: props.id
                    };
                    const flixhqStream = await providers.runAll({
                        media: media,
                    });
                    setStreamLink(flixhqStream.stream.playlist);
                    setCaptions(flixhqStream.stream.captions);
                    setLoading(false);
                }
                scrape();
            })
    }, [props.id])
    return (
        <>
            {(!loading && streamLink) ? ( 
                <ReactPlayer
                    style={{ display: 'flex', margin: '0 auto' }}
                    url={streamLink}
                    controls={true}
                    playing={false}
                    width={'90%'}
                    config={{
                        file: {
                            attributes: {
                                allowfullscreen: 'true',
                                poster: thumbnail,
                                crossOrigin: 'true',
                                preload: 'none',
                                playsinline: true
                            },
                            tracks: captions.map(caption => ({
                                kind: 'subtitles',
                                src: caption.url,
                                srcLang: caption.language,
                                default: true
                            }))
                        }
                    }}
                />
            ) : <div>Loading... sbr chwiya sahbi</div>}
        </>
    )
}
