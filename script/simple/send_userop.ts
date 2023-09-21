import { ethers } from "hardhat";
import { getContractFromDeployment } from "../../lib";
import { SimpleAccountAPI } from "@account-abstraction/sdk";

async function main() {
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("SimpleAccountFactory");
  const counter = await getContractFromDeployment("Counter");
  const [owner, bundler] = await ethers.getSigners();

  const walletAPI = new SimpleAccountAPI({
    provider: ethers.provider,
    entryPointAddress: ep.address,
    index: 1,
    owner,
    factoryAddress: scaFactory.address,
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
