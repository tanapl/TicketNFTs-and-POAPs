// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

error MemberNotWhitelisted(address member);
error NotWhitelisted();

/// @title IRegistry
/// @notice This is the interface for a registry contract
/// @author thev
interface IRegistry {
  function isWhitelisted(address member) external view returns (bool);

  function areWhitelisted(address[] calldata member) external view returns (bool);

  function bulkAddToWhitelist(address[] calldata members) external;

  function addToWhitelist(address member) external;

  function bulkRemoveFromWhitelist(address[] calldata members) external;

  function removeFromWhitelist(address member) external;

  function grantRoleAdmin(address account) external;
}