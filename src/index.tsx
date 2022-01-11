import React from "react"
import ReactDOM from "react-dom"
import "./index.scss"
import App from "./App"
import { BrowserRouter } from "react-router-dom";

// https://caniuse.com/mdn-javascript_builtins_array_flatmap
require('array.prototype.flatmap').shim()

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
