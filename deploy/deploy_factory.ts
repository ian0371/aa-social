import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const epAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

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
