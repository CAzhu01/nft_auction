const { upgrades, ethers } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { save } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("部署用户地址", deployer);

  //   读取 .cache 目录下的 nftAuction.json 文件
  const storePath = path.resolve(
    __dirname,
    "/home/cazhu/code/nft_auction/deploy/.cache/nftAuction.json"
  );
  const storeData = await fs.readFileSync(storePath, "utf-8");
  const { proxyAddress, implAddress, abi } = JSON.parse(storeData);

  //   升级工厂合约
  const NftAuctionV2 = await ethers.getContractFactory("nftAuctionV2");

  //   升级合约
  const nftAuctionV2 = await upgrades.upgradeProxy(proxyAddress, NftAuctionV2);
  await nftAuctionV2.waitForDeployment();

  //   获取升级后的合约地址
  const proxyAddressV2 = await nftAuctionV2.getAddress();
  console.log("nftAuctionV2 合约地址", proxyAddressV2);

  //   调用合约方法
  const testHello = await nftAuctionV2.testHello();
  console.log("testHello", testHello);

  //   保存合约地址和 ABI
  await save("nftAuctionV2", {
    address: proxyAddressV2,
    abi: nftAuctionV2.interface.format("json"),
  });
};
