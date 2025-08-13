const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftAuction on Base Sepolia", function () {
  let nftAuction;
  let testERC721;
  let deployer, user1, user2;

  before(async function () {
    // 获取已部署的合约实例
    nftAuction = await ethers.getContractAt(
      "NftAuction",
      "0xafc305E491CC8A89E355C0114b8C77Dfd7d39029" // 您的代理合约地址
    );

    [deployer, user1, user2] = await ethers.getSigners();

    // 部署测试用的ERC721合约
    const TestERC721 = await ethers.getContractFactory("TestERC721");
    testERC721 = await TestERC721.deploy();
    await testERC721.waitForDeployment();

    console.log("TestERC721 deployed to:", await testERC721.getAddress());
  });

  it("should create auction", async function () {
    // 铸造一个NFT
    await testERC721.mint(deployer.address, 1);

    // 授权给拍卖合约
    await testERC721.approve(await nftAuction.getAddress(), 1);

    // 创建拍卖
    const tx = await nftAuction.createAuction(
      3600, // 1小时
      ethers.parseEther("0.1"), // 起拍价0.1 ETH
      await testERC721.getAddress(), // NFT合约地址
      1 // Token ID
    );

    await tx.wait();

    // 验证拍卖创建
    const auction = await nftAuction.auctions(0);
    expect(auction.tokenId).to.equal(1);
    expect(auction.seller).to.equal(deployer.address);
  });

  it("should allow bidding", async function () {
    // 用户1出价
    const tx = await nftAuction.connect(user1).placeBid(0, {
      value: ethers.parseEther("0.2"),
    });

    await tx.wait();

    // 验证出价
    const auction = await nftAuction.auctions(0);
    expect(auction.highestBid).to.equal(ethers.parseEther("0.2"));
    expect(auction.highestBidder).to.equal(user1.address);
  });
});
