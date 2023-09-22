import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";

import { SimpleAccountAPI } from "@account-abstraction/sdk";
import { hexConcat } from "ethers/lib/utils";

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

describe("GoogleAccount", function () {
  // created by `npx hardhat genjwt --network localhost --nonce 0`
  const jwt =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwic3ViIjoiMjQ4Mjg5NzYxMDAxIiwiYXVkIjoiczZCaGRSa3F0MyIsIm5vbmNlIjoiMCIsImlhdCI6MTMxMTI4MTk3MCwiZXhwIjoxNzI2NjQwNDMzLCJuYW1lIjoiSmFuZSBEb2UiLCJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIiwiZ2VuZGVyIjoiZmVtYWxlIiwiYmlydGhkYXRlIjoiMDAwMC0xMC0zMSIsImVtYWlsIjoiamFuZWRvZUBleGFtcGxlLmNvbSIsInBpY3R1cmUiOiJodHRwOi8vZXhhbXBsZS5jb20vamFuZWRvZS9tZS5qcGcifQ.xdTOeeiHI2KNk67AtNUYL5tV3EBfEny3U9cQbR1sogxJZRzxuk-_vE-lPWysx0o_mpQPmlada6dxjk_pdiOMS5cfYOPDbDp9Fn-O6NufSxI9h0O83KAVxOQHZIqgn9kmRG7x36h7blchjyXltBktDhUmUbotfkiLZ3FJ2WsTYzZjYM5vS1Cnxe0Z80CdJHyq-RMy1GSrA14Hlg5lCtXC7IoeSYKKJ7k7ybOF-FMsekw4kdJ9pcgVeC7N0qVVTsBSAkLG_scPEsdNPmMtRxVB36oy0maYZrPoJIerFK7JeMigYnQ-cF6klwhcWgA94je0bE3WIegCFses7YrzzZD-Bw";
  const [header, payload, signature] = jwt.split(".");
  const idToken = atob(payload);
  const sig = "0x" + Buffer.from(signature, "base64").toString("hex");
  const sub = JSON.parse(idToken).sub;

  async function deployAccountFixture() {
    const [owner, newOwner] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const ep = await EntryPoint.deploy();

    const ScaFactory = await ethers.getContractFactory("NonZKGoogleAccountFactory");
    const scaFactory = await ScaFactory.deploy(ep.address);

    await scaFactory.createAccount(owner.address, salt, sub);
    const accAddr = await scaFactory.getAddress(owner.address, salt, sub);
    const sca = await ethers.getContractAt("NonZKGoogleAccount", accAddr);

    const CounterFactory = await ethers.getContractFactory("Counter");
    const counter = await CounterFactory.deploy();

    return { ep, sca, scaFactory, owner, newOwner, counter };
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
      await sca.updateOwnerByGoogleOIDC(newOwner.address, header, idToken, sig);
      expect(await sca.owner()).to.equal(newOwner.address);
      expect(await sca.recoveryNonce()).to.equal(1);
    });
    it("userOp", async function () {
      const { ep, sca, scaFactory, owner, newOwner, counter } = await loadFixture(deployAccountFixture);
      const deposit = ethers.utils.parseEther("100");
      await sca.addDeposit({ value: deposit });
      expect(await sca.getDeposit()).to.equal(deposit);

      const walletAPI = new NonZKGoogleAccountAPI({
        provider: hre.ethers.provider,
        entryPointAddress: ep.address,
        owner,
        factoryAddress: scaFactory.address,
        sub,
      });
      const userOp = await walletAPI.createSignedUserOp({
        target: counter.address,
        data: counter.interface.encodeFunctionData("increment"),
      });

      expect(await counter.number()).to.equal(0);
      const bundler = newOwner;
      await ep.handleOps([userOp], bundler.address);
      expect(await counter.number()).to.equal(1);
    });
  });
});
