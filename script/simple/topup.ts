import { deployments, ethers } from "hardhat";

async function main() {
  const factoryDeployment = await deployments.get("SimpleAccountFactory");
  const factory = await ethers.getContractAt("SimpleAccountFactory", factoryDeployment.address);
  const [owner] = await ethers.getSigners();

  const scaAddr: string = await factory.getAddress(owner.address, 1);
  const sca = await ethers.getContractAt("SimpleAccount", scaAddr);
  await sca.addDeposit({ value: ethers.utils.parseEther("0.1") });
  // const tx = await owner.sendTransaction({
  //   to: scaAddr,
  //   value: ethers.utils.parseEther("10"),
  // });
  // await tx.wait();
  // console.log("sca balance:", ethers.utils.formatEther(await ethers.provider.getBalance(scaAddr)), "ether");
  console.log("deposit", ethers.utils.formatEther(await sca.getDeposit()), "ether");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
