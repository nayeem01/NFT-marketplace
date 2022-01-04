const fs = require("fs");
const { networkConfig } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();

    const nft = await deploy("NFT", { from: deployer, log: true });

    log(`address ${nft.address}`);

    const nftAbi = await ethers.getContractFactory("NFT");
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];
    const NFT = new ethers.Contract(nft.address, nftAbi.interface, signer);
    const networkName = networkConfig?.[chainId]?.name;

    log(chainId);

    log(
        `Verify with:\n npx hardhat verify --network ${networkName} ${NFT.address}`,
    );

    let img = fs.readFileSync("./assets/pug.svg", { encoding: "utf8" });
    const transfer = await NFT.createNFT(img);
    await transfer.wait(1);

    log(`token uri: ${await NFT.tokenURI(0)}`);
};

module.exports.tags = ["NFT"];
