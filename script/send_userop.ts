import { ethers } from "hardhat";
import { sub, recoveryNonce } from "./config";
import { getContractFromDeployment, NonZKGoogleAccountAPI } from "./lib";

async function main() {
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const counter = await getContractFromDeployment("Counter");
  const [owner, bundler] = await ethers.getSigners();

  const walletAPI = new NonZKGoogleAccountAPI({
    provider: ethers.provider,
    entryPointAddress: ep.address,
    owner,
    factoryAddress: scaFactory.address,
    sub,
    recoveryNonce,
  });
  const userOp = await walletAPI.createSignedUserOp({
    target: counter.address,
    data: counter.interface.encodeFunctionData("increment"),
  });

  await ep.handleOps([userOp], bundler.address);
  console.log(await counter.number());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
