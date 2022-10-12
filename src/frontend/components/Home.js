import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'

const Home = ({ marketplace, nft }) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([])
    const loadMarketplaceItems = async () => {
        //load all unsold items
        const itemCount = await marketplace.methods.get_nftCount().call()
        let items = []
        console.log("nft count: "+itemCount)
        for(let i=1; i <= itemCount; i++){
            const item = await marketplace.methods.get_NFT(i).call()
            

          //-------------
            console.log("tokenid: "+item.tokenId)
            console.log("seller: "+item.seller)
            console.log("listed: "+item.listed)
            console.log("uri: "+await nft.methods.tokenURI(item.tokenId).call())
          //-------------

            // Iterate over the listed NFTs and retrieve their metadata
            if(item.listed){
                //get uri url from nft contract
                const uri = await nft.methods.tokenURI(item.tokenId).call()

                try{
                  //use uri url to fetch the nft metadata stored on ipfs
                  const response = await fetch(uri)
                  const metadata = await response.json()
                  
                  //Add item to items array
                  items.push({
                      price: item.price,
                      itemId: item.tokenId,
                      seller: item.seller,
                      name: metadata.name,
                      description: metadata.description,
                      image: metadata.image
                  })
                }
                catch(error){
                  console.log("!!! error retrieving nft metadata !!!")
                }
            }
        }
        setLoading(false)
        setItems(items)
    }

      const buyMarketItem = async (item) => {
        await (await marketplace.methods.buyNft(nft.address, item.tokenId, { value: item.price })).wait()
        loadMarketplaceItems()
      }

      useEffect(() => {
        loadMarketplaceItems()
      }, [])
      if (loading) return (
        <main style={{ padding: "1rem 0" }}>
          <h2>Loading...</h2>
        </main>
      )

      return (
        <div className="flex justify-center">
          {items.length > 0 ?
            <div className="px-5 container">
              <Row xs={1} md={2} lg={4} className="g-4 py-5">
                {items.map((item, idx) => (
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
                          <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                            Buy for {ethers.utils.formatEther(item.price)} ETH
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
                <h2>No listed assets</h2>
              </main>
            )}
        </div>
      );
}

export default Home