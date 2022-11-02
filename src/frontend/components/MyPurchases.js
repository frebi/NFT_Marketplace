import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'
import Web3 from 'web3'

function renderSoldItems(items) {
  return (
    <>
      <div className="px-5 py-5 container">
        <h2>Sold</h2>
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
                  Sold for {ethers.utils.formatEther(item.price)} ETH <br/>
                  On {item.time}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  )
}

function getTimeDate(timestamp){
  var a = new Date(timestamp * 1000)
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  var year = a.getFullYear()
  var month = months[a.getMonth()]
  var date = a.getDate()
  var hour = a.getHours()
  var min = a.getMinutes()
  var sec = a.getSeconds()
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec 
  return time
}

const MyPurchases = ({ marketplace, nft, account }) => {
    const [loading, setLoading] = useState(true)
    const [purchases, setPurchases] = useState([])
    const [soldItems, setSoldItems] = useState([])

    const loadPurchasedItems = async () => {
      let web3 = new Web3(window.ethereum)
        let purchases = []
        //get an array of all NFTSold events emitted by the current account
        const filterBought = await marketplace.getPastEvents('NFTSold', {filter: {owner: account}, fromBlock: 0,toBlock: 'latest'})
        
        for(let i=0;i<filterBought.length;i++){
          //console.log(filterBought[i].returnValues)
          const blockData = await web3.eth.getBlock(filterBought[i].blockNumber)
          const date = getTimeDate(blockData.timestamp)
            // get uri url from nft contract
            const uri = await nft.methods.tokenURI(filterBought[i].returnValues.tokenId).call()
            try{
                // use uri to fetch the nft metadata stored on ipfs 
                const response = await fetch(uri)
                const metadata = await response.json()
                // define listed item object
                purchases.push({
                    price: filterBought[i].returnValues.price,
                    itemId: filterBought[i].returnValues.tokenId,
                    seller: filterBought[i].returnValues.seller,
                    time: date,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                })
            }
            catch(error){
                console.log("error on index "+i)
            }
        }

        const filterSold = await marketplace.getPastEvents('NFTSold', {filter: {seller: account}, fromBlock: 0,toBlock: 'latest'})

        for(let i=0; i < filterSold.length; i++){
          const blockData = await web3.eth.getBlock(filterSold[i].blockNumber)
          const date = getTimeDate(blockData.timestamp)

            const tokId = filterSold[i].returnValues.tokenId
            const uri = await nft.methods.tokenURI(tokId).call()
                try{
                  //use uri to fetch the nft metadata stored on ipfs
                  const response = await fetch(uri)
                  const metadata = await response.json()

                  let obj = {
                      price: filterSold[i].returnValues.price,
                      itemId: filterSold[i].returnValues.tokenId,
                      seller: filterSold[i].returnValues.seller,
                      time: date,
                      name: metadata.name,
                      description: metadata.description,
                      image: metadata.image
                  }
                  
                  //Add item to array
                  soldItems.push(obj)
                }
                catch(error){
                  console.log("!!! error retrieving nft metadata !!!")
                }
        }

        setLoading(false)
        setPurchases(purchases)
        setSoldItems(soldItems)
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
            <div className="px-5 py-5 container">
              <h2>Bought</h2>
              <Row xs={1} md={2} lg={4} className="g-4 py-5">
                {purchases.map((item, idx) => (
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
                        <Card.Text>
                          Bought for {ethers.utils.formatEther(item.price)} ETH <br/>
                          On {item.time}
                        </Card.Text>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
            : (
              <div className="px-5 py-5 container">
                <main style={{ padding: "1rem 0" }}>
                  <h2>No purchases</h2>
                </main>
              </div>
            )
          }
          {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
      );
}

export default MyPurchases