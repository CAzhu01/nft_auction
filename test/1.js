const { ethers, deployments } = require("hardhat");

async function main() {
  await deployments.fixture("NftAuction");
  const nftAuctionProxy = await deployments.get("NftAuction");

  //   1. 部署ERC721合约
  const TestERC721 = await ethers.getContractFactory("TestERC721");
  const testERC721 = await TestERC721.deploy();
  await testERC721.waitForDeployment();
  const testERC721Address = await testERC721.getAddress();
  console.log("TestERC721 deployed to:", testERC721Address);

  //   2.
}
