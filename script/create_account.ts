import { ethers } from "hardhat";
import { sub } from "./config";
import { getContractFromDeployment } from "../lib";

async function main() {
  const [owner] = await ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");

  const tx = await scaFactory.createAccount(owner.address, 0, sub);
  await tx.wait();

  const scaAddr: string = await scaFactory.getAddress(owner.address, 0, sub);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);
  console.log("sca deployed to", scaAddr);
  console.log("owner:", await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
