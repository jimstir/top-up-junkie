const { task } = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");

// Task to deploy TopAcc contract
task("deploy:topacc", "Deploy TopAcc contract")
  .setAction(async (args, hre) => {
    await hre.run("run", {
      script: "./scripts/deploy.js",
      noCompile: true,
    });
  });

// Task to deploy AddService contract
task("deploy:addservice", "Deploy AddService contract")
  .setAction(async (args, hre) => {
    await hre.run("run", {
      script: "./scripts/deploy-service.js",
      noCompile: true,
    });
  });
