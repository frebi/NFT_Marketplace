// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard{
    
    //using Counters for Counters.Counter;
    //Counters.Counter private _nftsSold;
    //Counters.Counter private _nftCount;
    uint256 private _nftsSold = 0;
    uint256 private _nftCount = 0;
    uint256 private immutable LISTING_FEE;// = 100000000000000 wei; // 0.0001 ethers
    address payable private immutable _marketOwner;
    //address public marketContract = address(this);
    
    mapping(uint256 => NFT) private _idToNFT;

    struct NFT{
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool listed;
    }

    event NFTListed(address indexed nftContract, uint256 tokenId, address indexed seller, address indexed owner, uint256 price);
    event NFTSold(address indexed nftContract, uint256 tokenId, address indexed seller, address indexed owner, uint256 price);

    constructor(uint _LISTING_FEE){
        _marketOwner = payable(msg.sender);
        LISTING_FEE = _LISTING_FEE;
    }

    //list the NFT on the marketplace
    function listNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant{
        require(_price > 0, "Price must be at least 1 wei");
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

        (IERC721(_nftContract)).transferFrom(msg.sender, address(this), _tokenId);

        //_nftCount.increment();
        _nftCount++;

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
        //uint256 nftCount = _nftCount.current();
        require(_tokenId > 0/* && _tokenId <= nftCount*/, "NFT item doesn't exist");
        require(nft.listed, "NFT item is not listed on the marketplace");
        require(msg.value >= nft.price, "Not enough ether to cover asking price");

        address payable buyer = payable(msg.sender);
        (payable(nft.seller)).transfer(msg.value);
        (IERC721(_nftContract)).transferFrom(address(this), buyer, nft.tokenId);
        payable(_marketOwner).transfer(LISTING_FEE);
        nft.owner = buyer;
        nft.listed = false;

        //_nftsSold.increment();
        _nftsSold++;

        emit NFTSold(_nftContract, nft.tokenId, nft.seller, buyer, msg.value);
    }

    //Resell an NFT purchased from the marketplace
    function resellNft(address _nftContract, uint256 _tokenId, uint256 _price) public payable nonReentrant{
        require(_price > 0, "Price must be at least 1 wei");
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

        (IERC721(_nftContract)).transferFrom(msg.sender, address(this), _tokenId);

        NFT storage nft = _idToNFT[_tokenId];
        nft.seller = payable(msg.sender);
        nft.owner = payable(address(this));
        nft.listed = true;
        nft.price = _price;

        //_nftsSold.decrement();
        _nftsSold--;

        emit NFTListed(_nftContract, _tokenId, msg.sender, payable(address(this)), _price);
    }

    
    
    //---------------------------------

    
    function getListingFee() public view returns (uint256){
        return LISTING_FEE;
    }

    function get_NFT(uint256 NFT_tokenId) public view returns (NFT memory){
        return _idToNFT[NFT_tokenId];
    }

    function get_nftsSold() public view returns (uint256){
        return _nftsSold;
    }

    function get_nftCount() public view returns (uint256){
        return _nftCount;
    }

    function get_marketOwner() public view returns (address){
        return _marketOwner;
    }


    function getAllNFT() public view returns (NFT[] memory){
        uint nftCount = _nftCount;
        uint nftsIndex = 0;
        NFT[] memory nfts = new NFT[](nftCount);
        for(uint i=0; i<nftCount; i++){
            nfts[nftsIndex] = _idToNFT[i+1];
        }
        return nfts;
    }

    function getListedNfts() public view returns (NFT[] memory){
        uint256 nftCount = _nftCount;
        uint256 unsoldNftsCount = nftCount - _nftsSold;

        NFT[] memory nfts = new NFT[](unsoldNftsCount);
        uint nftsIndex = 0;
        for(uint i=0; i<nftCount; i++){
            if(_idToNFT[i+1].listed){
                nfts[nftsIndex] = _idToNFT[i+1];
                nftsIndex++;
            }
        }
        return nfts;
    }

    function getMyNfts() public view returns (NFT[] memory){
        uint nftCount = _nftCount;
        uint myNftCount = 0;
        for(uint i=0; i<nftCount; i++){
            if(_idToNFT[i+1].owner == msg.sender){
                myNftCount++;
            }
        }

        NFT[] memory nfts = new NFT[](myNftCount);
        uint nftsIndex = 0;
        for(uint i=0; i<nftCount; i++){
            if(_idToNFT[i+1].owner == msg.sender){
                nfts[nftsIndex] = _idToNFT[i+1];
                nftsIndex++;
            }
        }
        return nfts;
    }

    function getMyListedNfts() public view returns (NFT[] memory){
        uint nftCount = _nftCount;
        uint myListedNftCount = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed) {
                myListedNftCount++;
            }
        }

        NFT[] memory nfts = new NFT[](myListedNftCount);
        uint nftsIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (_idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed) {
                nfts[nftsIndex] = _idToNFT[i + 1];
                nftsIndex++;
            }
        }
        return nfts;
    }
}