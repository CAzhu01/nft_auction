const { ethers } = require("hardhat");

async function main() {
  // 获取已部署的合约实例
  const nftAuction = await ethers.getContractAt(
    "NftAuction",
    "0xafc305E491CC8A89E355C0114b8C77Dfd7d39029" // 您的代理合约地址
  );

  const [deployer, user1] = await ethers.getSigners();

  // 获取合约信息
  console.log("合约admin地址:", await nftAuction.admin());
  console.log("下一个拍卖ID:", await nftAuction.nextAuction());

  // 如果需要进行更多操作，可以在这里添加
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
