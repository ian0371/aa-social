import { ethers } from "hardhat";
import { sub } from "./config";
import { getContractFromDeployment, NonZKGoogleAccountAPI } from "../lib";
import { HttpRpcClient } from "@account-abstraction/sdk";

async function main() {
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const counter = await getContractFromDeployment("Counter");
  const [owner] = await ethers.getSigners();

  const walletAPI = new NonZKGoogleAccountAPI({
    provider: ethers.provider,
    entryPointAddress: ep.address,
    owner,
    factoryAddress: scaFactory.address,
    sub,
  });
  const userOp = await walletAPI.createSignedUserOp({
    target: counter.address,
    data: counter.interface.encodeFunctionData("increment"),
    maxFeePerGas: 2000000000,
    maxPriorityFeePerGas: 2000000000,
  });

  const client = new HttpRpcClient(hre.network.config.url, ep.address, hre.network.config.chainId);
  console.log("counter.number before tx", await counter.number());
  const userOpHash = await client.sendUserOpToBundler(userOp);
  console.log("waiting for receipt of", userOpHash);

  let rc;
  while (true) {
    rc = await ethers.provider.send("eth_getUserOperationReceipt", [userOpHash]);
    if (rc != null) break;
    await new Promise((resolve) => setTimeout(resolve, 5000));
    process.stdout.write(".");
  }
  console.log("\ncounter.number after tx", await counter.number());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
