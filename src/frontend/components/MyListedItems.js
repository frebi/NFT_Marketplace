import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Modal, Form, Button} from 'react-bootstrap'
import Web3 from 'web3'



const MyPurchases = ({ marketplace, nft, account }) => {
    const [loading, setLoading] = useState(true)
    const [listedItems, setListedItems] = useState([])
    const [NotListedItems, setNotListedItems] = useState([])
    const [show, setShow] = useState(false)
    const [NFT, setNFT] = useState()
    const [price, setPrice] = useState(null)

    const loadListedItems = async () =>{
        //load all sold items listed by user
        const itemCount = await marketplace.methods.get_nftCount().call()
        let listedItems = []
        let NotListedItems = []
        

        for(let i=1; i <= itemCount; i++){
            const item = await marketplace.methods.get_NFT(i).call()
            if((item.seller === account && item.listed === true) || item.owner === account){
                //get uri url from nft contract
                const uri = await nft.methods.tokenURI(item.tokenId).call()
                try{
                  //use uri to fetch the nft metadata stored on ipfs
                  const response = await fetch(uri)
                  const metadata = await response.json()

                  let obj = {
                      price: item.price,
                      itemId: item.tokenId,
                      seller: item.seller,
                      name: metadata.name,
                      description: metadata.description,
                      image: metadata.image
                  }
                  
                  if(item.listed === true){
                    //Add item to array
                    listedItems.push(obj)
                  }else if(item.listed === false){
                    //Add item to array
                    NotListedItems.push(obj)
                  }
                }
                catch(error){
                  console.log("!!! error retrieving nft metadata !!!")
                }
            }
        }
        
        setLoading(false)
        setListedItems(listedItems)
        setNotListedItems(NotListedItems)
    }



    const handleClose = () => {
        setShow(false);
        setPrice(null)
      }
  
      const handleShow = (NFT) =>{
          setShow(true)
          setNFT(NFT)
      }
  
      const ListNft = async (price) =>{
        let currentPrice = null
        if(price != null){
          currentPrice = price
        }else{
          currentPrice = ethers.utils.formatEther(NFT.price)
        }
          try{
          await marketplace.methods.resellNft(nft._address, NFT.itemId, Web3.utils.toWei(currentPrice, "ether"))
              .send({ from: account, value: 100000000000000 }).on('receipt', function () {
                  console.log('listed')
              });
          }
          catch(error){
            console.log("error while listing nft")
            console.log(error.message)
          }
  
        setShow(false)
        setPrice(null)
        window.location.reload(false)
      }


    useEffect(() => {
        loadListedItems()
    }, [])
    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
          <h2>Loading...</h2>
        </main>
    )


    return (
        <div className="flex justify-center">
          {listedItems.length > 0 ?
            <div className="px-5 py-5 container">
                <h2>My Listed NFTs</h2>
              <Row xs={1} md={2} lg={4} className="g-4 py-5">
                {listedItems.map((item, idx) => (
                  <Col key={idx} className="overflow-hidden">
                    <Card>
                      <Card.Img variant="top" src={item.image} />
                      <Card.Body color="secondary">
                        <Card.Title>{item.name}</Card.Title>
                        <Card.Text>
                          {item.description}
                        </Card.Text>
                      </Card.Body>
                      <Card.Footer>
                        Listed for {ethers.utils.formatEther(item.price)} ETH
                    </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            : (
              <div className="py-5 container">
                <main style={{ padding: "1rem 0" }}>
                  <h2>No listed assets</h2>
                </main>
              </div>
            )
          }
          {NotListedItems.length > 0 ?
                <div className="px-5 py-5 container">
                  <h2>NFTs to be listed</h2>
                  <Row xs={1} md={2} lg={4} className="g-4 py-5">
                    {NotListedItems.map((item, idx) => (
                      <Col key={idx} className="overflow-hidden">
                        <Card>
                          <Card.Img variant="top" src={item.image} />
                          <Card.Body color="secondary">
                              <Card.Title>{item.name}</Card.Title>
                              <Card.Text>
                                  {item.description}
                              </Card.Text>
                          </Card.Body>
                          <Card.Footer>
                              <div className='d-grid'>
                                <Button onClick={() =>handleShow(item)} variant="primary" size="lg">
                                  List
                                </Button>
                              </div>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              :
              (
                <div className="py-5 container">
                  <main style={{ padding: "1rem 0" }}>
                    <h2>No assets to be listed</h2>
                  </main>
                </div>
              )
            }
        <Modal show={show} onHide={() =>handleClose()}>
            <Modal.Header>
            <Modal.Title>Listing purchased NFT</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() =>handleClose()}>
                Close
            </Button>
            <Button variant="primary" onClick={() =>ListNft(price)}>
                List NFT
            </Button>
            </Modal.Footer>
        </Modal>
        </div>
      );

}

export default MyPurchases