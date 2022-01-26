import { useNavigate } from "react-router-dom";
import { Container, Col, Button } from "react-bootstrap";
import { ethers } from "ethers";
import { useState } from "react";
import Web3Modal from "web3modal";
import { create as ipfsHttpClient } from "ipfs-http-client";

import { nftaddress, nftmarketaddress } from "../nftAddresses";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/Market.sol/NFTMarket.json";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

export default function MintItem() {
    const nav = useNavigate();
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({
        price: "",
        name: "",
        description: "",
    });

    const ipfs = async (data) => {
        let url;
        try {
            const added = await client.add(data, {
                progress: (prog) => console.log(`received: ${prog}`),
            });

            url = `https://ipfs.infura.io/ipfs/${added.path}`;

            console.log(added);
        } catch (error) {
            alert(error);
            console.log("Error uploading file: ", error);
        }

        return url;
    };

    async function onChange(e) {
        e.preventDefault();
        const file = e.target.files[0];
        const url = await ipfs(file);
        setFileUrl(url);
    }
    async function createMarket() {
        console.log("dataurl");
        const { name, description, price } = formInput;
        if (!name || !description || !price || !fileUrl) return;
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name,
            description,
            image: fileUrl,
        });
        const dataurl = await ipfs(data);
        await createSale(dataurl);
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        /* next, create the item */
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();

        const price = ethers.utils.parseUnits(formInput.price, "ether");

        /* then list the item for sale on the marketplace */
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await contract.createMarketItem(
            nftaddress,
            tokenId,
            price,
            { value: listingPrice },
        );
        await transaction.wait();
        nav("/");
    }

    return (
        <Container className="flex justify-center">
            <Col>
                <div className="form-group">
                    <label className="form-label mt-4">Name</label>
                    <input
                        className="form-control"
                        id="assetname"
                        aria-describedby="emailHelp"
                        placeholder="name"
                        onChange={(e) => {
                            e.preventDefault();
                            updateFormInput({
                                ...formInput,
                                name: e.target.value,
                            });
                        }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Description" className="form-label mt-4">
                        Description
                    </label>

                    <textarea
                        className="form-control"
                        id="Description"
                        rows="3"
                        onChange={(e) => {
                            e.preventDefault();
                            updateFormInput({
                                ...formInput,
                                description: e.target.value,
                            });
                        }}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label mt-4">Price</label>
                    <input
                        type="number"
                        className="form-control"
                        id="assetname"
                        aria-describedby="emailHelp"
                        placeholder="Price"
                        onChange={(e) => {
                            e.preventDefault();
                            updateFormInput({
                                ...formInput,
                                price: e.target.value,
                            });
                        }}
                    />
                </div>

                <input
                    type="file"
                    name="Asset"
                    className="form-control"
                    onChange={onChange}
                />
                {fileUrl && (
                    <img className="rounded mt-4" width="350" src={fileUrl} />
                )}
                <Button
                    onClick={createMarket}
                    type="submit"
                    className="btn btn-primary"
                >
                    Mint
                </Button>
            </Col>
        </Container>
    );
}
