import React from "react";
import {
    Card,
    Button,
    Container,
    Row,
    Col,
    ButtonGroup,
} from "react-bootstrap";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "../nftAddresses";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/Market.sol/NFTMarket.json";

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
        const data = await marketContract.fetchMarketItems();

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
        await transaction.wait();
        loadNFTs();
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
                                <Card.Text>{nft.description}</Card.Text>

                                <Row>
                                    <Col sm={8}>
                                        <ButtonGroup aria-label="Third group">
                                            <p variant="primary">
                                                {nft.price} ETH
                                            </p>
                                        </ButtonGroup>
                                    </Col>
                                    <Col sm={4}>
                                        <ButtonGroup>
                                            <Button
                                                variant="success"
                                                onClick={() => buyNFT(nft)}
                                            >
                                                Buy
                                            </Button>
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

export default Home;
