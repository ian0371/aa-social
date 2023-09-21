import { ethers } from "hardhat";
import { getContractFromDeployment } from "../../lib";

async function main() {
  const scaFactory = await getContractFromDeployment("SimpleAccountFactory");
  const [owner] = await ethers.getSigners();
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1);
  const sca = await ethers.getContractAt("SimpleAccount", scaAddr);

  await sca.addDeposit({ value: ethers.utils.parseEther("0.1") });
  console.log("deposit", ethers.utils.formatEther(await sca.getDeposit()), "ether");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
