import { useState, useEffect } from 'react'
//import { ethers } from "ethers"
import {ethers} from "ethers"
import { Row, Col, Card, Button, Modal } from 'react-bootstrap'
import Web3 from 'web3'
import { render } from 'react-dom'

const MyPurchases = ({ marketplace, nft, account }) => {
    const [loading, setLoading] = useState(true)
    const [purchases, setPurchases] = useState([])
    const [show, setShow] = useState(false);

      const handleClose = () => setShow(false);
      const handleShow = () => setShow(true);

    const loadPurchasedItems = async () => {
        let purchases = []
        //get an array of all NFTSold events emitted by the current account
        const filter = await marketplace.getPastEvents('NFTSold', {filter: {owner: account}})
        console.log(filter)
        console.log(filter[0].returnValues)
        console.log("##### price: "+ filter[0].returnValues.price)
        
        for(let i=0;i<filter.length;i++){
            // get uri url from nft contract
            const uri = await nft.methods.tokenURI(filter[i].returnValues.tokenId).call()
            try{
                // use uri to fetch the nft metadata stored on ipfs 
                const response = await fetch(uri)
                const metadata = await response.json()
                // define listed item object
                purchases.push({
                    price: filter[i].returnValues.price,
                    itemId: filter[i].returnValues.tokenId,
                    seller: filter[i].returnValues.seller,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                })
            }
            catch(error){
                console.log("error on index "+i)
            }
        }
        setLoading(false)
        setPurchases(purchases)
        //console.log(purchases.length)
    }

    
    useEffect(() => {
        loadPurchasedItems()
      }, [])
      if (loading) return (
        <main style={{ padding: "1rem 0" }}>
          <h2>Loading...</h2>
        </main>
      )


      
    return (
        <div className="flex justify-center">
          {purchases.length > 0 ?
            <div className="px-5 container">
              <Row xs={1} md={2} lg={4} className="g-4 py-5">
                {purchases.map((item, idx) => (
                  <Col key={idx} className="overflow-hidden">
                    <Card>
                      <Card.Img variant="top" src={item.image} />
                      <Card.Body color="secondary">
                        <Card.Text>
                        Bought for {ethers.utils.formatEther(item.price)} ETH
                        </Card.Text>
                      </Card.Body>
                      <Card.Footer>
                        <div className='d-grid'>
                            <Button onClick={handleShow} variant="primary" size="lg">
                                Sell
                            </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            : (
              <main style={{ padding: "1rem 0" }}>
                <h2>No purchases</h2>
              </main>
            )}

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
            </Modal.Header>
            <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={handleClose}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>

        </div>
      );
}

export default MyPurchases