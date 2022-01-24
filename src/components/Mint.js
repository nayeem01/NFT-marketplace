import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ethers } from "ethers";
import { useState } from "react";
import Web3Modal from "web3modal";
import { create as ipfsHttpClient } from "ipfs-http-client";

import { nftaddress, nftmarketaddress } from "../nftAddresses";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

// in this component we set the ipfs up to host our nft data of
// file storage

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

export default function MintItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({
        price: "",
        name: "",
        description: "",
    });

    const nav = useNavigate();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(file, {
                progress: (prog) => console.log(`received: ${prog}`),
            });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileUrl(url);
        } catch (error) {
            console.log("Error uploading file:", error);
        }
    }

    async function createMarket() {
        const { name, description, price } = formInput;
        if (!name || !description || !price || !fileUrl) return;
        // upload to IPFS
        const data = JSON.stringify({
            name,
            description,
            image: fileUrl,
        });
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            // run a function that creates sale and passes in the url
            createSale(url);
        } catch (error) {
            console.log("Error uploading file:", error);
        }
    }

    async function createSale(url) {
        // create the items and list them on the marketplace
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        // we want to create the token
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.mintToken(url);
        let tx = await transaction.wait();
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();
        const price = ethers.utils.parseUnits(formInput.price, "ether");

        // list the item for sale on the marketplace
        contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();

        transaction = await contract.makeMarketItem(
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
            <form>
                <fieldset>
                    <div className="form-group">
                        <label className="form-label mt-4">Name</label>
                        <input
                            className="form-control"
                            id="assetname"
                            aria-describedby="emailHelp"
                            placeholder="name"
                            onChange={(e) =>
                                updateFormInput({
                                    ...formInput,
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="Description"
                            className="form-label mt-4"
                        >
                            Description
                        </label>

                        <textarea
                            className="form-control"
                            id="Description"
                            rows="3"
                            onChange={(e) =>
                                updateFormInput({
                                    ...formInput,
                                    description: e.target.value,
                                })
                            }
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
                            onChange={(e) =>
                                updateFormInput({
                                    ...formInput,
                                    price: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label mt-4">
                            choose file for minting
                        </label>
                        <input
                            className="form-control"
                            type="file"
                            id="formFile"
                            onChange={onChange}
                        />
                        {fileUrl && (
                            <img
                                className="rounded mt-4"
                                width="350px"
                                src={fileUrl}
                            />
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={createMarket}
                    >
                        Mint
                    </button>
                </fieldset>
            </form>
        </Container>
    );
}
