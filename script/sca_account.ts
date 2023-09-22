import { ethers } from "hardhat";
import { sub, recoveryNonce } from "./config";
import { getContractFromDeployment } from "../lib";

export async function promiseAllMap<T, M extends Record<string, T | PromiseLike<T>>>(
  map: M,
): Promise<{ [P in keyof M]: Awaited<M[P]> }> {
  const resolvedArray = await Promise.all(Object.values(map));
  const resolvedMap: any = {};

  Object.keys(map).forEach((key, index) => {
    resolvedMap[key] = resolvedArray[index];
  });

  return resolvedMap;
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const scaAddr: string = await scaFactory.getAddress(signer.address, 1, sub, recoveryNonce);
  const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", scaAddr);
  const scaCode = await hre.ethers.provider.getCode(scaAddr);
  if (scaCode.length <= 2) {
    console.log("The sca does not exist yet");
    console.log("* signer:", signer.address);
    console.log("* counterfactual sca address:", scaAddr);
    return;
  }

  const unresolved = {
    signer: signer.address,
    sca: sca.address,
    "sca.owner": sca.owner() as Promise<string>,
    deposit: ethers.utils.formatEther(await sca.getDeposit()).slice(0, 4) + "ether",
    sub: sca.sub() as Promise<string>,
    recoveryNonce: sca.recoveryNonce() as Promise<string>,
  };
  const info = await promiseAllMap(unresolved);
  for (const each of Object.keys(info)) {
    console.log(`* ${each}: ${info[each as keyof typeof info]}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
