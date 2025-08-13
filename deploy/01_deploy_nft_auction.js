const { deployments, network, ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  // 使用更安全的方式获取实现地址
  let implementationAddress;
  try {
    implementationAddress = await upgrades.erc1967.getImplementationAddress(
      proxyAddress
    );
    console.log("实现合约地址", implementationAddress);
  } catch (error) {
    console.log("无法获取实现地址，可能不是标准ERC1967代理");
    implementationAddress = await nftAuction.implementation(); // 尝试调用合约的implementation方法
  }

  console.log(" 目标合约地址", nftAuction.target);

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
};

// 给部署脚本打标签，方便 Hardhat 按标签选择性运行脚本。
module.exports.tags = ["deployNftAuction"];
