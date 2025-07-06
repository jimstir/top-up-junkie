const { task } = require("hardhat/config");

task("test-flow", "Runs the complete test flow for TopAcc and AddService")
  .setAction(async (taskArgs, hre) => {
    // Run the test flow script
    await hre.run("run", {
      noCompile: true,
      script: "./scripts/testFlow.js"
    });
  });

module.exports = {};
