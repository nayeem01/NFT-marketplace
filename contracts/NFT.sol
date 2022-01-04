// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "base64-sol/base64.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenId;
    event createdNFT(uint256 indexed _tokenId, string url);

    constructor() ERC721("NFT", "imgNFT") {}

    function createNFT(string memory _url) public {
        tokenId.increment();
        uint256 newTokenID = tokenId.current();

        _safeMint(msg.sender, newTokenID);
        string memory img = imgToURL(_url);

        _setTokenURI(newTokenID, jsonResponse(img));

        emit createdNFT(newTokenID, _url);
    }

    function imgToURL(string memory _url) public pure returns (string memory) {
        string memory baseURL = "data:image/jpg;base64,";
        string memory encodedUrl = Base64.encode(
            bytes(string(abi.encodePacked(_url)))
        );
        return string(abi.encodePacked(baseURL, encodedUrl));
    }

    function jsonResponse(string memory imageURI)
        public
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                "NFT",
                                '", "description":"", "attributes":"", "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
