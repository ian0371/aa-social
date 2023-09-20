import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";

import { SimpleAccountApiParams, SimpleAccountAPI } from "@account-abstraction/sdk";
import { hexConcat } from "ethers/lib/utils";

export interface NonZKGoogleAccountApiParams extends SimpleAccountApiParams {
  sub: string;
  recoveryNonce: string;
}
export class NonZKGoogleAccountAPI extends SimpleAccountAPI {
  sub: string;
  recoveryNonce: string;

  constructor(params: NonZKGoogleAccountApiParams) {
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

describe("GoogleAccount", function () {
  const jwt =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwic3ViIjoiMjQ4Mjg5NzYxMDAxIiwiYXVkIjoiczZCaGRSa3F0MyIsIm5vbmNlIjoiMHg4ZDlhYmI5YjE0MGJkM2M2M2RiMmNlN2VlMzE3MWFiMWMyMjg0ZmQ5MDVhZDEzMTU2ZGYxMDY5YTE5MThiMmIzIiwiaWF0IjoxMzExMjgxOTcwLCJleHAiOjE3MjY2NDA0MzMsIm5hbWUiOiJKYW5lIERvZSIsImdpdmVuX25hbWUiOiJKYW5lIiwiZmFtaWx5X25hbWUiOiJEb2UiLCJnZW5kZXIiOiJmZW1hbGUiLCJiaXJ0aGRhdGUiOiIwMDAwLTEwLTMxIiwiZW1haWwiOiJqYW5lZG9lQGV4YW1wbGUuY29tIiwicGljdHVyZSI6Imh0dHA6Ly9leGFtcGxlLmNvbS9qYW5lZG9lL21lLmpwZyJ9.Nq_RxeNbdIUPulWNUI8fy-G8RQHOU1RdeF8IpfNtYTbTqQ-VGw6fiPIsZSp25v0Bm1r9JTUFQ7Bv41PIVI7tM8IQRj-6IL_KQr7tR4W3rEWrXt7RpXXii9xADpft-7zX3fk0KlnqVaQtF7VBmpy1X7Pro9cGh-T4pyaQEnJ0CtCin_s_btzLth6ZMZU8n2ZgCEGlShPmVAxza-XrcEUmSC-Ng4ijAQAHUUJ8NIH_XtcC6I12CgY4-35oihSQ2gVLdtQu-WTdWgVSGPHgL13nvDofg7J5VyIl_SMzuRN9iM38kd2kwkK3B-arc5lE9oHDcRFGMtY_1znPBp6QGavazw";
  const [header, payload, signature] = jwt.split(".");
  const idToken = atob(payload); // {"iss":"http://server.example.com","sub":"248289761001","aud":"s6BhdRkqt3","nonce":"0x8d9abb9b140bd3c63db2ce7ee3171ab1c2284fd905ad13156df1069a1918b2b3","iat":1311281970,"exp":1726640433,"name":"Jane Doe","given_name":"Jane","family_name":"Doe","gender":"female","birthdate":"0000-10-31","email":"janedoe@example.com","picture":"http://example.com/janedoe/me.jpg"}
  const sig = "0x" + Buffer.from(signature, "base64").toString("hex"); // 0x36afd1c5e35b74850fba558d508f1fcbe1bc4501ce53545d785f08a5f36d6136d3a90f951b0e9f88f22c652a76e6fd019b5afd25350543b06fe353c8548eed33c210463fba20bfca42beed4785b7ac45ab5eded1a575e28bdc400e97edfbbcd7ddf9342a59ea55a42d17b5419a9cb55fb3eba3d70687e4f8a726901272740ad0a29ffb3f6edccbb61e9931953c9f66600841a54a13e6540c736be5eb704526482f8d8388a301000751427c3481ff5ed702e88d760a0638fb7e688a1490da054b76d42ef964dd5a055218f1e02f5de7bc3a1f83b279572225fd2333b9137d88cdfc91dda4c242b707e6ab739944f681c371114632d63fd739cf069e9019abdacf
  const sub = JSON.parse(idToken).sub;
  const recoveryNonce = JSON.parse(idToken).nonce;
  const newRecoveryNonce = "0xf26250c0d89849666ff4ec5a46887c36965d22cc0140292ce9be653172190310";

  async function deployAccountFixture() {
    const [owner, newOwner] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const ep = await EntryPoint.deploy();

    const ScaFactory = await ethers.getContractFactory("NonZKGoogleAccountFactory");
    const scaFactory = await ScaFactory.deploy(ep.address);

    await scaFactory.createAccount(owner.address, 1, sub, recoveryNonce);
    const accAddr = await scaFactory.getAddress(owner.address, 1, sub, recoveryNonce);
    const sca = await ethers.getContractAt("NonZKGoogleAccount", accAddr);

    return { ep, sca, scaFactory, owner, newOwner };
  }

  describe("NonZkGoogleAccount", function () {
    it("Initial setup", async function () {
      const { sca } = await loadFixture(deployAccountFixture);
      expect(await sca.sub()).to.equal(sub);
    });
    it("verifySub", async function () {
      const { sca } = await loadFixture(deployAccountFixture);
      expect(await sca.verifySub(idToken)).to.equal(true);
      const wrongIdToken = '{"iss":"http://server.example.com","sub":"248289761000"}';
      expect(await sca.verifySub(wrongIdToken)).to.equal(false);
    });
    it("verifySig", async function () {
      const { sca } = await loadFixture(deployAccountFixture);
      expect(await sca.verifySig(header, idToken, sig)).to.equal(true);

      const wrongHeader = header + "1";
      expect(await sca.verifySig(wrongHeader, idToken, sig)).to.equal(false);

      const wrongSig = sig.slice(0, -2) + "00";
      expect(await sca.verifySig(header, idToken, wrongSig)).to.equal(false);
    });
    it("verifyNonce", async function () {
      const { sca } = await loadFixture(deployAccountFixture);
      expect(await sca.verifyNonce(idToken)).to.equal(true);
    });
    it("updateOwnerByGoogleOIDC", async function () {
      const { sca, newOwner } = await loadFixture(deployAccountFixture);
      await sca.updateOwnerByGoogleOIDC(newOwner.address, header, idToken, sig, newRecoveryNonce);
      expect(await sca.owner()).to.equal(newOwner.address);
      expect(await sca.recoveryNonce()).to.equal(newRecoveryNonce);
    });
    it.only("API", async function () {
      const { ep, sca, scaFactory, owner, newOwner } = await loadFixture(deployAccountFixture);

      const walletAPI = new NonZKGoogleAccountAPI({
        provider: hre.ethers.provider,
        entryPointAddress: ep.address,
        owner,
        factoryAddress: scaFactory.address,
        sub,
        recoveryNonce,
      });
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

      // const op = await walletAPI.encodeExecute(
      //   sca.address,
      //   0,
      //   sca.interface.encodeFunctionData("updateOwnerByGoogleOIDC", [
      //     newOwner.address,
      //     header,
      //     idToken,
      //     sig,
      //     newRecoveryNonce,
      //   ]),
      // );
      // console.log(op);
      // const builder = new UserOperationBuilder().useDefaults({});
      // const userOp = await builder.buildOp(ep.address, 31337);
      // console.log(userOp);

      await ep.handleOps([userOp], newOwner.address);
    });
  });
});
