import{
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom"
import Web3 from 'web3'
import Marketplace from '../../abis/Marketplace.json'
import NFT from '../../abis/NFT.json'

import Navigation from './Navbar';
import Home from './Home.js'
import Create from './Create.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './MyPurchases.js'
/*
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'
*/
import { useState, useEffect } from 'react'
//import { ethers } from "ethers"
import { Spinner } from 'react-bootstrap'
//import { render } from "react-dom";

function App(){
    const [loading, setLoading] = useState(true)
    const [account, setAccount] = useState(null)
    const [nft, setNFT] = useState({})
    const [marketplace, setMarketplace] = useState({})
    //const [web3, setWeb3] = useState(null)

    
    const loadWeb3 = async() =>{
        if(window.ethereum){
            await window.ethereum.request({method: 'eth_requestAccounts'})
            window.web3 = new Web3(window.ethereum)

            loadBlockchainData()

        }else if(window.web3){
            window.web3 = new Web3(window.web3.currentProvider)
        }else{
            window.alert('Non-ethereum browser detected.')
        }
    }

    //fetching contract
    const loadBlockchainData = async () => {
        const web3 = new Web3(window.ethereum)
        //setWeb3(web3)

        const accounts = await web3.eth.getAccounts()
        setAccount(accounts[0])

        const network_id = await web3.eth.net.getId()
        //------- creating new contract object to interact with -----
        const marketplace = new web3.eth.Contract(Marketplace.abi, Marketplace.networks[network_id].address)
        setMarketplace(marketplace)
        const nft = new web3.eth.Contract(NFT.abi, NFT.networks[network_id].address)
        setNFT(nft)
        setLoading(false)
    }

    useEffect(() => {
        loadWeb3()
      }, [])


    return (
        <BrowserRouter>
          <div>
            <>
              <Navigation web3Handler={loadWeb3} account={account} />
            </>
            <div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                  <Spinner animation="border" style={{ display: 'flex' }} />
                  <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
                </div>
              ) : (
                <Routes>
                  <Route path="/" element={
                    <Home marketplace={marketplace} nft={nft} account={account}/>
                  } />
                  <Route path="/create" element={
                    <Create marketplace={marketplace} nft={nft} account={account}/>
                  } />
                  <Route path="/my-listed-items" element={
                    <MyListedItems marketplace={marketplace} nft={nft} account={account} />
                  } />
                  <Route path="/my-purchases" element={
                    <MyPurchases marketplace={marketplace} nft={nft} account={account} />
                  } />
                </Routes>
              )}
            </div>
          </div>
        </BrowserRouter>
    
      );
}

export default App;