import { ethers } from "hardhat";
import { sub, recoveryNonce } from "./config";
import { getContractFromDeployment } from "../lib";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const scaAddr: string = await scaFactory.getAddress(signer.address, 1, sub, recoveryNonce);
  const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", scaAddr);
  const scaCode = await hre.ethers.provider.getCode(scaAddr);
  if (scaCode.length <= 2) {
    console.log("signer address: ", signer.address);
    console.log("Counterfactual address: ", scaAddr);
    return;
  }

  console.log("Signer\t\tSCA\t\towner");
  console.log(signer.address, sca.address, await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
