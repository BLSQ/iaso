import React from "react";
import ReactDOM from "react-dom";

const HelloWorld = () => {
  return <h1>My name is react</h1>;
};

ReactDOM.render(<HelloWorld />, document.getElementById("app"));
