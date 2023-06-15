// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/ITicketNFT.sol";

contract POAP is ERC721 {
    uint256 public poapCounter;
    ITicketNFT public ticketNFT;

    constructor(
        string memory _name,
        string memory _symbol,
        ITicketNFT _ticketNFT
    ) ERC721(_name, _symbol) {
        ticketNFT = ITicketNFT(_ticketNFT);
    }

    function mint(uint256 ticketId) external {
        require(
            ticketNFT.ownerOf(ticketId) == msg.sender,
            "Caller is not the ticket holder."
        );

        poapCounter++;
        ticketNFT.burn(ticketId, msg.sender);
        _safeMint(msg.sender, poapCounter);
    }
}