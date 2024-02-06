import { makeProviders, makeSimpleProxyFetcher, makeStandardFetcher, targets } from '@movie-web/providers'
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
export default ()=>{
    const params = useParams()
    const [streamLink, setStreamLink] = useState("")
    const [captions, setCaptions] = useState([]);
    useEffect(()=>{
        async function scrape(){
            const proxyUrl = 'https://proxy.f53.dev/'
            const providers = makeProviders({
            fetcher: makeStandardFetcher(fetch),
            proxiedFetcher: makeSimpleProxyFetcher(proxyUrl, fetch),
            target: targets.BROWSER,
            })
            const media = {
                type: 'movie',
                title: params.title,
                releaseYear: params.year,
                tmdbId: params.id
            }
            const flixhqStream = await providers.runAll({
                media: media,
                sourceOrder: ['flixhq']
              })
            setStreamLink(flixhqStream.stream.playlist)
            setCaptions(flixhqStream.stream.captions);
        }
        scrape()
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