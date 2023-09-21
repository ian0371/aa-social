import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if ((await getChainId()) != "80001") {
    throw new Error("Not on mumbai network");
  }

  await deploy("NonZKGoogleAccountFactory", {
    from: deployer,
    gasLimit: 8000000,
    args: ["0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"],
    log: true,
  });

  await deploy("Counter", {
    from: deployer,
    gasLimit: 4000000,
    args: [],
    log: true,
  });
};

func.tags = ["mumbai"];
export default func;
