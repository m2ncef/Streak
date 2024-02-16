import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets } from '@movie-web/providers'
import { useEffect, useState } from 'react';
import "video-react/dist/video-react.css";
import { Player, ControlBar, ClosedCaptionButton, BigPlayButton } from 'video-react';

export default (props) => {
    const [streamLink, setStreamLink] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_KEY = '84120436235fe71398e95a662f44db8b';
    const TV_ID = props.id;
    const SEASON_NUMBER = props.s;
    const EPISODE_NUMBER = props.e;

    useEffect(() => {
        setLoading(true);
        async function fetchTMDBData(url) {
            try {
                const response = await fetch(url);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching data:', error);
                return null;
            }
        }
        async function seasonID() {
            const url = `https://api.themoviedb.org/3/tv/${TV_ID}/season/${SEASON_NUMBER}?api_key=${API_KEY}`;
            const seasonData = await fetchTMDBData(url);
            return seasonData.id;
        }
        async function episodeID() {
            const url = `https://api.themoviedb.org/3/tv/${TV_ID}/season/${SEASON_NUMBER}/episode/${EPISODE_NUMBER}?api_key=${API_KEY}`;
            const episodeData = await fetchTMDBData(url);
            setThumbnail(`https://image.tmdb.org/t/p/w500${episodeData.still_path}`);
            return episodeData.id;
        }
        fetch(`https://api.themoviedb.org/3/tv/${props.id}?api_key=84120436235fe71398e95a662f44db8b`)
            .then(r => r.json())
            .then(data => {
                async function scrape() {
                    const proxyUrl = 'https://streak-api.netlify.app/';
                    const providers = makeProviders({
                        fetcher: makeStandardFetcher(fetch),
                        proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
                        target: targets.BROWSER,
                    });
                    const media = {
                        type: 'show',
                        title: data.name,
                        releaseYear: data.first_air_date.substr(0, 4),
                        tmdbId: data.id,
                        season: {
                            number: SEASON_NUMBER,
                            tmdbId: await seasonID()
                        },
                        episode: {
                            number: EPISODE_NUMBER,
                            tmdbId: await episodeID()
                        }
                    };
                    const output = await providers.runAll({
                        media: media,
                    });
                    setStreamLink(output.stream.playlist);
                    console.log(output.stream)
                    if (!output.stream.playlist) {
                        if (output.stream.qualities && output.stream.qualities["1080"] && output.stream.qualities["1080"].url) {
                            setStreamLink(output.stream.qualities["1080"].url);
                        } else if (output.stream.qualities && output.stream.qualities["720"] && output.stream.qualities["720"].url) {
                            setStreamLink(output.stream.qualities["720"].url);
                        } else if (output.stream.qualities && output.stream.qualities["420"] && output.stream.qualities["420"].url) {
                            setStreamLink(output.stream.qualities["420"].url);
                        } else if (output.stream.qualities && output.stream.qualities["360"] && output.stream.qualities["360"].url) {
                            setStreamLink(output.stream.qualities["360"].url);
                        }
                    }
                    setCaptions(output.stream.captions);
                    setLoading(false);
                }
                scrape();
            });
    }, [props.id, props.s, props.e]);

    return (
        <>
            {(!loading && streamLink) ? (
                <Player
                    poster={thumbnail}
                    width={'80%'}
                    src={streamLink}
                >
                    <BigPlayButton position="center" />
                    {captions.map(caption=> <track kind='captions' src={caption.url} label={caption.language}/>)}
                    <ControlBar autoHide={true}>
                        {(streamLink.includes(".mp4")) && <DownloadButton/>}
                        <ClosedCaptionButton order={7} />
                    </ControlBar>
                </Player>
            ) : <div>Loading... sbr chwiya sahbi</div>}
        </>
    );
};
