import { useEffect, useState, useRef } from "react";

export default (props) => {
  const [OutputError, setOutputError] = useState(false);
  const [loading, setLoading] = useState(true);
  return (
    <>
      {!loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2vh",
            width: "75vw",
          }}
        >
          <iframe
            width="100%"
            height="100%"
            src={`https://vidsrc.rip/embed/movie/${props.id}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : OutputError ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1vh",
          }}
        >
          Source Not Found
          {/* <br /><AdBig /><br /> */}
          m9drtch nelgah, smhli hbb hhhh
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1vh",
          }}
        >
          <p>sbr chwiya sahbi...</p>
          {/* <AdBig /> */}
        </div>
      )}
    </>
  );
};
