import React, { useEffect, useState } from 'react';
import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets, NotFoundError } from '@movie-web/providers'
import { getName } from 'iso-639-1';
import ReactOPlayer from '@oplayer/react';
import hls from '@oplayer/hls'
import ui from '@oplayer/ui'
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
                        target: targets.ANY,
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
                    <ReactOPlayer plugins={plugins} source={{
                        src: streamLink,
                        poster: thumbnail
                    }} />
                </div>
            ) : (OutputError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}>
                    Source Not Found
                    m9drtch nelgah, smhli hbb hhhh
                </div>) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1vh' }}>
                    <p>sbr chwiya sahbi...</p>
                </div>))
            }
        </>
    );
};
