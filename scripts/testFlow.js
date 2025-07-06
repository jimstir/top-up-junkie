const { ethers } = require("hardhat");

async function main() {
  // Get signers (accounts)
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("Mock USDC", "mUSDC", 6, 1000000); // 1M tokens with 6 decimals
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);

  // 2. Deploy TopAcc contract
  const TopAcc = await ethers.getContractFactory("TopAcc");
  const topAcc = await TopAcc.deploy(mockUSDC.address);
  await topAcc.deployed();
  console.log("TopAcc deployed to:", topAcc.address);

  // 3. Deploy AddService contract (by user2)
  const AddService = await ethers.getContractFactory("AddService");
  const addService = await AddService.connect(user2).deploy();
  await addService.deployed();
  console.log("AddService deployed to:", addService.address);

  // 4. Mint some USDC to user1 and approve TopAcc to spend it
  const amount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
  await mockUSDC.mint(user1.address, amount);
  await mockUSDC.connect(user1).approve(topAcc.address, amount);
  console.log("Minted and approved 1000 USDC for user1");

  // 5. User1 deposits funds to TopAcc
  await mockUSDC.connect(user1).approve(topAcc.address, amount);
  await topAcc.connect(user1).depositFunds(amount);
  console.log("User1 deposited 1000 USDC to TopAcc");

  // 6. Check TopAcc balance
  const balance = await topAcc.userBalances(user1.address);
  console.log("User1 TopAcc balance:", ethers.utils.formatUnits(balance, 6), "USDC");

  // 7. User2 (AddService owner) registers a new service
  const cost = ethers.utils.parseUnits("10", 6); // 10 USDC
  const interval = 86400; // 1 day in seconds
  
  // Set the AddService address in TopAcc contract
  await topAcc.connect(deployer).setAddServiceAddress(addService.address);
  
  // Register a new service
  const tx = await addService.connect(user2).registerService(cost, interval);
  const receipt = await tx.wait();
  
  // Get the service ID from the event
  const serviceRegisteredEvent = receipt.events?.find((e) => e.event === 'ServiceRegistered');
  const serviceId = serviceRegisteredEvent?.args?.serviceId;
  console.log(`Service registered with ID: ${serviceId}`);
  console.log(`Service cost: 10 USDC, interval: 1 day`);

  // 8. User1 authorizes and joins the service
  const maxAmount = ethers.utils.parseUnits("50", 6);
  await topAcc.connect(user1).authorizeAndJoinService(serviceId, maxAmount, interval);
  console.log("User1 authorized and joined the service");

  // 9. Check user's service authorization
  const serviceAuth = await topAcc.serviceAuthorizations(user1.address, serviceId);
  console.log("User1 service authorization:", {
    isAuthorized: serviceAuth.isAuthorized,
    maxAmount: ethers.utils.formatUnits(serviceAuth.maxAmount, 6) + ' USDC',
    interval: serviceAuth.interval + ' seconds',
    lastCharge: new Date(serviceAuth.lastCharge * 1000).toISOString()
  });

  // 10. Check TopAcc balance after authorization
  const topAccBalance = await topAcc.userBalances(user1.address);
  console.log("User1 TopAcc balance after service authorization:", 
    ethers.utils.formatUnits(topAccBalance, 6), "USDC");

  console.log("Test flow completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
