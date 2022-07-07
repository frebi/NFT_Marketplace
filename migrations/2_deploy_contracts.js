/*
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:7545');
*/

var NFT = artifacts.require("NFT");
var Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer) {
  //const fee = web3.utils.toWei('0.0001', 'ether');
  //await deployer.deploy(Marketplace, fee);
  await deployer.deploy(Marketplace);
  const marketplace = await Marketplace.deployed();
  await deployer.deploy(NFT, marketplace.address);
}