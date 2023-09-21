import { ethers } from "hardhat";
import { header, idToken, sig, sub, recoveryNonce } from "./config";
import { getContractFromDeployment, NonZKGoogleAccountAPI } from "../lib";
import { HttpRpcClient } from "@account-abstraction/sdk";
import { recoveryNonce as newRecoveryNonce } from "./config_revert";

async function main() {
  const [owner, newOwner] = await ethers.getSigners();
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1, sub, recoveryNonce);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);

  const walletAPI = new NonZKGoogleAccountAPI({
    provider: ethers.provider,
    entryPointAddress: ep.address,
    owner,
    factoryAddress: scaFactory.address,
    sub,
    recoveryNonce,
  });
  const userOp = await walletAPI.createSignedUserOp({
    target: sca.address,
    data: sca.interface.encodeFunctionData("updateOwnerByGoogleOIDC", [
      newOwner.address,
      header,
      idToken,
      sig,
      newRecoveryNonce,
    ]),
    maxFeePerGas: 2000000000,
    maxPriorityFeePerGas: 2000000000,
  });

  const client = new HttpRpcClient(hre.network.config.url, ep.address, hre.network.config.chainId);
  console.log("sca owner before tx", await sca.owner());
  const userOpHash = await client.sendUserOpToBundler(userOp);
  console.log("waiting for receipt of", userOpHash);

  let rc;
  while (true) {
    rc = await ethers.provider.send("eth_getUserOperationReceipt", [userOpHash]);
    if (rc != null) break;
    await new Promise((resolve) => setTimeout(resolve, 5000));
    process.stdout.write(".");
  }
  console.log("\nsca owner after tx", await sca.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
