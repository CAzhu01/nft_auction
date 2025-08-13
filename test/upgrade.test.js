const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

/**
 * 升级测试目标：
 * 1. 部署 V1 代理并初始化 (initialize)。
 * 2. 校验初始状态：admin 为部署者，nextAuction 为 0，不能非 admin 创建拍卖。
 * 3. 创建一个拍卖，验证存储数据。
 * 4. 升级到 V2（添加 testHello 函数），保证：
 *    - 代理地址不变
 *    - 已有状态 (nextAuction, auctions 映射内容, admin) 保留
 *    - 新增函数可正常调用返回预期值
 * 5. 升级后继续创建拍卖，验证累加性。
 */

describe("NftAuction upgradeability", function () {
  let deployer, other;
  let proxy, implBefore;

  async function getImplementation(addr) {
    return await upgrades.erc1967.getImplementationAddress(addr);
  }

  beforeEach(async function () {
    [deployer, other] = await ethers.getSigners();

    const NftAuction = await ethers.getContractFactory("NftAuction");
    proxy = await upgrades.deployProxy(NftAuction, [], {
      initializer: "initialize",
    });
    await proxy.waitForDeployment();
    implBefore = await getImplementation(await proxy.getAddress());
  });

  it("should initialize correctly", async function () {
    expect(await proxy.admin()).to.equal(deployer.address);
    expect(await proxy.nextAuction()).to.equal(0);

    // 非 admin 创建应失败
    await expect(
      proxy
        .connect(other)
        .createAuction(1000 * 60 + 1, 1, ethers.ZeroAddress, 1)
    ).to.be.revertedWith("Only admin can create auction");
  });

  it("should create auction and preserve state after upgrade", async function () {
    // 创建一个拍卖
    const duration = 1000 * 60 + 10;
    const startPrice = 10n;
    await proxy.createAuction(duration, startPrice, ethers.ZeroAddress, 123n);

    expect(await proxy.nextAuction()).to.equal(1);

    const a = await proxy.auctions(0);
    expect(a.startingPrice).to.equal(startPrice);
    expect(a.tokenId).to.equal(123n);
    expect(a.seller).to.equal(deployer.address);

    const proxyAddress = await proxy.getAddress();

    // 升级
    const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NftAuctionV2);
    await upgraded.waitForDeployment();

    // 代理地址不变
    expect(await upgraded.getAddress()).to.equal(proxyAddress);

    // 实现地址应改变
    const implAfter = await getImplementation(proxyAddress);
    expect(implAfter).to.not.equal(implBefore);

    // 状态保持
    expect(await upgraded.admin()).to.equal(deployer.address);
    expect(await upgraded.nextAuction()).to.equal(1);
    const aAfter = await upgraded.auctions(0);
    expect(aAfter.startingPrice).to.equal(startPrice);

    // 新增函数可调用
    expect(await upgraded.testHello()).to.equal("hello world");

    // 升级后继续创建
    await upgraded.createAuction(duration, 20n, ethers.ZeroAddress, 456n);
    expect(await upgraded.nextAuction()).to.equal(2);
  });

  it("should allow bidding before and after upgrade", async function () {
    const duration = 1000 * 60 + 10;
    const startPrice = 5n;
    await proxy.createAuction(duration, startPrice, ethers.ZeroAddress, 1n);

    // 竞价 (无事件，只校验状态)
    await proxy.connect(other).placeBid(0, { value: 6n });

    let data = await proxy.auctions(0);
    expect(data.highestBid).to.equal(6n);
    expect(data.highestBidder).to.equal(other.address);

    const proxyAddress = await proxy.getAddress();
    const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NftAuctionV2);
    await upgraded.waitForDeployment();

    // 再次出价由 deployer 出更高价
    await upgraded.placeBid(0, { value: 7n });
    data = await upgraded.auctions(0);
    expect(data.highestBid).to.equal(7n);
    expect(data.highestBidder).to.equal(deployer.address);
  });
});
