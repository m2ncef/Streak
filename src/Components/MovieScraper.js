import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets, NotFoundError } from '@movie-web/providers'
import { useEffect, useState, useRef } from 'react';
import { getName } from 'iso-639-1';
import ReactOPlayer from '@oplayer/react';
import hls from '@oplayer/hls'
import ui from '@oplayer/ui'
import Hls from 'hls.js';
import AdBig from './AdBig'
import AdBanner from './AdBanner'

export default (props) => {
    const [streamLink, setStreamLink] = useState("");
    const [captions, setCaptions] = useState([]);
    const [isHls, setIsHls] = useState(false)
    const [OutputError, setOutputError] = useState(false)
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
                        target: targets.ANY,
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
                    if (!output) {
                        setOutputError(true)
                    }
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
    const plugins = [
        ui({
            slideToSeek: 'always',
            subtitle: {
                source: captions.map((caption) => ({ name: getName(`${caption.language}`), src: caption.url }))
            },
            theme: {
                primaryColor: "rgb(255 69 12)",
                watermark: {
                    src: "https://i.imgur.com/nYUdCJR.png",
                    style: {
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '120px',
                        height: 'auto',
                        filter: 'contrast(0.1) opacity(0.5)'
                    },
                    attrs: {
                        class: "watermark",
                    },
                },
            },
        }),
        hls({ forceHLS: true, withBitrate: true }),
    ]
    return (
        <>
            {(!loading && streamLink) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vh', width: '75vw' }}>
                    {/* <Artplayer
                        option={{
                            url: (isHls && streamLink),
                            fullscreen: true,
                            poster: thumbnail,
                            setting: true,
                            playbackRate: true,
                            autoplay: false,
                            customType: {
                                m3u8: playM3u8,
                            },
                            settings: [
                                {
                                    html: (captions == []) ? 'Subtitles' : 'Subtitles Not Available',
                                    selector: (captions) && (captions.map(caption => ({ html: caption.language, url: caption.url }))),
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
                            width: '90vw',
                            height: '40vw',
                        }}
                    /> */}
                    <ReactOPlayer plugins={plugins} source={{
                        src: streamLink,
                        poster: thumbnail
                    }} />
                </div>
            ) : (OutputError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}>
                    Source Not Found
                    {/* <br /><AdBig /><br /> */}
                    m9drtch nelgah, smhli hbb hhhh
                </div>) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}>
                    <p>sbr chwiya sahbi...</p>
                    {/* <AdBig /> */}
                </div>))}
        </>
    )
}
