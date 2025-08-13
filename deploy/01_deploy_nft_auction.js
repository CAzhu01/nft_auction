const { deployments, network, ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { log } = require("console");
const { json } = require("stream/consumers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { save, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("部署用户地址", deployer);

  // 获取合约工厂
  const NftAuction = await ethers.getContractFactory("NftAuction");
  // 部署可升级代理合约
  const nftAuction = await upgrades.deployProxy(NftAuction, [], {
    initializer: "initialize",
  });
  // 等待合约部署完成
  await nftAuction.waitForDeployment();

  const proxyAddress = await nftAuction.getAddress();
  console.log("代理合约 nftAuction 合约地址", proxyAddress);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log(" 目标合约地址", nftAuction.target);
  console.log(
    " 实现合约地址",
    await upgrades.erc1967.getImplementationAddress(proxyAddress)
  );

  // 保存合约地址和 ABI 到本地文件
  const storePath = path.resolve(
    __dirname,
    "/home/cazhu/code/nft_auction/deploy/.cache/nftAuction.json"
  );

  fs.writeFileSync(
    storePath,
    JSON.stringify({
      proxyAddress,
      implementationAddress,
      abi: NftAuction.interface.format("json"),
    })
  );

  await save("NftAuction", {
    address: proxyAddress,
    abi: NftAuction.interface.format("json"),
  });

  // 这里是传统的直接部署合约的方式
  // await deploy("NftAuction", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });
};
// 给部署脚本打标签，方便 Hardhat 按标签选择性运行脚本。
// 这里的标签名可以自定义，这里的标签名是 NftAuction。
// 给部署脚本添加网络标签，方便 Hardhat 按网络选择性运行脚本。
// module.exports.networks = ["hardhat", "localhost", "goerli"];
module.exports.tags = ["NftAuction"];
