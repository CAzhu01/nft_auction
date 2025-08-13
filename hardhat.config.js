require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/a2d22bbb125840d6808671075fc9f312`,
      accounts: [
        `0xb88c633d205b97574decc2f7eac446c20d9a158548a8311e18c84c9566e8a635`,
      ],
    },
    base_sepolia: {
      url: `https://base-sepolia.infura.io/v3/a2d22bbb125840d6808671075fc9f312`,
      accounts: [
        `0xb88c633d205b97574decc2f7eac446c20d9a158548a8311e18c84c9566e8a635`,
      ],
    },
  },

  namedAccounts: {
    deployer: {
      default: 0,
      user1: 1,
      user2: 2,
      user3: 3,
    },
  },
};
