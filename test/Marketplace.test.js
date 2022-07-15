const {assert, expect} = require("chai");

const NFT = artifacts.require("NFT");
const Marketplace = artifacts.require("Marketplace");

contract('Marketplace', (accounts) =>{

    let nft
    let marketplace
    //let feePercent = 1;
    let deployer
    let URI = "sample URI"

    beforeEach(async () =>{
        nft = await NFT.deployed()
        marketplace = await Marketplace.deployed()
    })

    it('deployed successfully', async () =>{
        const addressN = await nft.address
        const addressM = await marketplace.address

        assert.notEqual(addressN, 0x0)
        assert.notEqual(addressN, '')
        assert.notEqual(addressN, null)
        assert.notEqual(addressN, undefined)

        assert.notEqual(addressM, 0x0)
        assert.notEqual(addressM, '')
        assert.notEqual(addressM, null)
        assert.notEqual(addressM, undefined)
    })

    describe('Deployment', async () =>{
        it('Name and symbol of the nft collection', async () => {
            const nftName = "Dapp NFT"
            const nftSymbol = "DNFT"
            assert.equal(await nft.name(), nftName)
            assert.equal(await nft.symbol(), nftSymbol)
        })

        it('Check for account of the marketplace', async () => {
            //Checking if first Ganache account and marketplace account are the same
            assert.equal(await marketplace._marketOwner(), accounts[0])
        })
    })

    describe('Minting NFTs', async () =>{
        it('It should track minted NFT', async () => {
            //minting an nft with second Ganache account
            await nft.mint(URI, {from: accounts[1]})
            assert.equal(await nft._tokenIds(), 1)
            assert.equal(await nft.balanceOf(accounts[1]), 1)
            assert.equal(await nft.tokenURI(1), URI)
        })
    })

})