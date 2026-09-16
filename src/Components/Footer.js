"use client";
export default (props) => {
  return (
    <div style={props.style}>
      <p style={{ textAlign: "center", padding: "1vh" }}>
        made by{" "}
        <a
          href="https://moncef.dev"
          target="_blank"
          style={{ textDecoration: "none", color: "skyblue" }}
        >
          moncef
        </a>
        &nbsp;💘
      </p>
    </div>
  );
};
