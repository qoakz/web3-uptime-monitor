// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title UptimeMonitor
 * @dev Main contract for decentralized uptime monitoring platform
 */
contract UptimeMonitor is Ownable, ReentrancyGuard, Pausable {
    // Events
    event MonitoringNodeRegistered(address indexed node, uint256 stake);
    event MonitoringNodeUnregistered(address indexed node);
    event MonitoringRequestCreated(uint256 indexed requestId, address indexed requester, string url);
    event MonitoringResultSubmitted(uint256 indexed requestId, address indexed node, bool isUp, uint256 responseTime);
    event ConsensusReached(uint256 indexed requestId, bool isUp, uint256 averageResponseTime);
    event RewardDistributed(address indexed node, uint256 amount);
    event PenaltyApplied(address indexed node, uint256 amount);

    // Structs
    struct MonitoringNode {
        address nodeAddress;
        uint256 stake;
        uint256 reputation;
        uint256 totalChecks;
        uint256 successfulChecks;
        bool isActive;
        uint256 registrationTime;
    }

    struct MonitoringRequest {
        uint256 id;
        address requester;
        string url;
        uint256 interval; // in seconds
        uint256 timeout; // in milliseconds
        uint256 reward; // per check
        bool isActive;
        uint256 createdAt;
        uint256 lastCheckedAt;
    }

    struct MonitoringResult {
        address node;
        bool isUp;
        uint256 responseTime;
        uint256 timestamp;
        bool isSubmitted;
    }

    // State variables
    IERC20 public rewardToken;
    uint256 public minimumStake = 1000 * 10**18; // 1000 tokens
    uint256 public minimumReputation = 100;
    uint256 public consensusThreshold = 66; // 66% agreement needed
    uint256 public maxResponseTime = 30000; // 30 seconds
    
    uint256 private _nextRequestId = 1;
    uint256 private _nextNodeId = 1;

    // Mappings
    mapping(address => MonitoringNode) public monitoringNodes;
    mapping(uint256 => MonitoringRequest) public monitoringRequests;
    mapping(uint256 => mapping(address => MonitoringResult)) public monitoringResults;
    mapping(uint256 => address[]) public requestNodes; // nodes assigned to each request
    mapping(address => uint256[]) public nodeRequests; // requests assigned to each node

    address[] public activeNodes;
    uint256[] public activeRequests;

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
    }

    // Modifiers
    modifier onlyRegisteredNode() {
        require(monitoringNodes[msg.sender].isActive, "Node not registered or inactive");
        _;
    }

    modifier validRequest(uint256 _requestId) {
        require(_requestId > 0 && _requestId < _nextRequestId, "Invalid request ID");
        require(monitoringRequests[_requestId].isActive, "Request not active");
        _;
    }

    // Node management functions
    function registerNode() external nonReentrant whenNotPaused {
        require(!monitoringNodes[msg.sender].isActive, "Node already registered");
        require(rewardToken.transferFrom(msg.sender, address(this), minimumStake), "Stake transfer failed");

        monitoringNodes[msg.sender] = MonitoringNode({
            nodeAddress: msg.sender,
            stake: minimumStake,
            reputation: 100, // Starting reputation
            totalChecks: 0,
            successfulChecks: 0,
            isActive: true,
            registrationTime: block.timestamp
        });

        activeNodes.push(msg.sender);
        emit MonitoringNodeRegistered(msg.sender, minimumStake);
    }

    function unregisterNode() external nonReentrant onlyRegisteredNode {
        MonitoringNode storage node = monitoringNodes[msg.sender];
        require(node.stake > 0, "No stake to withdraw");

        // Return stake
        uint256 stakeToReturn = node.stake;
        node.stake = 0;
        node.isActive = false;

        // Remove from active nodes
        for (uint256 i = 0; i < activeNodes.length; i++) {
            if (activeNodes[i] == msg.sender) {
                activeNodes[i] = activeNodes[activeNodes.length - 1];
                activeNodes.pop();
                break;
            }
        }

        require(rewardToken.transfer(msg.sender, stakeToReturn), "Stake return failed");
        emit MonitoringNodeUnregistered(msg.sender);
    }

    function addStake(uint256 _amount) external nonReentrant onlyRegisteredNode {
        require(_amount > 0, "Amount must be greater than 0");
        require(rewardToken.transferFrom(msg.sender, address(this), _amount), "Stake transfer failed");
        
        monitoringNodes[msg.sender].stake += _amount;
    }

    // Monitoring request functions
    function createMonitoringRequest(
        string memory _url,
        uint256 _interval,
        uint256 _timeout,
        uint256 _rewardPerCheck
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(bytes(_url).length > 0, "URL cannot be empty");
        require(_interval >= 60, "Interval must be at least 60 seconds");
        require(_timeout <= maxResponseTime, "Timeout too high");
        require(_rewardPerCheck > 0, "Reward must be greater than 0");

        uint256 requestId = _nextRequestId++;
        
        monitoringRequests[requestId] = MonitoringRequest({
            id: requestId,
            requester: msg.sender,
            url: _url,
            interval: _interval,
            timeout: _timeout,
            reward: _rewardPerCheck,
            isActive: true,
            createdAt: block.timestamp,
            lastCheckedAt: block.timestamp
        });

        activeRequests.push(requestId);
        _assignNodesToRequest(requestId);

        emit MonitoringRequestCreated(requestId, msg.sender, _url);
        return requestId;
    }

    function deactivateMonitoringRequest(uint256 _requestId) 
        external 
        validRequest(_requestId) 
    {
        require(
            monitoringRequests[_requestId].requester == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        
        monitoringRequests[_requestId].isActive = false;
        
        // Remove from active requests
        for (uint256 i = 0; i < activeRequests.length; i++) {
            if (activeRequests[i] == _requestId) {
                activeRequests[i] = activeRequests[activeRequests.length - 1];
                activeRequests.pop();
                break;
            }
        }
    }

    // Monitoring result functions
    function submitMonitoringResult(
        uint256 _requestId,
        bool _isUp,
        uint256 _responseTime
    ) external onlyRegisteredNode validRequest(_requestId) nonReentrant {
        require(!monitoringResults[_requestId][msg.sender].isSubmitted, "Result already submitted");
        require(_isNodeAssignedToRequest(_requestId, msg.sender), "Node not assigned to this request");
        
        monitoringResults[_requestId][msg.sender] = MonitoringResult({
            node: msg.sender,
            isUp: _isUp,
            responseTime: _responseTime,
            timestamp: block.timestamp,
            isSubmitted: true
        });

        monitoringNodes[msg.sender].totalChecks++;

        emit MonitoringResultSubmitted(_requestId, msg.sender, _isUp, _responseTime);
        
        // Check if consensus can be reached
        _checkConsensus(_requestId);
    }

    // Internal functions
    function _assignNodesToRequest(uint256 _requestId) internal {
        uint256 nodesToAssign = activeNodes.length >= 3 ? 3 : activeNodes.length;
        require(nodesToAssign > 0, "No active nodes available");

        // Simple round-robin assignment (in production, use more sophisticated selection)
        for (uint256 i = 0; i < nodesToAssign; i++) {
            address nodeAddress = activeNodes[i];
            requestNodes[_requestId].push(nodeAddress);
            nodeRequests[nodeAddress].push(_requestId);
        }
    }

    function _isNodeAssignedToRequest(uint256 _requestId, address _node) internal view returns (bool) {
        address[] memory nodes = requestNodes[_requestId];
        for (uint256 i = 0; i < nodes.length; i++) {
            if (nodes[i] == _node) {
                return true;
            }
        }
        return false;
    }

    function _checkConsensus(uint256 _requestId) internal {
        address[] memory nodes = requestNodes[_requestId];
        uint256 submittedCount = 0;
        uint256 upCount = 0;
        uint256 totalResponseTime = 0;

        // Count submitted results
        for (uint256 i = 0; i < nodes.length; i++) {
            if (monitoringResults[_requestId][nodes[i]].isSubmitted) {
                submittedCount++;
                if (monitoringResults[_requestId][nodes[i]].isUp) {
                    upCount++;
                }
                totalResponseTime += monitoringResults[_requestId][nodes[i]].responseTime;
            }
        }

        // Check if we have enough submissions
        if (submittedCount == nodes.length) {
            bool consensusIsUp = (upCount * 100) >= (submittedCount * consensusThreshold);
            uint256 averageResponseTime = submittedCount > 0 ? totalResponseTime / submittedCount : 0;

            emit ConsensusReached(_requestId, consensusIsUp, averageResponseTime);
            
            // Distribute rewards
            _distributeRewards(_requestId, consensusIsUp);
            
            // Update last checked time
            monitoringRequests[_requestId].lastCheckedAt = block.timestamp;
        }
    }

    function _distributeRewards(uint256 _requestId, bool _consensusResult) internal {
        address[] memory nodes = requestNodes[_requestId];
        uint256 reward = monitoringRequests[_requestId].reward;

        for (uint256 i = 0; i < nodes.length; i++) {
            address nodeAddress = nodes[i];
            MonitoringResult memory result = monitoringResults[_requestId][nodeAddress];
            
            if (result.isSubmitted) {
                if (result.isUp == _consensusResult) {
                    // Node submitted correct result, reward them
                    monitoringNodes[nodeAddress].successfulChecks++;
                    monitoringNodes[nodeAddress].reputation += 1;
                    
                    if (rewardToken.transfer(nodeAddress, reward)) {
                        emit RewardDistributed(nodeAddress, reward);
                    }
                } else {
                    // Node submitted incorrect result, apply penalty
                    if (monitoringNodes[nodeAddress].reputation > 1) {
                        monitoringNodes[nodeAddress].reputation -= 1;
                    }
                    emit PenaltyApplied(nodeAddress, 0); // Reputation penalty only
                }
            }
        }
    }

    // View functions
    function getActiveNodes() external view returns (address[] memory) {
        return activeNodes;
    }

    function getActiveRequests() external view returns (uint256[] memory) {
        return activeRequests;
    }

    function getRequestNodes(uint256 _requestId) external view returns (address[] memory) {
        return requestNodes[_requestId];
    }

    function getNodeRequests(address _node) external view returns (uint256[] memory) {
        return nodeRequests[_node];
    }

    function getNodeInfo(address _node) external view returns (MonitoringNode memory) {
        return monitoringNodes[_node];
    }

    function getRequestInfo(uint256 _requestId) external view returns (MonitoringRequest memory) {
        return monitoringRequests[_requestId];
    }

    // Admin functions
    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        minimumStake = _minimumStake;
    }

    function setConsensusThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold >= 51 && _threshold <= 100, "Threshold must be between 51-100");
        consensusThreshold = _threshold;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardToken.transfer(owner(), balance), "Transfer failed");
    }
}