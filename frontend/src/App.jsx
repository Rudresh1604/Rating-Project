import { createContext, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

export const userContext = createContext();

function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  return (
    <userContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </userContext.Provider>
  );
}

export default App;
