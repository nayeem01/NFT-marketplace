import React from "react";
import { Card, Container, Row, Col, ButtonGroup } from "react-bootstrap";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "../nftAddresses";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json";

const MyNfts = () => {
    const [nfts, setNfts] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        const web3Modal = new Web3Modal({
            network: "mainnet",
            cacheProvider: true,
        });
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(
            nftmarketaddress,
            Market.abi,
            signer,
        );
        const tokenContract = new ethers.Contract(
            nftaddress,
            NFT.abi,
            provider,
        );
        const data = await marketContract.fetchMyNFTs();

        const items = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await tokenContract.tokenURI(i.tokenId);
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
                    name: meta.data.name,
                    image: meta.data.image,
                };
                return item;
            }),
        );
        setNfts(items);
        setLoadingState("loaded");
    }
    if (loadingState === "loaded" && !nfts.length)
        return <h1>No items in marketplace</h1>;
    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Col xs lg="2">
                    {nfts.map((nft, index) => (
                        <Card
                            style={{ width: "18rem", marginTop: "10px" }}
                            key={index}
                        >
                            <Card.Img variant="top" src={nft.image} />
                            <Card.Body>
                                <Card.Title>{nft.name}</Card.Title>

                                <Row>
                                    <Col sm={8}>
                                        <ButtonGroup aria-label="Third group">
                                            <p variant="primary">
                                                {nft.price} ETH
                                            </p>
                                        </ButtonGroup>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
            </Row>
        </Container>
    );
};

export default MyNfts;
