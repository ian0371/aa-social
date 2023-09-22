import { HardhatUserConfig, task } from "hardhat/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@klaytn/hardhat-utils";
import "@primitivefi/hardhat-dodoc";
import "dotenv/config";
import * as fs from "fs";
import * as jose from "jose";

import { SimpleAccountAPI } from "@account-abstraction/sdk";
import { hexConcat } from "ethers/lib/utils";

// the first key of test-junk
const defaultKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const defaultKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const salt = 0;

export class NonZKGoogleAccountAPI extends SimpleAccountAPI {
  sub: string;

  constructor(params: any) {
    super(params);
    this.sub = params.sub;
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
        salt,
        this.sub,
      ]),
    ]);
  }
}

task("genjwt")
  .addParam("token", "ID token json file path", "id_token.json")
  .addParam("privkey", "Private key file path", "key.pem")
  .addParam("nonce", "ID token nonce to override", "0")
  .setAction(async ({ token, privkey, nonce }) => {
    const idToken = JSON.parse(fs.readFileSync(token).toString());
    idToken.nonce = nonce;
    const pk = fs.readFileSync(privkey);
    const privKey = await jose.importPKCS8(pk.toString(), "RSA");
    const jwt = await new jose.CompactSign(new TextEncoder().encode(JSON.stringify(idToken)))
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(privKey);
    console.log(jwt);
  });

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

task("sca-account")
  .addParam("addr", "SCA address")
  .setAction(async ({ addr }) => {
    const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", addr);
    const unresolved = {
      sca: sca.address,
      "sca.owner": sca.owner() as Promise<string>,
      deposit: hre.ethers.utils.formatEther(await sca.getDeposit()).slice(0, 4) + "ether",
      sub: sca.sub() as Promise<string>,
      recoveryNonce: sca.recoveryNonce() as Promise<string>,
    };
    const info = await promiseAllMap(unresolved);
    for (const each of Object.keys(info)) {
      console.log(`* ${each}: ${info[each as keyof typeof info]}`);
    }
  });

task("create-account")
  .addParam("jwt", "JWT string")
  // .addParam("pubkey", "Public key file path", "key.pem")
  .setAction(async ({ jwt, pubkey }) => {
    const [owner] = await hre.ethers.getSigners();
    // const [, payload] = jwt.split(".");
    // const idToken = JSON.parse(atob(payload));
    // const sub = idToken.sub;
    const { sub } = parseJwt(jwt);
    // const pk = fs.readFileSync(pubkey);

    const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
    const tx = await scaFactory.createAccount(owner.address, salt, sub);
    await tx.wait();

    const scaAddr = await getScaAddress(owner.address, salt, sub);
    const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", scaAddr);

    console.log("sca deployed to", scaAddr);
    console.log("owner:", await sca.owner());
  });

task("deposit")
  .addParam("addr", "SCA address")
  .setAction(async ({ addr }) => {
    const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", addr);
    const tx = await sca.addDeposit({ value: hre.ethers.utils.parseEther("0.05") });
    await tx.wait();
    console.log("total deposit", hre.ethers.utils.formatEther(await sca.getDeposit()), "ether");
  });

task("send-userop")
  .addParam("addr", "SCA address")
  .setAction(async ({ addr }) => {
    const [owner] = await hre.ethers.getSigners();
    const ep = await getContractFromDeployment("EntryPoint");
    const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
    const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", addr);
    const counter = await getContractFromDeployment("Counter");

    const walletAPI = new NonZKGoogleAccountAPI({
      provider: hre.ethers.provider,
      entryPointAddress: ep.address,
      owner,
      factoryAddress: scaFactory.address,
      sub: await sca.sub(),
    });
    const userOp = await walletAPI.createSignedUserOp({
      target: counter.address,
      data: counter.interface.encodeFunctionData("increment"),
    });

    console.log("counter.number before tx", await counter.number());
    const tx = await ep.handleOps([userOp], owner.address);
    await tx.wait();
    console.log("counter.number after tx", await counter.number());
  });

task("recover")
  .addParam("addr", "SCA address")
  .addParam("jwt", "JWT token")
  .setAction(async ({ addr, jwt }) => {
    const [, newOwner] = await hre.ethers.getSigners();
    const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", addr);
    const { header, idToken, sig } = parseJwt(jwt);

    console.log("sca owner before tx", await sca.owner());
    console.log(header, idToken, sig);
    const tx = await sca.updateOwnerByGoogleOIDC(newOwner.address, header, idToken, sig);
    await tx.wait();
    console.log("sca owner after tx", await sca.owner());
  });

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

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.18", // mumbai doesn't support PUSH0 yet
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    ],
  },
  networks: {
    baobab: {
      url: process.env.BAOBAB_URL || "https://archive-en.baobab.klaytn.net",
      chainId: 1001,
      accounts: [process.env.PRIVATE_KEY || defaultKey, defaultKey2],
      live: true,
      saveDeployments: true,
    },
    cypress: {
      url: process.env.CYPRESS_URL || "https://archive-en.cypress.klaytn.net",
      chainId: 8217,
      accounts: [process.env.PRIVATE_KEY || defaultKey],
      live: true,
      saveDeployments: true,
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      chainId: 80001,
      accounts: [process.env.PRIVATE_KEY || defaultKey, process.env.NEW_PRIVATE_KEY || defaultKey2],
      live: true,
      saveDeployments: true,
    },
    homi: {
      url: "http://127.0.0.1:8551",
      accounts: [process.env.PRIVATE_KEY || defaultKey],
      live: false,
      saveDeployments: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      // accounts: [process.env.PRIVATE_KEY || defaultKey, defaultKey2],
      live: false,
      saveDeployments: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  etherscan: { apiKey: "DUMMY" },
  dodoc: {
    exclude: ["hardhat/", "lib/"],
    runOnCompile: false,
    freshOutput: false,
  },
  paths: {
    deployments: "deployments",
  },
};

export default config;
