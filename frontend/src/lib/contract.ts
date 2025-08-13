import { ethers } from "ethers";

// 合约部署信息（Base Sepolia）
export const NFT_AUCTION_ADDRESS = "0xafc305E491CC8A89E355C0114b8C77Dfd7d39029";

// 从后端缓存复制的 ABI (裁剪为需要的接口，可全部保留)
export const NFT_AUCTION_ABI = [
  "function admin() view returns (address)",
  "function nextAuction() view returns (uint256)",
  "function auctions(uint256) view returns (address nftAddress,uint256 duration,address seller,uint256 startingPrice,uint256 startTime,uint256 endTime,uint256 endingPrice,address highestBidder,uint256 highestBid,bool ended,address nftContractAddress,uint256 tokenId)",
  "function createAuction(uint256 _duration,uint256 _startingPrice,address _nftContractAddress,uint256 _tokenId)",
  "function placeBid(uint256 _auctionId) payable",
];

export function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  // 只读后备：可换成 Alchemy/Infura RPC
  return new ethers.JsonRpcProvider("https://sepolia.base.org");
}

export async function getContract(signer?: ethers.Signer) {
  const provider = signer ? signer.provider! : getProvider();
  return new ethers.Contract(
    NFT_AUCTION_ADDRESS,
    NFT_AUCTION_ABI,
    signer ?? provider
  );
}

export async function connectWallet(): Promise<{
  signer: ethers.Signer;
  address: string;
}> {
  const provider = getProvider() as ethers.BrowserProvider;
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { signer, address };
}
