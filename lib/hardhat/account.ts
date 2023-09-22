import { deployments, ethers } from "hardhat";
import { hexConcat } from "ethers/lib/utils";
import { SimpleAccountAPI } from "@account-abstraction/sdk";

export async function getContractFromDeployment(name: string) {
  const Dep = await deployments.get(name);
  return await ethers.getContractAt(name, Dep.address);
}

export interface NonZKGoogleAccountApiParams {
  owner: any;
  provider: any;
  entryPointAddress: any;
  salt: number;
  sub: string;
}
export class NonZKGoogleAccountAPI extends SimpleAccountAPI {
  salt: number;
  sub: string;

  constructor(params: NonZKGoogleAccountApiParams) {
    super(params);
    this.salt = params.salt;
    this.sub = params.sub;
  }

  async getAccountInitCode() {
    // this.factory as any??= ;
    if (this.factory == null) {
      this.factory = (await ethers.getContractAt("NonZKGoogleAccountFactory", this.factoryAddress as any)) as any;
      throw new Error(`Factory is null ${this.factoryAddress}`);
    }
    return hexConcat([
      this.factory.address,
      (this.factory as any).interface.encodeFunctionData("createAccount", [
        await this.owner.getAddress(),
        this.salt,
        this.sub,
      ]),
    ]);
  }
}
