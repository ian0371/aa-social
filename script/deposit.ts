import { ethers } from "hardhat";
import { sub, recoveryNonce } from "./config";
import { getContractFromDeployment } from "./lib";

async function main() {
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const [owner] = await ethers.getSigners();
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1, sub, recoveryNonce);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);

  await sca.addDeposit({ value: ethers.utils.parseEther("0.1") });
  console.log("deposit", ethers.utils.formatEther(await sca.getDeposit()), "ether");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
