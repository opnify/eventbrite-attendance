import React from "react";
import "./styles/toaster.scss"

const Toaster = (props) => {
  const {show, text, type} = props;

  return (
    <div id="toaster" className={show ? "show" : ""} data-bg={type === "warning" ? "warning" : "error"}>
      <p className="toaster-text">{text}</p>
    </div>
  );
}

export default Toaster;