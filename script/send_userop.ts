import { ethers } from "hardhat";
import { header, idToken, sig, sub, recoveryNonce, newRecoveryNonce } from "./config";
import { getContractFromDeployment, NonZKGoogleAccountAPI } from "./lib";
import { resolveProperties } from "@account-abstraction/sdk";

async function main() {
  const ep = await getContractFromDeployment("EntryPoint");
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const [owner, newOwner, bundler] = await ethers.getSigners();
  const scaAddr: string = await scaFactory.getAddress(owner.address, 1, sub, recoveryNonce);
  const sca = await ethers.getContractAt("NonZKGoogleAccount", scaAddr);

  const counter = await getContractFromDeployment("Counter");

  const walletAPI = new NonZKGoogleAccountAPI({
    provider: ethers.provider,
    entryPointAddress: ep.address,
    owner,
    factoryAddress: scaFactory.address,
    sub,
    recoveryNonce,
  });
  // console.log(await walletAPI.getAccountInitCode());
  // const userOp = await walletAPI.createSignedUserOp({
  //   target: counter.address,
  //   data: counter.interface.encodeFunctionData("increment"),
  // });
  console.log(await owner.signMessage("asdf"));
  console.log("1234");

  const userOp = await walletAPI.createSignedUserOp({
    target: sca.address,
    data: sca.interface.encodeFunctionData("updateOwnerByGoogleOIDC", [
      newOwner.address,
      header,
      idToken,
      sig,
      newRecoveryNonce,
    ]),
  });
  // console.log(
  //   ep.interface.functions[
  //     "handleOps((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address)"
  //   ],
  // );
  // console.log(await resolveProperties(userOp));
  // walletAPI.console.log("userOp hash:", await walletAPI.getUserOpHash(userOp));
  // console.log(await userOp.signature);

  // await ep.handleOps(
  //   [
  //     [
  //       await userOp.sender,
  //       await userOp.nonce,
  //       userOp.initCode,
  //       userOp.callData,
  //       userOp.callGasLimit,
  //       userOp.verificationGasLimit,
  //       await userOp.preVerificationGas,
  //       userOp.maxFeePerGas,
  //       userOp.maxPriorityFeePerGas,
  //       userOp.paymasterAndData,
  //       await userOp.signature,
  //     ],
  //   ],
  //   bundler.address,
  // );
  await ep.handleOps([userOp], bundler.address);
  console.log(await counter.number());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
