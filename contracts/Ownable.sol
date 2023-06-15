// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

error OnlyOwner();
error InvalidNewOwner();

abstract contract Ownable {
  address public owner;
  address public newOwner;

  event OwnershipChangeInitiated(address indexed previousOwner, address indexed newOwner);
  event OwnershipChangeAccepted(address indexed previousOwner, address indexed newOwner);

  modifier onlyOwner() {
    _checkOwner();
    _;
  }

  /// @notice The constructor sets the owner of the contract.
  constructor() {
    _setOwner(msg.sender);
  }

  /// @notice This function is used to transfer ownership of the contract.
  /// @param _newOwner Address of the new owner.
  function transferOwnership(address _newOwner) external onlyOwner {
    newOwner = _newOwner;
    emit OwnershipChangeInitiated(owner, newOwner);
  }

  /// @notice This function is used to accept ownership of the contract.
  function acceptOwnership() external {
    if (msg.sender != newOwner) revert InvalidNewOwner();
    emit OwnershipChangeAccepted(owner, newOwner);
    newOwner = address(0);
    _setOwner(newOwner);
  }

  function _checkOwner() internal view {
    if (msg.sender != owner) revert OnlyOwner();
  }

  function _setOwner(address _newOwner) internal {
    owner = _newOwner;
  }
}