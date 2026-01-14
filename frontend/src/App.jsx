import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/style.scss";
import { ToastContainer, toast } from "react-toastify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "./helper/routes.jsx";

function App() {
  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Router>
    </>
  );
}

export default App;
