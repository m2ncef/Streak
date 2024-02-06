import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets } from '@movie-web/providers'
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
export default ()=>{
    const params = useParams()
    const [streamLink, setStreamLink] = useState("")
    const [captions, setCaptions] = useState([]);
    const API_KEY = '84120436235fe71398e95a662f44db8b';
    const TV_ID = params.id;
    const SEASON_NUMBER = params.s;
    const EPISODE_NUMBER = params.e;
    useEffect(()=>{
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
            return episodeData.id;
        }
        fetch(`https://api.themoviedb.org/3/tv/${params.id}?api_key=84120436235fe71398e95a662f44db8b`)
        .then(r=>r.json())
        .then(data=>{
            async function scrape(){
                const proxyUrl = 'https://proxy.f53.dev/'
                const providers = makeProviders({
                fetcher: makeStandardFetcher(fetch),
                proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
                target: targets.BROWSER,
                })
                const media = {
                    type: 'show',
                    title: data.name,
                    releaseYear: data.first_air_date.substr(0, 4),
                    tmdbId: data.id,
                    season: {
                        number: 1,
                        tmdbId: await seasonID()
                    },
                    episode: {
                        number: 1,
                        tmdbId: await episodeID()
                    }
                }
                const flixhqStream = await providers.runAll({
                    media: media,
                  })
                setStreamLink(flixhqStream.stream.playlist)
                setCaptions(flixhqStream.stream.captions);
            }
            scrape()
        })
    }, [])
  return(
        <ReactPlayer
                style={{display:'flex', margin:'0 auto'}}
                url={streamLink}
                controls={true}
                width="100%"
                height="100%"
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'true',
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
  )
}