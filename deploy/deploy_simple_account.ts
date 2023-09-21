import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getChainId } = hre;

  const { deploy } = deployments;
  const [deployer] = await hre.ethers.getSigners();

  if ((await getChainId()) != "31337") {
    throw new Error("Not on localhost network");
  }

  await deploy("EntryPoint", {
    from: deployer.address,
    gasLimit: 4000000,
    args: [],
    log: true,
  });

  const ep = await deployments.get("EntryPoint");
  await deploy("NonZKGoogleAccountFactory", {
    from: deployer.address,
    gasLimit: 8000000,
    args: [ep.address],
    log: true,
  });

  await deploy("Counter", {
    from: deployer.address,
    gasLimit: 4000000,
    args: [],
    log: true,
  });
};

func.tags = ["localhost"];
export default func;
