import React, { useEffect, useState } from 'react';
import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets, NotFoundError } from '@movie-web/providers'
import Artplayer from './ArtPlayer';
import Hls from 'hls.js';
import AdBig from './AdBig'
import AdBanner from './AdBanner'

export default (props) => {
    const [streamLink, setStreamLink] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [OutputError, setOutputError] = useState(false)
    const [isHls, setIsHls] = useState(false)
    const API_KEY = '84120436235fe71398e95a662f44db8b';
    const TV_ID = props.id;
    const SEASON_NUMBER = props.s;
    const EPISODE_NUMBER = props.e;
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
                    if (!output) {
                        setOutputError(true)
                    }
                    setIsHls(true)
                    setStreamLink(output.stream.playlist);
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
                <>
                    <AdBanner />
                    <Artplayer
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
                            width: '90vw',
                            height: '40vw',
                        }}
                    />
                </>
            ) : (OutputError ? (
                <div>
                    <AdBanner />
                    Source Not Found<br />m9drtch nelgah, smhli hbb hhhh
                </div>) : (
                <div>
                    <AdBig />
                    <p>sbr chwiya sahbi...</p>
                </div>))}
        </>
    );
};
