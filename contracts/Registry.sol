// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRegistry.sol";
import "./Ownable.sol";

/// @title Registry
/// @notice This contract is used to manage the whitelist of addresses that can be used across the Chibarihill program.
/// @author thev
contract Registry is IRegistry, AccessControl {
  mapping(address => bool) public whitelist;

  event Whitelisted(address indexed member);
  event Removed(address indexed member);

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /// @notice This function is used to bulk add addresses to the whitelist.
  /// @param members Array of addresses of the members of cohort to add.
  function bulkAddToWhitelist(address[] calldata members) external onlyRole(DEFAULT_ADMIN_ROLE) {
    for (uint256 i = 0; i < members.length; i++) {
      _whitelist(members[i]);
    }
  }

  /// @notice This function is used to add addresses to the whitelist.
  /// @param member Address of the member to add.
  function addToWhitelist(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _whitelist(member);
  }

  function _whitelist(address member) internal {
    whitelist[member] = true;
    emit Whitelisted(member);
  }

  /// @notice This function is used to bulk remove addresses from the whitelist.
  /// @param members Array of addresses of the members of cohort to remove.
  function bulkRemoveFromWhitelist(
    address[] calldata members
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    for (uint256 i = 0; i < members.length; i++) {
      _removeWhitelist(members[i]);
    }
  }

  /// @notice This function is used to remove addresses from the whitelist.
  /// @param member Address of the member to remove.
  function removeFromWhitelist(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _removeWhitelist(member);
  }

  function _removeWhitelist(address member) internal {
    whitelist[member] = false;
    emit Removed(member);
  }

  /// @notice This function is used to check if an address is whitelisted.
  /// @dev this call assumes that you are interested in the current cohort
  /// @param member Address of the member to check.
  /// @return True if the address is whitelisted, false otherwise.
  function isWhitelisted(address member) public view returns (bool) {
    return whitelist[member];
  }

  /// @notice This function is used to check if an array of addresses are whitelisted.
  /// @param members Array of addresses of the members to check.
  /// @return True if all addresses are whitelisted, false otherwise.
  function areWhitelisted(address[] calldata members) external view returns (bool) {
    for (uint256 i = 0; i < members.length; ++i) {
      if (!isWhitelisted(members[i])) return false;
    }
    return true;
  }

  /// @notice This function is used to grant Default admin role
  /// @dev Add the address of the relayer contract when relaying and operating a registry
  function grantRoleAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(DEFAULT_ADMIN_ROLE, account);
  }
}