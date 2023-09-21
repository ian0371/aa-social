import { deployments, ethers } from "hardhat";

async function main() {
  const factoryDeployment = await deployments.get("SimpleAccountFactory");
  const factory = await ethers.getContractAt("SimpleAccountFactory", factoryDeployment.address);
  const [owner] = await ethers.getSigners();

  await factory.createAccount(owner.address, 1);
  const scaAddr: string = await factory.getAddress(owner.address, 1);
  console.log("sca deployed to", scaAddr);

  const sca = await ethers.getContractAt("SimpleAccount", scaAddr);
  console.log("owner:", await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
