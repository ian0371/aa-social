import { ethers } from "hardhat";
import { getContractFromDeployment } from "../lib";
import { SimpleAccountAPI } from "@account-abstraction/sdk";

async function main() {
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("SimpleAccountFactory");
  const [owner, bundler] = await ethers.getSigners();
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1);
  const sca = await ethers.getContractAt("SimpleAccount", scaAddr);

  const counter = await getContractFromDeployment("Counter");

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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
