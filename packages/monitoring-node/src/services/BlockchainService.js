const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Simplified ABI for monitoring node operations
const UPTIME_MONITOR_ABI = [
  "function registerNode() external",
  "function getNodeInfo(address _node) external view returns (tuple(address nodeAddress, uint256 stake, uint256 reputation, uint256 totalChecks, uint256 successfulChecks, bool isActive, uint256 registrationTime))",
  "function getRequestNodes(uint256 _requestId) external view returns (address[] memory)",
  "function getNodeRequests(address _node) external view returns (uint256[] memory)",
  "function getRequestInfo(uint256 _requestId) external view returns (tuple(uint256 id, address requester, string url, uint256 interval, uint256 timeout, uint256 reward, bool isActive, uint256 createdAt, uint256 lastCheckedAt))",
  "function submitMonitoringResult(uint256 _requestId, bool _isUp, uint256 _responseTime) external",
  "event MonitoringResultSubmitted(uint256 indexed requestId, address indexed node, bool isUp, uint256 responseTime)",
  "event ConsensusReached(uint256 indexed requestId, bool isUp, uint256 averageResponseTime)"
];

const REWARD_TOKEN_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

class BlockchainService {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.signer = null;
    this.uptimeMonitorContract = null;
    this.rewardTokenContract = null;
    this.isInitialized = false;
    this.nodeAddress = null;
  }

  async initialize() {
    try {
      logger.info('Initializing blockchain service...');
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.config.ETHEREUM_RPC_URL);
      
      // Initialize signer
      this.signer = new ethers.Wallet(this.config.PRIVATE_KEY, this.provider);
      this.nodeAddress = this.signer.address;
      
      // Initialize contracts
      this.uptimeMonitorContract = new ethers.Contract(
        this.config.CONTRACT_ADDRESS,
        UPTIME_MONITOR_ABI,
        this.signer
      );
      
      this.rewardTokenContract = new ethers.Contract(
        this.config.REWARD_TOKEN_ADDRESS,
        REWARD_TOKEN_ABI,
        this.signer
      );
      
      // Verify connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Check balance
      const balance = await this.provider.getBalance(this.nodeAddress);
      const tokenBalance = await this.rewardTokenContract.balanceOf(this.nodeAddress);
      
      logger.info(`Node address: ${this.nodeAddress}`);
      logger.info(`ETH balance: ${ethers.formatEther(balance)} ETH`);
      logger.info(`Token balance: ${ethers.formatEther(tokenBalance)} UMT`);
      
      this.isInitialized = true;
      logger.info('Blockchain service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  getAddress() {
    return this.nodeAddress;
  }

  async isNodeRegistered() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const nodeInfo = await this.uptimeMonitorContract.getNodeInfo(this.nodeAddress);
      return nodeInfo.isActive;
    } catch (error) {
      logger.error('Error checking node registration:', error);
      return false;
    }
  }

  async registerNode() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      logger.info('Registering node on blockchain...');
      
      // First, approve the stake amount
      const minimumStake = ethers.parseEther(this.config.MINIMUM_STAKE);
      const currentAllowance = await this.rewardTokenContract.allowance(
        this.nodeAddress,
        this.config.CONTRACT_ADDRESS
      );
      
      if (currentAllowance < minimumStake) {
        logger.info('Approving stake amount...');
        const approveTx = await this.rewardTokenContract.approve(
          this.config.CONTRACT_ADDRESS,
          minimumStake
        );
        await approveTx.wait();
        logger.info('Stake amount approved');
      }
      
      // Register the node
      logger.info('Submitting node registration...');
      const tx = await this.uptimeMonitorContract.registerNode();
      
      logger.info(`Registration transaction submitted: ${tx.hash}`);
      return tx.hash;
      
    } catch (error) {
      logger.error('Failed to register node:', error);
      throw error;
    }
  }

  async getAssignedRequests(nodeAddress) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const requestIds = await this.uptimeMonitorContract.getNodeRequests(nodeAddress);
      return requestIds.map(id => id.toString());
    } catch (error) {
      logger.error('Error getting assigned requests:', error);
      return [];
    }
  }

  async getRequestInfo(requestId) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const info = await this.uptimeMonitorContract.getRequestInfo(requestId);
      return {
        id: info.id.toString(),
        requester: info.requester,
        url: info.url,
        interval: parseInt(info.interval.toString()),
        timeout: parseInt(info.timeout.toString()),
        reward: info.reward.toString(),
        isActive: info.isActive,
        createdAt: new Date(parseInt(info.createdAt.toString()) * 1000),
        lastCheckedAt: new Date(parseInt(info.lastCheckedAt.toString()) * 1000)
      };
    } catch (error) {
      logger.error(`Error getting request info for ${requestId}:`, error);
      throw error;
    }
  }

  async submitMonitoringResult(requestId, isUp, responseTime) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      logger.debug(`Submitting monitoring result for request ${requestId}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);
      
      const tx = await this.uptimeMonitorContract.submitMonitoringResult(
        requestId,
        isUp,
        responseTime
      );
      
      logger.debug(`Result submission transaction: ${tx.hash}`);
      return tx.hash;
      
    } catch (error) {
      logger.error(`Failed to submit monitoring result for request ${requestId}:`, error);
      throw error;
    }
  }

  async waitForTransaction(txHash, timeout = 60000) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      logger.debug(`Waiting for transaction confirmation: ${txHash}`);
      
      const receipt = await this.provider.waitForTransaction(txHash, 1, timeout);
      
      if (receipt.status === 1) {
        logger.debug(`Transaction confirmed: ${txHash}`);
        return receipt;
      } else {
        throw new Error(`Transaction failed: ${txHash}`);
      }
      
    } catch (error) {
      logger.error(`Error waiting for transaction ${txHash}:`, error);
      throw error;
    }
  }

  async getNodeInfo(nodeAddress = null) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    const address = nodeAddress || this.nodeAddress;

    try {
      const info = await this.uptimeMonitorContract.getNodeInfo(address);
      return {
        nodeAddress: info.nodeAddress,
        stake: info.stake.toString(),
        reputation: parseInt(info.reputation.toString()),
        totalChecks: parseInt(info.totalChecks.toString()),
        successfulChecks: parseInt(info.successfulChecks.toString()),
        isActive: info.isActive,
        registrationTime: new Date(parseInt(info.registrationTime.toString()) * 1000)
      };
    } catch (error) {
      logger.error(`Error getting node info for ${address}:`, error);
      throw error;
    }
  }

  async getTokenBalance(address = null) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    const targetAddress = address || this.nodeAddress;

    try {
      const balance = await this.rewardTokenContract.balanceOf(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Error getting token balance for ${targetAddress}:`, error);
      throw error;
    }
  }

  async getEthBalance(address = null) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    const targetAddress = address || this.nodeAddress;

    try {
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Error getting ETH balance for ${targetAddress}:`, error);
      throw error;
    }
  }

  async getCurrentBlock() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error getting current block:', error);
      throw error;
    }
  }

  async getGasPrice() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice;
    } catch (error) {
      logger.error('Error getting gas price:', error);
      throw error;
    }
  }

  async estimateGas(method, args = []) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const gasEstimate = await this.uptimeMonitorContract[method].estimateGas(...args);
      return gasEstimate.toString();
    } catch (error) {
      logger.error(`Error estimating gas for ${method}:`, error);
      throw error;
    }
  }

  // Event listening
  startEventListening() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    // Listen for monitoring result events
    this.uptimeMonitorContract.on('MonitoringResultSubmitted', (requestId, node, isUp, responseTime, event) => {
      if (node.toLowerCase() === this.nodeAddress.toLowerCase()) {
        logger.info(`Monitoring result confirmed for request ${requestId}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);
      }
    });

    // Listen for consensus events
    this.uptimeMonitorContract.on('ConsensusReached', (requestId, isUp, averageResponseTime, event) => {
      logger.info(`Consensus reached for request ${requestId}: ${isUp ? 'UP' : 'DOWN'}, avg response: ${averageResponseTime}ms`);
    });

    logger.info('Started listening to blockchain events');
  }

  stopEventListening() {
    if (this.uptimeMonitorContract) {
      this.uptimeMonitorContract.removeAllListeners();
      logger.info('Stopped listening to blockchain events');
    }
  }

  // Utility methods
  formatEther(amount) {
    return ethers.formatEther(amount);
  }

  parseEther(amount) {
    return ethers.parseEther(amount.toString());
  }

  isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = BlockchainService;