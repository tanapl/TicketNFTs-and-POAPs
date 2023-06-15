// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ITicketNFT is IERC721 {
    function burn(uint256 tokenId, address ticketOwner) external;
}