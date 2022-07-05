// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address marketplaceContract;

    event NFTMinted(uint256 tokenId);

    constructor(address _marketplaceContract) ERC721("Dapp NFT", "DNFT"){
        marketplaceContract = _marketplaceContract;
    }

    //_tokenURI points to the JSON metadata on IPFS that stores the NFT's metadata
    function mint(string memory _tokenURI) public {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);
        //Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, _tokenURI);

        //setApprovalForAll(marketplaceContract, true);
        emit NFTMinted(newTokenId);
    }
}