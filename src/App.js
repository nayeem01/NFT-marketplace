import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import Nav from "./components/Nav";
import MintItem from "./components/Mint";
import MyNfts from "./components/MyNfts";
function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Nav />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="mint" element={<MintItem />} />
                    <Route path="mynfts" element={<MyNfts />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
