const {assert, expect} = require("chai");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const eventemitter = require("chai-eventemitter2");
const { default: Web3 } = require("web3");
chai.use(eventemitter());
chai.use(chaiAsPromised);

const NFT = artifacts.require("NFT");
const Marketplace = artifacts.require("Marketplace");

contract('Marketplace', (accounts) =>{

    let nft
    let marketplace
    let feePercent = 100000000000000;
    let deployer
    let URI = "sample URI"
    let Nft_minted_to_address_1

    beforeEach(async () =>{
        nft = await NFT.deployed()
        marketplace = await Marketplace.deployed()

        //Different way to deploy these two contracts
        //marketplace = await Marketplace.new(100000000000000)
        //nft = await NFT.new(marketplace.address)
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
            assert.equal(await marketplace.get_marketOwner(), accounts[0])
            assert.equal(await marketplace.getListingFee(), feePercent)
        })
    })

    describe('Minting NFTs', async () =>{
        it('It should track minted NFT', async () => {
            //minting an nft with second Ganache account
            await nft.mint(URI, {from: accounts[1]})
            assert.equal(await nft._tokenIds(), 1)
            assert.equal(await nft.balanceOf(accounts[1]), 1)
            assert.equal(await nft.tokenURI(1), URI)


            //minting an nft with third Ganache account
            await nft.mint(URI, {from: accounts[2]})
            assert.equal(await nft._tokenIds(), 2)
            assert.equal(await nft.balanceOf(accounts[2]), 1)
            assert.equal(await nft.tokenURI(2), URI)

            //minting an nft with fourth Ganache account
            await nft.mint(URI, {from: accounts[3]})
            expect((await nft._tokenIds()).toNumber()).to.equal(3)
            expect((await nft.balanceOf(accounts[3])).toNumber()).to.equal(1)
            expect(await nft.tokenURI(3)).to.equal(URI)
        })
    })
    

    describe('Making marketplace item', async () =>{
        let price = 1
        let result
        let tokenId

        
        beforeEach(async () =>{
            //address 1 mint an NFT and approves marketplace to spend it
            result = await nft.mint(URI, {from: accounts[1]})
            tokenId = result.logs[2].args[0].toNumber()
            //await nft.setApprovalForAll(marketplace.address, true, {from: accounts[1]})
        })
        
        it('New NFTListed event emitted', async () =>{

            //owner of NFT should be the second account of ganache
            assert.equal(await nft.ownerOf(tokenId), accounts[1])

            //https://www.chaijs.com/plugins/chai-eventemitter2/
            await chai.expect(await marketplace.listNft(nft.address, tokenId, 1, {from: accounts[1], value: 100000000000000}))
                    .to.emit(marketplace, "NFTListed", {withArgs: [nft.address, tokenId, accounts[1], marketplace.address, 1]});
            
            assert.equal((await marketplace.get_nftCount()).toNumber(), 1)
        })

        it('Listing NFT item', async () => {
            assert.equal(await nft.ownerOf(tokenId), accounts[1])
            await marketplace.listNft(nft.address, tokenId, 1, {from: accounts[1], value: 100000000000000})

             // Owner of NFT should now be the marketplace
             assert.equal(await nft.ownerOf(tokenId), marketplace.address)
             assert.equal((await marketplace.get_nftCount()).toNumber(), 2)

             const item = await marketplace.get_NFT(tokenId)             
             expect(Number(item.tokenId)).to.equal(5)
             expect(item.nftContract).to.equal(nft.address)
             expect(Number(item.price)).to.equal(price)
             expect(item.listed).to.equal(true)
        })
        
    })
    
    
    describe('Purchasing marketplace items', async () =>{
        let price = 1
        let result
        let tokenId

        beforeEach(async () =>{
            result = await nft.mint(URI, {from: accounts[1]})
            tokenId = result.logs[2].args[0].toNumber()
            //let ris = await nft.setApprovalForAll(marketplace.address, true, {from: accounts[1]})
            //console.log(ris.logs)
            await marketplace.listNft(nft.address, tokenId, price, {from: accounts[1], value: 100000000000000})
        })

        it('New NFTSold event emitted', async () =>{

            assert.equal(await nft.ownerOf(tokenId), marketplace.address)

            //https://www.chaijs.com/plugins/chai-eventemitter2/
            await chai.expect(await marketplace.buyNft(nft.address, tokenId, {from: accounts[2], value: price}))
                    .to.emit(marketplace, "NFTSold", {withArgs: [nft.address, tokenId, accounts[1], accounts[2], price]});
            
            assert.equal((await marketplace.get_nftCount()).toNumber(), 3)
        })
        
        it('buy nft', async () =>{
            const sellerInitialEthBal = await new web3.eth.getBalance(accounts[1])
            //console.log(web3.utils.fromWei(sellerInitialEthBal, 'ether'))
            const feeAccountInitialEthBal = await new web3.eth.getBalance(accounts[0])

            //console.log(await nft.isApprovedForAll(accounts[1], marketplace.address))
            await marketplace.buyNft(nft.address, tokenId, {from: accounts[2], value: price})

            const sellerFinalEthBal = await new web3.eth.getBalance(accounts[1])
            const feeAccountFinalEthBal = await new web3.eth.getBalance(accounts[0])
            assert.equal(+sellerFinalEthBal, (+sellerInitialEthBal + price))
            assert.equal(+feeAccountFinalEthBal, (+feeAccountInitialEthBal + 100000000000000))


            const item = await marketplace.get_NFT(tokenId)
            assert.equal(item.listed, false)
            assert.equal(await nft.ownerOf(tokenId), accounts[2])
        })
        /*
        it("Should fail for invalid item ids, sold items and when not enough ether is paid", async () =>{
            //await (marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price})).should.be.rejectedWith("NFT item doesn't exist")
            //assert.isRejected(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price}), "NFT item doesn't exist")
            //await chai.expect(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price})).to.be.rejectedWith("NFT item doesn't exist")
            //chai.expect(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price})).to.be.eventually.rejectedWith("NFT item doesn't exist")
            //(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price})).should.be.rejectedWith("NFT item doesn't exist")
            //(await Promise.reject(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price}))).should.be.rejectedWith("NFT item doesn't exist")
            //(await Promise.resolve(42)).should.equal(42)
            chai.expect(await marketplace.buyNft(nft.address, 5, {from: accounts[2], value: price})).rejectedWith("NFT item doesn't exist")
        })
        */
    })


    describe('Reselling marketplace items', async () =>{
        let price = 1
        let result
        let tokenId

        beforeEach(async () =>{
            result = await nft.mint(URI, {from: accounts[1]})
            tokenId = result.logs[2].args[0].toNumber()

            await marketplace.listNft(nft.address, tokenId, price, {from: accounts[1], value: 100000000000000})
            await marketplace.buyNft(nft.address, tokenId, {from: accounts[2], value: price})
        })
        it('New NFTListed event emitted', async () =>{

            assert.equal(await nft.ownerOf(tokenId), accounts[2])

            //https://www.chaijs.com/plugins/chai-eventemitter2/
            await chai.expect(await marketplace.listNft(nft.address, tokenId, 1, {from: accounts[2], value: 100000000000000}))
                    .to.emit(marketplace, "NFTListed", {withArgs: [nft.address, tokenId, accounts[2], marketplace.address, 1]});
            
            //assert.equal((await marketplace.get_nftCount()).toNumber(), 1)
        })

        it('resell nft', async () =>{
            assert.equal(await nft.ownerOf(tokenId), accounts[2])
            await marketplace.resellNft(nft.address, tokenId, 1, {from: accounts[2], value: 100000000000000})

             // Owner of NFT should now be the marketplace
             assert.equal(await nft.ownerOf(tokenId), marketplace.address)

             const item = await marketplace.get_NFT(tokenId)
             expect(item.nftContract).to.equal(nft.address)
             expect(Number(item.price)).to.equal(price)
             expect(item.listed).to.equal(true)
        })
    })
    
})