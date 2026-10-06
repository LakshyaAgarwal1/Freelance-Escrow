import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer, client, freelancer, arbitrator] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Arbitrator account:", arbitrator ? arbitrator.address : deployer.address);

  const defaultArbitrator = arbitrator ? arbitrator.address : deployer.address;

  const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
  const escrow = await FreelanceEscrow.deploy(defaultArbitrator);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("FreelanceEscrow deployed to:", escrowAddress);

  // Export contract deployment info and ABI for Frontend and Backend use
  const deploymentInfo = {
    address: escrowAddress,
    platformArbitrator: defaultArbitrator,
    network: {
      name: (await ethers.provider.getNetwork()).name,
      chainId: Number((await ethers.provider.getNetwork()).chainId),
    },
    deployedAt: new Date().toISOString(),
  };

  const contractsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info written to deployments/localhost.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
