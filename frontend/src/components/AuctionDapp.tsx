"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet, getContract, getProvider } from "../lib/contract";

interface AuctionView {
  id: number;
  seller: string;
  tokenId: string;
  nftContractAddress: string;
  startingPrice: string;
  highestBid: string;
  highestBidder: string;
  endTime: number;
  ended: boolean;
}

const short = (addr: string) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

export const AuctionDapp: React.FC = () => {
  const [account, setAccount] = useState<string>("");
  const [auctions, setAuctions] = useState<AuctionView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [bidLoading, setBidLoading] = useState<number | null>(null);

  // form state
  const [duration, setDuration] = useState("3600");
  const [startingPrice, setStartingPrice] = useState("0.01");
  const [nftAddr, setNftAddr] = useState("");
  const [tokenId, setTokenId] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      const c = await getContract();
      const next: bigint = await c.nextAuction();
      const list: AuctionView[] = [];
      for (let i = 0; i < Number(next); i++) {
        const a = await c.auctions(i);
        list.push({
          id: i,
          seller: a.seller,
          tokenId: a.tokenId.toString(),
          nftContractAddress: a.nftContractAddress,
          startingPrice: ethers.formatEther(a.startingPrice),
          highestBid: ethers.formatEther(a.highestBid),
          highestBidder: a.highestBidder,
          endTime: Number(a.endTime),
          ended: a.ended,
        });
      }
      setAuctions(list);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAccount(address);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      const { signer } = await connectWallet();
      const c = await getContract(signer);
      const tx = await c.createAuction(
        BigInt(duration),
        ethers.parseEther(startingPrice),
        nftAddr,
        BigInt(tokenId)
      );
      await tx.wait();
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const placeBid = async (id: number, eth: string) => {
    try {
      setBidLoading(id);
      const { signer } = await connectWallet();
      const c = await getContract(signer);
      const tx = await c.placeBid(id, { value: ethers.parseEther(eth) });
      await tx.wait();
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBidLoading(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">NFT Auction DApp</h1>
        <button
          onClick={onConnect}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          {account ? short(account) : "连接钱包"}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">创建拍卖 (需要管理员地址)</h2>
        <form onSubmit={onCreate} className="grid gap-2 md:grid-cols-2">
          <label className="flex flex-col text-sm">
            持续时间(秒)
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </label>
          <label className="flex flex-col text-sm">
            起拍价(ETH)
            <input
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </label>
          <label className="flex flex-col text-sm">
            NFT合约地址
            <input
              value={nftAddr}
              onChange={(e) => setNftAddr(e.target.value)}
              placeholder="0x..."
              className="border px-2 py-1 rounded"
            />
          </label>
          <label className="flex flex-col text-sm">
            Token ID
            <input
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </label>
          <div className="col-span-full">
            <button
              disabled={creating}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {creating ? "创建中..." : "创建拍卖"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">拍卖列表</h2>
          <button
            onClick={refresh}
            className="text-sm px-3 py-1 border rounded"
          >
            刷新
          </button>
        </div>
        {loading && <div>加载中...</div>}
        {!loading && auctions.length === 0 && (
          <div className="text-sm text-gray-500">暂无拍卖</div>
        )}
        <div className="space-y-3">
          {auctions.map((a) => {
            const remain =
              a.endTime > 0 ? a.endTime - Math.floor(Date.now() / 1000) : 0;
            return (
              <div
                key={a.id}
                className="p-4 border rounded grid gap-2 md:grid-cols-4 items-start"
              >
                <div className="space-y-1 text-sm">
                  <div>ID #{a.id}</div>
                  <div>Token ID: {a.tokenId}</div>
                  <div>NFT: {short(a.nftContractAddress)}</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div>Seller: {short(a.seller)}</div>
                  <div>起拍价: {a.startingPrice} ETH</div>
                  <div>最高价: {a.highestBid} ETH</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    最高出价者: {a.highestBidder ? short(a.highestBidder) : "-"}
                  </div>
                  <div>
                    结束时间:{" "}
                    {a.endTime
                      ? new Date(a.endTime * 1000).toLocaleString()
                      : "-"}
                  </div>
                  <div>剩余: {remain > 0 ? remain + " s" : "结束"}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <BidForm
                    auction={a}
                    placing={bidLoading === a.id}
                    onBid={(eth) => placeBid(a.id, eth)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const BidForm: React.FC<{
  auction: AuctionView;
  placing: boolean;
  onBid: (eth: string) => void;
}> = ({ auction, placing, onBid }) => {
  const [amount, setAmount] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onBid(amount);
      }}
      className="flex flex-col gap-2"
    >
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`> ${auction.highestBid || auction.startingPrice}`}
        className="border px-2 py-1 rounded"
      />
      <button
        disabled={placing}
        className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
      >
        {placing ? "出价中..." : "出价"}
      </button>
    </form>
  );
};

export default AuctionDapp;
