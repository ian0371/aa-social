import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";

import { SimpleAccountAPI } from "@account-abstraction/sdk";

describe("GoogleAccount", function () {
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
      console.log(acc.interface);

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
      console.log(op);
      // const builder = new UserOperationBuilder().useDefaults({});
      // const userOp = await builder.buildOp(ep.address, 31337);
      // console.log(userOp);

      // await ep.handleOps([userOp], beneficiary.address);
      // expect(await acc.sub()).to.equal(process.env.SUB);
    });
    it("updateOwnerByGoogleOIDC", async function () {
      const { acc } = await loadFixture(deployAccountFixture);
      const idToken = '{"iss":"http://server.example.com","sub":"248289761001"}';
      expect(await acc.updateOwnerByGoogleOIDC(idToken)).to.equal(0);
      const wrongIdToken = '{"iss":"http://server.example.com","sub":"248289761000"}';
      expect(await acc.updateOwnerByGoogleOIDC(wrongIdToken)).to.equal(1);
    });
  });
});
