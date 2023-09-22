import { ethers } from "hardhat";
import { sub } from "./config";
import { getContractFromDeployment } from "../lib";

async function main() {
  const [owner] = await ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const scaAddr: string = await scaFactory.getAddress(owner.address, 0, sub);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);

  const tx = await sca.addDeposit({ value: ethers.utils.parseEther("0.05") });
  await tx.wait();
  console.log("total deposit", ethers.utils.formatEther(await sca.getDeposit()), "ether");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
