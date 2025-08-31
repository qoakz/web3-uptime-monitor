const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("UptimeMonitor", function () {
  async function deployContractsFixture() {
    const [owner, node1, node2, node3, requester] = await ethers.getSigners();

    // Deploy RewardToken
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();

    // Deploy UptimeMonitor
    const UptimeMonitor = await ethers.getContractFactory("UptimeMonitor");
    const uptimeMonitor = await UptimeMonitor.deploy(await rewardToken.getAddress());
    await uptimeMonitor.waitForDeployment();

    // Add UptimeMonitor as minter
    await rewardToken.addMinter(await uptimeMonitor.getAddress());

    // Transfer tokens to nodes and requester for testing
    const transferAmount = ethers.parseEther("10000");
    await rewardToken.transfer(node1.address, transferAmount);
    await rewardToken.transfer(node2.address, transferAmount);
    await rewardToken.transfer(node3.address, transferAmount);
    await rewardToken.transfer(requester.address, transferAmount);

    // Transfer reward tokens to contract
    const rewardAmount = ethers.parseEther("1000000");
    await rewardToken.transfer(await uptimeMonitor.getAddress(), rewardAmount);

    return {
      rewardToken,
      uptimeMonitor,
      owner,
      node1,
      node2,
      node3,
      requester
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { uptimeMonitor, rewardToken } = await loadFixture(deployContractsFixture);
      
      expect(await uptimeMonitor.rewardToken()).to.equal(await rewardToken.getAddress());
      expect(await uptimeMonitor.minimumStake()).to.equal(ethers.parseEther("1000"));
      expect(await uptimeMonitor.consensusThreshold()).to.equal(66);
    });
  });

  describe("Node Registration", function () {
    it("Should allow nodes to register with sufficient stake", async function () {
      const { uptimeMonitor, rewardToken, node1 } = await loadFixture(deployContractsFixture);
      
      const minimumStake = await uptimeMonitor.minimumStake();
      
      // Approve and register
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await expect(uptimeMonitor.connect(node1).registerNode())
        .to.emit(uptimeMonitor, "MonitoringNodeRegistered")
        .withArgs(node1.address, minimumStake);

      const nodeInfo = await uptimeMonitor.getNodeInfo(node1.address);
      expect(nodeInfo.isActive).to.be.true;
      expect(nodeInfo.stake).to.equal(minimumStake);
      expect(nodeInfo.reputation).to.equal(100);
    });

    it("Should not allow double registration", async function () {
      const { uptimeMonitor, rewardToken, node1 } = await loadFixture(deployContractsFixture);
      
      const minimumStake = await uptimeMonitor.minimumStake();
      
      // First registration
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await uptimeMonitor.connect(node1).registerNode();

      // Second registration should fail
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await expect(uptimeMonitor.connect(node1).registerNode())
        .to.be.revertedWith("Node already registered");
    });

    it("Should allow nodes to unregister and get stake back", async function () {
      const { uptimeMonitor, rewardToken, node1 } = await loadFixture(deployContractsFixture);
      
      const minimumStake = await uptimeMonitor.minimumStake();
      const initialBalance = await rewardToken.balanceOf(node1.address);
      
      // Register
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await uptimeMonitor.connect(node1).registerNode();
      
      // Unregister
      await expect(uptimeMonitor.connect(node1).unregisterNode())
        .to.emit(uptimeMonitor, "MonitoringNodeUnregistered")
        .withArgs(node1.address);

      const nodeInfo = await uptimeMonitor.getNodeInfo(node1.address);
      expect(nodeInfo.isActive).to.be.false;
      expect(nodeInfo.stake).to.equal(0);
      
      const finalBalance = await rewardToken.balanceOf(node1.address);
      expect(finalBalance).to.equal(initialBalance);
    });
  });

  describe("Monitoring Requests", function () {
    it("Should allow creating monitoring requests", async function () {
      const { uptimeMonitor, requester } = await loadFixture(deployContractsFixture);
      
      const url = "https://example.com";
      const interval = 300; // 5 minutes
      const timeout = 5000; // 5 seconds
      const reward = ethers.parseEther("1");

      await expect(uptimeMonitor.connect(requester).createMonitoringRequest(url, interval, timeout, reward))
        .to.emit(uptimeMonitor, "MonitoringRequestCreated");

      const requestInfo = await uptimeMonitor.getRequestInfo(1);
      expect(requestInfo.requester).to.equal(requester.address);
      expect(requestInfo.url).to.equal(url);
      expect(requestInfo.interval).to.equal(interval);
      expect(requestInfo.isActive).to.be.true;
    });

    it("Should validate request parameters", async function () {
      const { uptimeMonitor, requester } = await loadFixture(deployContractsFixture);
      
      // Empty URL
      await expect(uptimeMonitor.connect(requester).createMonitoringRequest("", 300, 5000, ethers.parseEther("1")))
        .to.be.revertedWith("URL cannot be empty");

      // Too short interval
      await expect(uptimeMonitor.connect(requester).createMonitoringRequest("https://example.com", 30, 5000, ethers.parseEther("1")))
        .to.be.revertedWith("Interval must be at least 60 seconds");

      // Zero reward
      await expect(uptimeMonitor.connect(requester).createMonitoringRequest("https://example.com", 300, 5000, 0))
        .to.be.revertedWith("Reward must be greater than 0");
    });
  });

  describe("Monitoring Results and Consensus", function () {
    it("Should accept monitoring results from assigned nodes", async function () {
      const { uptimeMonitor, rewardToken, node1, node2, node3, requester } = await loadFixture(deployContractsFixture);
      
      // Register nodes
      const minimumStake = await uptimeMonitor.minimumStake();
      for (const node of [node1, node2, node3]) {
        await rewardToken.connect(node).approve(await uptimeMonitor.getAddress(), minimumStake);
        await uptimeMonitor.connect(node).registerNode();
      }

      // Create monitoring request
      const url = "https://example.com";
      const interval = 300;
      const timeout = 5000;
      const reward = ethers.parseEther("1");
      
      await uptimeMonitor.connect(requester).createMonitoringRequest(url, interval, timeout, reward);
      
      // Submit results
      await expect(uptimeMonitor.connect(node1).submitMonitoringResult(1, true, 200))
        .to.emit(uptimeMonitor, "MonitoringResultSubmitted")
        .withArgs(1, node1.address, true, 200);
    });

    it("Should reach consensus and distribute rewards", async function () {
      const { uptimeMonitor, rewardToken, node1, node2, node3, requester } = await loadFixture(deployContractsFixture);
      
      // Register nodes
      const minimumStake = await uptimeMonitor.minimumStake();
      for (const node of [node1, node2, node3]) {
        await rewardToken.connect(node).approve(await uptimeMonitor.getAddress(), minimumStake);
        await uptimeMonitor.connect(node).registerNode();
      }

      // Create monitoring request
      const reward = ethers.parseEther("1");
      await uptimeMonitor.connect(requester).createMonitoringRequest("https://example.com", 300, 5000, reward);
      
      // Get initial balances
      const initialBalances = await Promise.all([
        rewardToken.balanceOf(node1.address),
        rewardToken.balanceOf(node2.address),
        rewardToken.balanceOf(node3.address)
      ]);

      // Submit results (2 nodes say up, 1 says down - consensus should be up)
      await uptimeMonitor.connect(node1).submitMonitoringResult(1, true, 200);
      await uptimeMonitor.connect(node2).submitMonitoringResult(1, true, 180);
      
      // This should trigger consensus
      await expect(uptimeMonitor.connect(node3).submitMonitoringResult(1, false, 5000))
        .to.emit(uptimeMonitor, "ConsensusReached")
        .withArgs(1, true, 1793); // average response time

      // Check rewards were distributed
      const finalBalances = await Promise.all([
        rewardToken.balanceOf(node1.address),
        rewardToken.balanceOf(node2.address),
        rewardToken.balanceOf(node3.address)
      ]);

      // Nodes 1 and 2 should get rewards (they agreed with consensus)
      expect(finalBalances[0]).to.equal(initialBalances[0] + reward);
      expect(finalBalances[1]).to.equal(initialBalances[1] + reward);
      // Node 3 should not get reward (disagreed with consensus)
      expect(finalBalances[2]).to.equal(initialBalances[2]);
    });

    it("Should not allow duplicate result submissions", async function () {
      const { uptimeMonitor, rewardToken, node1, requester } = await loadFixture(deployContractsFixture);
      
      // Register node
      const minimumStake = await uptimeMonitor.minimumStake();
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await uptimeMonitor.connect(node1).registerNode();

      // Create monitoring request
      await uptimeMonitor.connect(requester).createMonitoringRequest("https://example.com", 300, 5000, ethers.parseEther("1"));
      
      // Submit first result
      await uptimeMonitor.connect(node1).submitMonitoringResult(1, true, 200);
      
      // Try to submit again
      await expect(uptimeMonitor.connect(node1).submitMonitoringResult(1, true, 200))
        .to.be.revertedWith("Result already submitted");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update parameters", async function () {
      const { uptimeMonitor, owner } = await loadFixture(deployContractsFixture);
      
      await uptimeMonitor.connect(owner).setMinimumStake(ethers.parseEther("2000"));
      expect(await uptimeMonitor.minimumStake()).to.equal(ethers.parseEther("2000"));

      await uptimeMonitor.connect(owner).setConsensusThreshold(75);
      expect(await uptimeMonitor.consensusThreshold()).to.equal(75);
    });

    it("Should not allow non-owner to update parameters", async function () {
      const { uptimeMonitor, node1 } = await loadFixture(deployContractsFixture);
      
      await expect(uptimeMonitor.connect(node1).setMinimumStake(ethers.parseEther("2000")))
        .to.be.revertedWithCustomError(uptimeMonitor, "OwnableUnauthorizedAccount");
    });

    it("Should allow pausing and unpausing", async function () {
      const { uptimeMonitor, rewardToken, owner, node1 } = await loadFixture(deployContractsFixture);
      
      // Pause the contract
      await uptimeMonitor.connect(owner).pause();
      
      // Try to register node while paused
      const minimumStake = await uptimeMonitor.minimumStake();
      await rewardToken.connect(node1).approve(await uptimeMonitor.getAddress(), minimumStake);
      await expect(uptimeMonitor.connect(node1).registerNode())
        .to.be.revertedWithCustomError(uptimeMonitor, "EnforcedPause");

      // Unpause
      await uptimeMonitor.connect(owner).unpause();
      
      // Should work now
      await expect(uptimeMonitor.connect(node1).registerNode())
        .to.emit(uptimeMonitor, "MonitoringNodeRegistered");
    });
  });
});