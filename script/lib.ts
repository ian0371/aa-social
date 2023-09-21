import { deployments, ethers } from "hardhat";
import { hexConcat } from "ethers/lib/utils";
import { SimpleAccountApiParams, SimpleAccountAPI } from "@account-abstraction/sdk";

export async function getContractFromDeployment(name: string) {
  const Dep = await deployments.get(name);
  return await ethers.getContractAt(name, Dep.address);
}

export interface NonZKGoogleAccountApiParams extends SimpleAccountApiParams {
  sub: string;
  recoveryNonce: string;
}
export class NonZKGoogleAccountAPI extends SimpleAccountAPI {
  sub: string;
  recoveryNonce: string;

  constructor(params: SimpleAccountApiParams) {
    super(params);
    this.sub = params.sub;
    this.recoveryNonce = params.recoveryNonce;
  }

  async getAccountInitCode(): Promise<string> {
    this.factory ??= await ethers.getContractAt("NonZKGoogleAccountFactory", this.factoryAddress);
    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData("createAccount", [
        await this.owner.getAddress(),
        1,
        this.sub,
        this.recoveryNonce,
      ]),
    ]);
  }
}
