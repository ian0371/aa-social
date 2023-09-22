import { HardhatUserConfig, task } from "hardhat/config";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-toolbox";
import "@klaytn/hardhat-utils";
import "@primitivefi/hardhat-dodoc";
import "dotenv/config";
import * as fs from "fs";
import * as jose from "jose";

import { promiseAllMap, getContractFromDeployment, getScaAddress, parseJwt, NonZKGoogleAccountAPI } from "./lib";

// the first key of test-junk
const defaultKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const defaultKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const salt = 0;

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
  .setAction(async ({ jwt }) => {
    const [owner] = await hre.ethers.getSigners();
    const { sub } = parseJwt(jwt);

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
      // index: salt,
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
    const tx = await sca.updateOwnerByGoogleOIDC(newOwner.address, header, idToken, sig);
    await tx.wait();
    console.log("sca owner after tx", await sca.owner());
  });

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
