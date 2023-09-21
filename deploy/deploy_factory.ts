import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  let epAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const chainId = await getChainId();

  if (chainId == "31337") {
    //   await deploy("EntryPoint", {
    //     from: deployer,
    //     gasLimit: 8000000,
    //     args: [epAddress],
    //     log: true,
    //   });
    //   const ep = await deployments.get("EntryPoint");
    epAddress = "0x94b9B7ED6297074E8345BBfE2aC64402cbaBE9B3";
  }

  console.log("Using epAddress", epAddress);
  await deploy("NonZKGoogleAccountFactory", {
    from: deployer,
    gasLimit: 8000000,
    args: [epAddress],
    log: true,
  });
};

func.tags = ["NonZKGoogleAccountFactory"];
// func.dependencies = ["EntryPoint"];
export default func;
