import React from "react";
import "./styles/toaster.scss"

const Toaster = (props) => {
  const {show, text} = props;

  return (
    <div id="toaster" className={show ? "show" : ""} {...props}>
      <p className="toaster-text">{text}</p>
    </div>
  );
}

export default Toaster;