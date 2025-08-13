const { ethers, deployments, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Test upgrade", async function () {
  it("should upgrade", async function () {
    // 1. 部署合约
    await deployments.fixture("NftAuction");

    const nftAuctionProxy = await deployments.get("NftAuction");

    const nftAuction = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxy.address
    );

    // 2. 调用createAuction 方法,创建一个auction
    await nftAuction.createAuction(
      100 * 1000,
      ethers.parseEther("0.0001"),
      ethers.ZeroAddress,
      1
    );
    // 2.1 读取auction[0]
    const auction = await nftAuction.auctions(0);
    console.log("创建auction成功: ", auction);

    const implAddress1 = await upgrades.erc1967.getImplementationAddress(
      nftAuctionProxy.address
    );

    // 3. 升级合约
    await deployments.fixture("upgradeNftAuction");

    const implAddress2 = await upgrades.erc1967.getImplementationAddress(
      nftAuctionProxy.address
    );

    // 4. 读取合约的auction[0].

    const auction2 = await nftAuction.auctions(0);
    console.log("升级后的auction: ", auction2);

    const nftAuctionV2 = await ethers.getContractAt(
      "NftAuctionV2",
      nftAuctionProxy.address
    );
    const hello = await nftAuctionV2.testHello();
    console.log("hello: ", hello);

    expect(auction2.startTime).to.equal(auction.startTime);
    expect(implAddress1).to.not.equal(implAddress2);
  });
});
