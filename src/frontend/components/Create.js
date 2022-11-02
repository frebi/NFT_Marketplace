import { useState } from 'react'
import Web3 from 'web3'
import { Row, Form, Button } from 'react-bootstrap'
import { create } from 'ipfs-http-client'

const { REACT_APP_PROJECTID, REACT_APP_PROJECTSECRET } = process.env
const auth = 'Basic ' + Buffer.from(REACT_APP_PROJECTID + ':' + REACT_APP_PROJECTSECRET).toString('base64');
const client = create({
    host: 'infura-ipfs.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

const Create = ({ marketplace, nft, account}) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  

  const uploadToIPFS = async (event) =>{
    event.preventDefault()
    const file = event.target.files[0]

    setImage(file)

    
    if(typeof file !== 'undefined'){
      try{
        const result = await client.add(file)
        setImage(`https://my-nft-market.infura-ipfs.io/ipfs/${result.path}`)
      }catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
    
  }

  const createNFT = async () =>{
    if(!image || !price || !name || !description) return
    try{
      const result = await client.add(JSON.stringify({image, price, name, description}))
      //const result = JSON.stringify({image, price, name, description})

      await mintAndList(result)

    }catch(error){
      console.log("ipfs uri upload error: ", error)
    }
  }

  const mintAndList = async (result) =>{
    //const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    const uri = `https://my-nft-market.infura-ipfs.io/ipfs/${result.path}`

      //let listingFee = await marketplace.methods.getListingFee()
      //listingFee = listingFee.toString()

      await nft.methods.mint(uri).send({ from: account }).on('receipt', function (receipt) {
        console.log('minted');
        // List the NFT
        const tokenId = receipt.events.NFTMinted.returnValues[0];
        try{
        marketplace.methods.listNft(nft._address, tokenId, Web3.utils.toWei(price, "ether"))
            .send({ from: account, value: 100000000000000 }).on('receipt', function () {
                console.log('listed')
            });
        }
        catch(error){
          console.log("error while listing nft")
          console.log(error.message)
        }
    });
  }
  
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create