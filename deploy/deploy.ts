import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const EntryPoint = await deployments.get("EntryPoint");

  await deploy("NonZkGoogleAccount", {
    from: deployer,
    gasLimit: 4000000,
    args: [EntryPoint.address, process.env.SUB],
    log: true,
  });
};

func.tags = ["NonZkGoogleAccount"];
func.dependencies = ["EntryPoint"];
export default func;
