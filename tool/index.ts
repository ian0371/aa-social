import { program } from "commander";
import * as jose from "jose";
import * as fs from "fs";
import { ethers } from "ethers";
import * as hre from "hardhat";
// const hre = require("hardhat");
// import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

async function main() {
  program
    .command("genjwt")
    .option("--in <idtokenFile>")
    .option("--private-key <privateKeyFile>")
    .option("--recovery-nonce <nonce>")
    .action(genJwt);

  program
    .command("create-account")
    .option("--jwt <jwt>")
    .option("--salt <salt>")
    .option("--public-key <publicKeyFile>")
    .option("--network <network>")
    .action(createAccount);

  program.command("test").option("--network <network>").action(test);
  // program.command("test").action(test);

  // program.command("create-account <idtokenFile> <privateKeyFile> <nonce>").action(genJwt);
  program.parse();
}

async function genJwt(options: { in: string; privateKey: string; recoveryNonce: string }) {
  const idToken = JSON.parse(fs.readFileSync(options.in ?? "id_token.json").toString());
  idToken.nonce = options.recoveryNonce;
  const pk = fs.readFileSync(options.privateKey ?? "key.pem");
  const privKey = await jose.importPKCS8(pk.toString(), "RSA");
  const token = await new jose.CompactSign(new TextEncoder().encode(JSON.stringify(idToken)))
    .setProtectedHeader({ alg: "RS256" })
    .sign(privKey);
  console.log(token);
}

async function getFromDeployment(name: string, network: string) {
  const addr = JSON.parse(fs.readFileSync(`deployments/${network}/${name}.json`).toString()).address;
  const artifact = hre.artifacts.readArtifactSync(name);
  const iface = new ethers.utils.Interface(artifact.abi);
  return new ethers.Contract(addr, iface);
}

async function createAccount(options: { jwt: string; salt: string; publicKey: string; network: string }) {
  let provider;
  if (options.network == "localhost") {
    provider = ethers.getDefaultProvider();
  } else if (options.network == "mumbai") {
    provider = ethers.getDefaultProvider();
  } else {
    provider = ethers.getDefaultProvider();
  }
  hre.userConfig.defaultNetwork;
  const [owner] = await ethers.getSigners();
  /*
  const [owner] = await hre.ethers.getSigners();
  const scaFactory = await getContractFromDeployment("NonZKGoogleAccountFactory");
  const [header, payload, signature] = options.jwt.split(".");
  const idToken = JSON.parse(atob(payload));
  const sub = idToken.sub;
  const salt = options.salt ?? 1;
  const pk = fs.readFileSync(options.publicKey ?? "test_key.pem");

  const tx = await scaFactory.createAccount(owner.address, salt, sub);
  await tx.wait();

  const scaAddr: string = await scaFactory.getAddress(owner.address, salt, sub);
  const sca = await hre.ethers.getContractAt("NonZKGoogleAccount", scaAddr);
  console.log("sca deployed to", scaAddr);
  console.log("owner:", await sca.owner());
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
