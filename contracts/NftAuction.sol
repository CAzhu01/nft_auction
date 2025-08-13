// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


contract NftAuction is Initializable {

    // 定义结构体
    struct Auction {
        
        address nftAddress;
        // 拍卖持续时间
        uint256 duration;
        // 卖家
        address payable seller;
        // 初始价格
        uint256 startingPrice;

        // 开始时间
        uint256 startTime;
        // 结束时间
        uint256 endTime;
        uint256 endingPrice;
       
        // 最高出价者
        address highestBidder;
        // 最高出价
        uint256 highestBid;
        bool ended;

        // NFT合约地址
        address nftContractAddress;

        // NFT tokenId
        uint256 tokenId;
    }

    // 状态变量
    mapping (uint => Auction) public auctions;
    uint public nextAuction;
    // 管理员ID
    address public admin;

    // 初始化函数
    function initialize() public initializer {
        admin = msg.sender;
    }

    // 创建拍卖 
    function createAuction(uint _duration, uint _startingPrice, address _nftContractAddress, uint256 _tokenId) public { 
        // 管理员权限
        require(msg.sender == admin, "Only admin can create auction");

        // 参数验证
        require(_duration > 1000 * 60, "Duration must be greater than 0");
        require(_startingPrice > 0, "Starting price must be greater than 0");

        auctions[nextAuction] = Auction({
            nftAddress: msg.sender,
            duration: _duration,
            seller: payable(msg.sender),
            startingPrice: _startingPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            endingPrice: _startingPrice,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            nftContractAddress: _nftContractAddress,
            tokenId: _tokenId
        });
        nextAuction++;
    }

    // 买家参与买单
    function placeBid(uint _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];
        // 拍卖是否结束
        require(!auction.ended, "Auction already ended");
        // 出价是否大于当前最高出价
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");
        // 出价是否大于初始价格
        require(msg.value > auction.startingPrice, "Bid must be higher than starting price");

        // 退款
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }


        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        auction.endingPrice = msg.value;
        // 
    }
}