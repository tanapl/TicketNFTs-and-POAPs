// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ITicketNFT.sol";
import "./POAP.sol";

//import "hardhat/console.sol";

contract TicketNFT is ERC721, ITicketNFT {
    IERC20 public cJPYToken;
    address public owner;
    uint256 public startTime;
    uint256 public ticketCounter;
    uint256 public ticketPrice;

    constructor(
        string memory _name,
        string memory _symbol,
        IERC20 _cJPYToken,
        uint256 _startTime,
        uint256 _ticketPrice
    ) ERC721(_name, _symbol) {
        cJPYToken = IERC20(_cJPYToken);
        owner = msg.sender;
        startTime = _startTime;
        ticketPrice = _ticketPrice;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner.");
        _;
    }

    function mint(address to) external {
        require(
            msg.sender == owner || block.timestamp <= startTime,
            "Event already started. Ticket sales are finished!"
        );

        require(
            cJPYToken.balanceOf(msg.sender) >= ticketPrice,
            "Insufficient cJPY balance."
        );

        require(
            cJPYToken.transferFrom(msg.sender, address(this), ticketPrice),
            "cJPY transfer failed."
        );

        ticketCounter++;

        _safeMint(to, ticketCounter);
    }

    function updateTicketPrice(uint256 newPrice) external onlyOwner {
        require(newPrice != ticketPrice, "New price is same as current price.");
        ticketPrice = newPrice;
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(cJPYToken.balanceOf(address(this)) >= amount, "Insufficient contract balance.");

        cJPYToken.transfer(owner, amount);
    }

    function burn(uint256 tokenId, address ticketOwner) external {
        require(block.timestamp > startTime, "Event hasn't started yet.");
        require(ownerOf(tokenId) == ticketOwner, "Caller doesn't own a ticket.");

        _burn(tokenId);
    }
}