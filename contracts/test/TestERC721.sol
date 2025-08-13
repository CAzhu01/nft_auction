// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC721 is ERC721, Ownable {
    string private _tokenURI;

    constructor() ERC721("TestERC721", "TEST") Ownable(msg.sender){}

    function mint(address _to, uint256 _tokenId) public onlyOwner {
        _safeMint(_to, _tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _tokenURI;
    }

    function setTokenURI(string memory newTokenURI) public  onlyOwner {
        _tokenURI = newTokenURI;
    }
}