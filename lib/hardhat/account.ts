import { hexConcat } from "ethers/lib/utils";
import { SimpleAccountAPI } from "@account-abstraction/sdk";

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

export async function getContractFromDeployment(name: string) {
  const Dep = await hre.deployments.get(name);
  return await hre.ethers.getContractAt(name, Dep.address);
}

export async function getScaAddress(ownerAddress: string, salt: number, sub: string) {
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  return await scaFactory.getAddress(ownerAddress, salt, sub);
}

export function parseJwt(jwtToken: string) {
  const [header, payload, signature] = jwtToken.split(".");
  const idToken = atob(payload); // {"iss":"http://server.example.com","sub":"248289761001","aud":"s6BhdRkqt3","nonce":"0x8d9abb9b140bd3c63db2ce7ee3171ab1c2284fd905ad13156df1069a1918b2b3","iat":1311281970,"exp":1726640433,"name":"Jane Doe","given_name":"Jane","family_name":"Doe","gender":"female","birthdate":"0000-10-31","email":"janedoe@example.com","picture":"http://example.com/janedoe/me.jpg"}
  const sig = "0x" + Buffer.from(signature, "base64").toString("hex"); // 0x36afd1c5e35b74850fba558d508f1fcbe1bc4501ce53545d785f08a5f36d6136d3a90f951b0e9f88f22c652a76e6fd019b5afd25350543b06fe353c8548eed33c210463fba20bfca42beed4785b7ac45ab5eded1a575e28bdc400e97edfbbcd7ddf9342a59ea55a42d17b5419a9cb55fb3eba3d70687e4f8a726901272740ad0a29ffb3f6edccbb61e9931953c9f66600841a54a13e6540c736be5eb704526482f8d8388a301000751427c3481ff5ed702e88d760a0638fb7e688a1490da054b76d42ef964dd5a055218f1e02f5de7bc3a1f83b279572225fd2333b9137d88cdfc91dda4c242b707e6ab739944f681c371114632d63fd739cf069e9019abdacf
  const sub = JSON.parse(idToken).sub;
  const nonce = JSON.parse(idToken).nonce;
  return { header, payload, idToken, sig, sub, nonce };
}

export class NonZKGoogleAccountAPI extends SimpleAccountAPI {
  sub: string;
  salt: number;

  constructor(params: any) {
    super(params);
    this.sub = params.sub;
    this.salt = params.salt;
  }

  async getAccountInitCode() {
    if (this.factory == null) {
      this.factory = (await hre.ethers.getContractAt("NonZKGoogleAccountFactory", this.factoryAddress as any)) as any;
    }
    if (this.factory == null) {
      throw new Error("Factory null");
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
