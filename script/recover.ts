import { ethers } from "hardhat";
import { header, idToken, sig, sub, recoveryNonce } from "./config";
import { recoveryNonce as newRecoveryNonce } from "./config_revert";
import { getContractFromDeployment } from "../lib";

async function main() {
  const [owner, newOwner] = await ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1, sub, recoveryNonce);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);

  console.log("sca owner before tx", await sca.owner());
  const tx = await sca.updateOwnerByGoogleOIDC(newOwner.address, header, idToken, sig, newRecoveryNonce);
  await tx.wait();
  console.log("sca owner after tx", await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
