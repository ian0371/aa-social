import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";

import { SimpleAccountAPI } from "@account-abstraction/sdk";

describe("GoogleAccount", function () {
  const jwt =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwic3ViIjoiMjQ4Mjg5NzYxMDAxIiwiYXVkIjoiczZCaGRSa3F0MyIsIm5vbmNlIjoiMHg4ZDlhYmI5YjE0MGJkM2M2M2RiMmNlN2VlMzE3MWFiMWMyMjg0ZmQ5MDVhZDEzMTU2ZGYxMDY5YTE5MThiMmIzIiwiaWF0IjoxMzExMjgxOTcwLCJleHAiOjE3MjY2NDA0MzMsIm5hbWUiOiJKYW5lIERvZSIsImdpdmVuX25hbWUiOiJKYW5lIiwiZmFtaWx5X25hbWUiOiJEb2UiLCJnZW5kZXIiOiJmZW1hbGUiLCJiaXJ0aGRhdGUiOiIwMDAwLTEwLTMxIiwiZW1haWwiOiJqYW5lZG9lQGV4YW1wbGUuY29tIiwicGljdHVyZSI6Imh0dHA6Ly9leGFtcGxlLmNvbS9qYW5lZG9lL21lLmpwZyJ9.Nq_RxeNbdIUPulWNUI8fy-G8RQHOU1RdeF8IpfNtYTbTqQ-VGw6fiPIsZSp25v0Bm1r9JTUFQ7Bv41PIVI7tM8IQRj-6IL_KQr7tR4W3rEWrXt7RpXXii9xADpft-7zX3fk0KlnqVaQtF7VBmpy1X7Pro9cGh-T4pyaQEnJ0CtCin_s_btzLth6ZMZU8n2ZgCEGlShPmVAxza-XrcEUmSC-Ng4ijAQAHUUJ8NIH_XtcC6I12CgY4-35oihSQ2gVLdtQu-WTdWgVSGPHgL13nvDofg7J5VyIl_SMzuRN9iM38kd2kwkK3B-arc5lE9oHDcRFGMtY_1znPBp6QGavazw";
  const [header, payload, signature] = jwt.split(".");
  const idToken = atob(payload);
  const sig = "0x" + Buffer.from(signature, "base64").toString("hex");
  // const idToken =
  // '{"iss":"http://server.example.com","sub":"248289761001","aud":"s6BhdRkqt3","nonce":"0x8d9abb9b140bd3c63db2ce7ee3171ab1c2284fd905ad13156df1069a1918b2b3","iat":1311281970,"exp":1726640433,"name":"Jane Doe","given_name":"Jane","family_name":"Doe","gender":"female","birthdate":"0000-10-31","email":"janedoe@example.com","picture":"http://example.com/janedoe/me.jpg"}';
  // const sig =
  //   "0x36afd1c5e35b74850fba558d508f1fcbe1bc4501ce53545d785f08a5f36d6136d3a90f951b0e9f88f22c652a76e6fd019b5afd25350543b06fe353c8548eed33c210463fba20bfca42beed4785b7ac45ab5eded1a575e28bdc400e97edfbbcd7ddf9342a59ea55a42d17b5419a9cb55fb3eba3d70687e4f8a726901272740ad0a29ffb3f6edccbb61e9931953c9f66600841a54a13e6540c736be5eb704526482f8d8388a301000751427c3481ff5ed702e88d760a0638fb7e688a1490da054b76d42ef964dd5a055218f1e02f5de7bc3a1f83b279572225fd2333b9137d88cdfc91dda4c242b707e6ab739944f681c371114632d63fd739cf069e9019abdacf";

  async function deployAccountFixture() {
    const [owner] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const ep = await EntryPoint.deploy();

    const AccFactory = await ethers.getContractFactory("NonZKGoogleAccountFactory");
    const accFactory = await AccFactory.deploy(ep.address);

    await accFactory.createAccount(owner.address, 1, process.env.SUB);
    const accAddr = await accFactory.getAddress(owner.address, 1, process.env.SUB);
    const acc = await ethers.getContractAt("NonZKGoogleAccount", accAddr);

    return { ep, acc, accFactory, owner };
  }

  describe("NonZkGoogleAccount", function () {
    it("Initial setup", async function () {
      const { acc } = await loadFixture(deployAccountFixture);
      expect(await acc.sub()).to.equal(process.env.SUB);
    });
    it.skip("UserOp", async function () {
      const { ep, acc, accFactory, owner } = await loadFixture(deployAccountFixture);

      // const config = {
      //   chainId: hre.network.config.chainId,
      //   entryPointAddress: ep.address,
      //   bundlerUrl: "http://localhost:3000/rpc",
      // };
      // const aaProvider = await wrapProvider(hre.network.provider, config);
      //

      const walletAPI = new SimpleAccountAPI({
        provider: hre.ethers.provider,
        entryPointAddress: ep.address,
        owner,
        factoryAddress: accFactory.address,
      });
      const op = await walletAPI.createSignedUserOp({
        target: acc.address,
        data: acc.interface.encodeFunctionData("updateOwnerByGoogleOIDC"),
      });
      // const builder = new UserOperationBuilder().useDefaults({});
      // const userOp = await builder.buildOp(ep.address, 31337);
      // console.log(userOp);

      // await ep.handleOps([userOp], beneficiary.address);
      // expect(await acc.sub()).to.equal(process.env.SUB);
    });
    it("verifySub", async function () {
      const { acc } = await loadFixture(deployAccountFixture);
      expect(await acc.verifySub(idToken)).to.equal(0);
      const wrongIdToken = '{"iss":"http://server.example.com","sub":"248289761000"}';
      expect(await acc.verifySub(wrongIdToken)).to.equal(1);
    });
    it("verifySig", async function () {
      const { acc } = await loadFixture(deployAccountFixture);
      expect(await acc.verifySig(header, idToken, sig)).to.equal(0);

      const wrongHeader = header + "1";
      expect(await acc.verifySig(wrongHeader, idToken, sig)).to.equal(1);

      const wrongSig = sig.slice(0, -2) + "00";
      expect(await acc.verifySig(header, idToken, wrongSig)).to.equal(1);
    });
  });
});
