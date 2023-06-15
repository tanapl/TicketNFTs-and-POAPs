// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Whitelistable.sol";

contract CJPY is ERC20, ERC20Burnable, AccessControl, Whitelistable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  constructor(IRegistry registry) ERC20("Chiba JPY", "cJPY") Whitelistable(registry) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(BURNER_ROLE, msg.sender);
  }

  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) ifWhitelisted(to) {
    _mint(to, amount);
  }

  function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
    super.burn(amount);
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    address[] memory toCheck = new address[](2);
    toCheck[0] = from;
    toCheck[1] = to;

    if (!_checkWhitelisted(toCheck)) revert NotWhitelisted();

    super._beforeTokenTransfer(from, to, amount);
  }
}