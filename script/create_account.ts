import { deployments, ethers } from "hardhat";

async function main() {
  const factoryDeployment = await deployments.get("NonZKGoogleAccountFactory");
  const factory = await ethers.getContractAt("NonZKGoogleAccountFactory", factoryDeployment.address);
  const [owner] = await ethers.getSigners();

  await factory.createAccount(owner.address, 1, process.env.SUB, process.env.NONCE);
  const scaAddr: string = await factory.getAddress(owner.address, 1, process.env.SUB, process.env.NONCE);
  console.log("sca deployed to", scaAddr);

  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);
  console.log("owner:", await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
