// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard{
    
    using Counters for Counters.Counter;
    Counters.Counter private _nftsSold;
    Counters.Counter private _nftCount;
    uint256 public LISTING_FEE = 0.0001 ether;
    address payable private _marketOwner;
    
    mapping(uint256 => NFT) private _idToNFT;

    struct NFT{
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool listed;
    }

    event NFTListed(address nftContract, uint256 tokenId, address seller, address owner, uint256 price);
    event NFTSold(address nftContract, uint256 tokenId, address seller, address owner, uint256 price);

    constructor(){
        _marketOwner = payable(msg.sender);
    }

    //list the NFT on the marketplace
    function listNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant{
        require(_price > 0, "Price must be at least 1 wei");
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _nftCount.increment();

        _idToNFT[_tokenId] = NFT(
            _nftContract,
            _tokenId,
            payable(msg.sender),
            payable(address(this)),
            _price,
            true
        );

        emit NFTListed(_nftContract, _tokenId, msg.sender, address(this), _price);
    }


    //Buy an NFT
    function buyNft(address _nftContract, uint256 _tokenId) public payable nonReentrant{
        NFT storage nft = _idToNFT[_tokenId];
        require(msg.value >= nft.price, "Not enough ether to cover asking price");

        address payable buyer = payable(msg.sender);
        payable(nft.seller).transfer(msg.value);
        IERC721(_nftContract).transferFrom(address(this), buyer, nft.tokenId);
        _marketOwner.transfer(LISTING_FEE);
        nft.owner = buyer;
        nft.listed = false;

        _nftsSold.increment();
        emit NFTSold(_nftContract, nft.tokenId, nft.seller, buyer, msg.value);
    }

    //Resell an NFT purchased from the marketplace
}