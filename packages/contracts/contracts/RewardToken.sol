// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardToken
 * @dev ERC20 token used for rewarding monitoring nodes and paying for services
 */
contract RewardToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 10000000000 * 10**18; // 10 billion tokens max
    
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    constructor() ERC20("UptimeMonitor Token", "UMT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Add a minter address (typically the main contract)
     */
    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @dev Remove a minter address
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @dev Mint new tokens (only by authorized minters)
     */
    function mint(address _to, uint256 _amount) external {
        require(minters[msg.sender], "Not authorized to mint");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(_to, _amount);
    }

    /**
     * @dev Batch transfer tokens to multiple addresses
     */
    function batchTransfer(address[] calldata _recipients, uint256[] calldata _amounts) external {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            transfer(_recipients[i], _amounts[i]);
        }
    }
}