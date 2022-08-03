var NFT = artifacts.require("NFT");
var Marketplace = artifacts.require("Marketplace");

async function logNftLists(marketplace){
    try{
        let listedNfts = await marketplace.getListedNfts.call()
        const accountAddress = '0xAF9f30a6aBB35D23f06528F0059bB0a5A1883491' //Get first account from Ganache
        let myNfts = await marketplace.getMyNfts.call({from: accountAddress})
        let myListedNfts = await marketplace.getMyListedNfts.call({from: accountAddress})

        console.log(`listedNfts: ${listedNfts.length}`)
        console.log(`myNfts: ${myNfts.length}`)
        console.log(`myListedNfts: ${myListedNfts.length}`)
    }catch(err){
        console.log('logNftLists error');
    }
}

const main = async (cb) => {
        
        const nft_contract = await NFT.deployed()
        const marketplace_contract = await Marketplace.deployed(100000000000000) 

        console.log('Mint and list 3 NFTs')
        let listingFee = await marketplace_contract.getListingFee()
        listingFee = listingFee.toString()
        console.log(`listing fee... ->${listingFee}`)
        //listingFee2 = web3.utils.fromWei('100000000000000', 'ether')

        let tokenId1 = ""
        let tokenId2 = ""
        let tokenId3 = ""
        
        try{
            let txn1 = await nft_contract.mint("URI1")
            tokenId1 = txn1.logs[2].args[0].toNumber()
            await marketplace_contract.listNft(nft_contract.address, tokenId1, 1, {value: '100000000000000'}) //100000000000000 wei = 0.0001 ethers
            console.log(`Minted and listed ${tokenId1}`)
        }catch(err){
            console.log('txn1 error');
        }

        try{
            let txn2 = await nft_contract.mint("URI1")
            tokenId2 = txn2.logs[2].args[0].toNumber()
            await marketplace_contract.listNft(nft_contract.address, tokenId2, 1, {value: '100000000000000'})
            console.log(`Minted and listed ${tokenId2}`)
        }catch(err){
            console.log('txn2 error');
        }

        try{
            let txn3 = await nft_contract.mint("URI1")
            tokenId3 = txn3.logs[2].args[0].toNumber()
            await marketplace_contract.listNft(nft_contract.address, tokenId3, 1, {value: '100000000000000'})
            console.log(`Minted and listed ${tokenId3}`)
        }catch(err){
            console.log('txn3 error');
        }

        await logNftLists(marketplace_contract)

        try{
        console.log('Buy 2 NFTs')
            await marketplace_contract.buyNft(nft_contract.address, tokenId1, {value: 1})
            await marketplace_contract.buyNft(nft_contract.address, tokenId2, {value: 1})
        }catch(err){
            console.log('Buy error');
        }
        
        await logNftLists(marketplace_contract)
        
        try{
            console.log('Resell 1 NFT')
            await marketplace_contract.resellNft(nft_contract.address, tokenId2, 1, {value: '100000000000000'})
        }catch(err){
            console.log('Resell error');
        }

        await logNftLists(marketplace_contract)

    cb();
}

module.exports = main;