import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets, NotFoundError } from '@movie-web/providers'
import { useEffect, useState, useRef } from 'react';

// import { Player, ControlBar, ClosedCaptionButton, BigPlayButton, LoadingSpinner, PlayToggle } from 'video-react';
// import DownloadButton from './DownloadButton';

import Artplayer from './ArtPlayer';
import Hls from 'hls.js';

// import ReactPlayer from 'react-player';
// import "video-react/dist/video-react.css";

// import { Player } from "react-tuby";
// import "react-tuby/css/main.css";
// import ReactHlsPlayer from 'react-hls-player';

export default (props) => {
    const [streamLink, setStreamLink] = useState("");
    const [captions, setCaptions] = useState([]);
    const [isHls, setIsHls] = useState(false)
    const [thumbnail, setThumbnail] = useState("");
    const [loading, setLoading] = useState(true);
    function playM3u8(video, url, art) {
        if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;
            art.on('destroy', () => hls.destroy());
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
        } else {
            art.notice.show = 'Unsupported playback format: m3u8';
        }
    }
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
                    });
                    setStreamLink(output.stream.playlist);
                    setIsHls(true)
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
                // <ReactPlayer
                //     url={streamLink}
                //     controls
                //     width="80%"
                //     height="30%"
                //     config={{
                //     file: {
                //         tracks: captions.map(subtitle => ({
                //         kind: 'subtitles',
                //         src: subtitle.url,
                //         srcLang: subtitle.language,
                //         })),
                //     },
                //     }}
                // />

                // <Player
                //     autoPlay='true'
                //     preload='auto'
                //     poster={thumbnail}
                //     width={'80%'}
                //     src={streamLink}
                // >
                //     <LoadingSpinner />
                //     <BigPlayButton position="center" />
                //     {captions.map(caption=> <track kind='captions' src={caption.url} label={caption.language}/>)}
                //     <ControlBar autoHide={true} autoHideTime={1000}>
                //         {(streamLink.includes(".mp4")) && <DownloadButton/>}
                //         <ClosedCaptionButton order={7} />
                //     </ControlBar>
                // </Player>

                // <Player
                //     src={streamLink}
                //     subtitles={captions.map((caption) => ({
                //         url: caption.url,
                //         lang: caption.language,
                //         language: caption.language
                //     }))}
                //     poster={thumbnail}
                // >
                //     {(ref, props) => <ReactHlsPlayer playerRef={ref} {...props} />}
                // </Player>

                <Artplayer
                    option={{
                        url: (isHls && streamLink),
                        fullscreen: true,
                        poster: thumbnail,
                        setting: true,
                        playbackRate: true,
                        autoplay: true,
                        customType: {
                            m3u8: playM3u8,
                        },
                        settings: [
                            {
                                html: 'Subtitles',
                                selector: (captions == []) ? 'Not Available' : (captions.map(caption => ({ html: caption.language, url: caption.url }))),
                                onSelect: function (item) {
                                    this.subtitle.url = item.url;
                                    this.subtitle.srcLang = item.language;
                                    this.subtitle.language = item.language;
                                    this.subtitle.kind = "subtitles"
                                    return item.html;
                                },
                            }
                        ],
                        moreVideoAttr: {
                            playsInline: true,
                            src: (!isHls && streamLink),
                            crossorigin: "anonymous",
                        },
                    }}
                    style={{
                        width: '40vh',
                        height: '26vh',
                        margin: '60px auto 0',
                    }}
                />
            ) : <div>sbr chwiya sahbi...</div>}
        </>
    )
}
