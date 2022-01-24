import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import Nav from "./components/Nav";
import MintItem from "./components/Mint";
function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Nav />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="mint" element={<MintItem />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
