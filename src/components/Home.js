import React from "react";
import { Card, Button, Container, Row, Col } from "react-bootstrap";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "../nftAddresses";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const Home = () => {
    const [nfts, setNFts] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");

    async function loadNFTs() {
        // what we want to load:
        // ***provider, tokenContract, marketContract, data for our marketItems***

        const provider = new ethers.providers.JsonRpcProvider();
        const tokenContract = new ethers.Contract(
            nftaddress,
            NFT.abi,
            provider,
        );
        const marketContract = new ethers.Contract(
            nftmarketaddress,
            NFTMarket.abi,
            provider,
        );
        const data = await marketContract.fetchMarketTokens();

        const items = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await tokenContract.tokenURI(i.tokenId);
                // we want get the token metadata - json
                const meta = await axios.get(tokenUri);
                let price = ethers.utils.formatUnits(
                    i.price.toString(),
                    "ether",
                );
                let item = {
                    price,
                    tokenId: i.tokenId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                };
                return item;
            }),
        );

        setNFts(items);
        setLoadingState("loaded");
    }

    useEffect(() => {
        loadNFTs();
    }, []);

    async function buyNFT(nft) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
            nftmarketaddress,
            NFTMarket.abi,
            signer,
        );

        const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
        const transaction = await contract.createMarketSale(
            nftaddress,
            nft.tokenId,
            {
                value: price,
            },
        );
    }

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col xs lg="2">
                    {nfts.map((nft, index) => (
                        <Card style={{ width: "18rem", marginTop: "10px" }}>
                            <Card.Img variant="top" src="holder.js/100px180" />
                            <Card.Body>
                                <Card.Title>Card Title</Card.Title>
                                <Card.Text>
                                    Some quick example text to build on the card
                                    title and make up the bulk of the card's
                                    content.
                                </Card.Text>
                                <Button variant="primary">Go somewhere</Button>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
            </Row>
        </Container>
    );
};

export default Home;
