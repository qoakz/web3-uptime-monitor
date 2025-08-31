const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Import contract ABIs (you would typically import these from compiled contracts)
const UPTIME_MONITOR_ABI = [
  // Add the actual ABI here - this is a simplified version
  "function registerNode() external",
  "function createMonitoringRequest(string memory _url, uint256 _interval, uint256 _timeout, uint256 _rewardPerCheck) external payable returns (uint256)",
  "function submitMonitoringResult(uint256 _requestId, bool _isUp, uint256 _responseTime) external",
  "function getActiveNodes() external view returns (address[] memory)",
  "function getRequestInfo(uint256 _requestId) external view returns (tuple(uint256 id, address requester, string url, uint256 interval, uint256 timeout, uint256 reward, bool isActive, uint256 createdAt, uint256 lastCheckedAt))",
  "function getNodeInfo(address _node) external view returns (tuple(address nodeAddress, uint256 stake, uint256 reputation, uint256 totalChecks, uint256 successfulChecks, bool isActive, uint256 registrationTime))",
  "event MonitoringRequestCreated(uint256 indexed requestId, address indexed requester, string url)",
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
  constructor() {
    this.provider = null;
    this.signer = null;
    this.uptimeMonitorContract = null;
    this.rewardTokenContract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize provider
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize signer
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable not set');
      }
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Initialize contracts
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const tokenAddress = process.env.REWARD_TOKEN_ADDRESS;

      if (!contractAddress || !tokenAddress) {
        throw new Error('Contract addresses not set in environment variables');
      }

      this.uptimeMonitorContract = new ethers.Contract(
        contractAddress,
        UPTIME_MONITOR_ABI,
        this.signer
      );

      this.rewardTokenContract = new ethers.Contract(
        tokenAddress,
        REWARD_TOKEN_ABI,
        this.signer
      );

      // Verify connection
      await this.provider.getNetwork();
      
      this.isInitialized = true;
      logger.info('Blockchain service initialized successfully');
      
      // Start listening to events
      this.startEventListening();

    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  startEventListening() {
    if (!this.uptimeMonitorContract) return;

    // Listen for monitoring request events
    this.uptimeMonitorContract.on('MonitoringRequestCreated', async (requestId, requester, url, event) => {
      logger.info(`New monitoring request created: ${requestId} for ${url} by ${requester}`);
      
      try {
        // Update database with contract request ID
        const Monitor = require('../models/Monitor');
        await Monitor.findOneAndUpdate(
          { url, ownerAddress: requester.toLowerCase() },
          { contractRequestId: requestId.toString(), status: 'active' }
        );
      } catch (error) {
        logger.error('Error updating monitor with contract request ID:', error);
      }
    });

    // Listen for consensus events
    this.uptimeMonitorContract.on('ConsensusReached', async (requestId, isUp, averageResponseTime, event) => {
      logger.info(`Consensus reached for request ${requestId}: ${isUp ? 'UP' : 'DOWN'}, avg response: ${averageResponseTime}ms`);
      
      try {
        // Update monitor status in database
        const Monitor = require('../models/Monitor');
        const monitor = await Monitor.findOne({ contractRequestId: requestId.toString() });
        
        if (monitor) {
          const wasUp = monitor.isUp;
          monitor.isUp = isUp;
          monitor.lastChecked = new Date();
          monitor.lastResponseTime = parseInt(averageResponseTime.toString());
          monitor.totalChecks += 1;
          
          if (isUp) {
            monitor.successfulChecks += 1;
          } else {
            monitor.failedChecks += 1;
          }

          // Calculate uptime percentage
          monitor.uptime = (monitor.successfulChecks / monitor.totalChecks) * 100;

          // Handle status changes
          if (wasUp !== null && wasUp !== isUp) {
            if (isUp) {
              await monitor.resolveCurrentIncident();
            } else {
              await monitor.addIncident('down', 'Website is down');
            }
          }

          await monitor.save();

          // Emit real-time update
          const io = require('../server').io;
          if (io) {
            io.to(`monitor-${monitor._id}`).emit('statusUpdate', {
              monitorId: monitor._id,
              isUp,
              responseTime: averageResponseTime,
              uptime: monitor.uptime,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        logger.error('Error updating monitor from consensus event:', error);
      }
    });

    logger.info('Started listening to blockchain events');
  }

  async createMonitoringRequest(url, interval, timeout, rewardPerCheck) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.uptimeMonitorContract.createMonitoringRequest(
        url,
        interval,
        timeout,
        ethers.parseEther(rewardPerCheck.toString())
      );

      const receipt = await tx.wait();
      logger.info(`Monitoring request created, tx hash: ${receipt.hash}`);

      // Extract request ID from events
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.uptimeMonitorContract.interface.parseLog(log);
          return parsed.name === 'MonitoringRequestCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.uptimeMonitorContract.interface.parseLog(event);
        return parsed.args.requestId.toString();
      }

      return null;
    } catch (error) {
      logger.error('Error creating monitoring request:', error);
      throw error;
    }
  }

  async submitMonitoringResult(requestId, isUp, responseTime, nodeAddress) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Create a signer for the node
      const nodeSigner = this.signer; // In production, this would be the node's signer
      const contractWithNodeSigner = this.uptimeMonitorContract.connect(nodeSigner);

      const tx = await contractWithNodeSigner.submitMonitoringResult(
        requestId,
        isUp,
        responseTime
      );

      const receipt = await tx.wait();
      logger.info(`Monitoring result submitted, tx hash: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      logger.error('Error submitting monitoring result:', error);
      throw error;
    }
  }

  async getActiveNodes() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const nodes = await this.uptimeMonitorContract.getActiveNodes();
      return nodes;
    } catch (error) {
      logger.error('Error getting active nodes:', error);
      throw error;
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
        interval: info.interval.toString(),
        timeout: info.timeout.toString(),
        reward: info.reward.toString(),
        isActive: info.isActive,
        createdAt: new Date(parseInt(info.createdAt.toString()) * 1000),
        lastCheckedAt: new Date(parseInt(info.lastCheckedAt.toString()) * 1000)
      };
    } catch (error) {
      logger.error('Error getting request info:', error);
      throw error;
    }
  }

  async getNodeInfo(nodeAddress) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const info = await this.uptimeMonitorContract.getNodeInfo(nodeAddress);
      return {
        nodeAddress: info.nodeAddress,
        stake: info.stake.toString(),
        reputation: info.reputation.toString(),
        totalChecks: info.totalChecks.toString(),
        successfulChecks: info.successfulChecks.toString(),
        isActive: info.isActive,
        registrationTime: new Date(parseInt(info.registrationTime.toString()) * 1000)
      };
    } catch (error) {
      logger.error('Error getting node info:', error);
      throw error;
    }
  }

  async registerNode() {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // First approve the stake amount
      const minimumStake = ethers.parseEther('1000'); // 1000 tokens
      const approveTx = await this.rewardTokenContract.approve(
        await this.uptimeMonitorContract.getAddress(),
        minimumStake
      );
      await approveTx.wait();

      // Register the node
      const tx = await this.uptimeMonitorContract.registerNode();
      const receipt = await tx.wait();
      
      logger.info(`Node registered, tx hash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      logger.error('Error registering node:', error);
      throw error;
    }
  }

  async getTokenBalance(address) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const balance = await this.rewardTokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Error getting token balance:', error);
      throw error;
    }
  }

  async transferTokens(to, amount) {
    if (!this.isInitialized) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const tx = await this.rewardTokenContract.transfer(to, ethers.parseEther(amount.toString()));
      const receipt = await tx.wait();
      
      logger.info(`Tokens transferred, tx hash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      logger.error('Error transferring tokens:', error);
      throw error;
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

  async getCurrentBlock() {
    if (!this.provider) return null;
    
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error getting current block:', error);
      return null;
    }
  }

  async getGasPrice() {
    if (!this.provider) return null;
    
    try {
      const gasPrice = await this.provider.getFeeData();
      return gasPrice.gasPrice;
    } catch (error) {
      logger.error('Error getting gas price:', error);
      return null;
    }
  }
}

module.exports = BlockchainService;