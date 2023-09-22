const { program } = require("commander");
const jwt = require("jsonwebtoken");
const fs = require("fs");

async function main() {
  program.option("--in <filename>").option("--private-key <filename>").option("--nonce <string>"); //.argument("--private-key").argument("--nonce");
  program.parse();
  const options = program.opts();
  const idToken = JSON.parse(fs.readFileSync(options.in));
  idToken.nonce = options.nonce;
  const pk = fs.readFileSync(options.privateKey);
  const token = jwt.sign(idToken, pk, { algorithm: "RS256" });
  console.log(token);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
