const { program } = require("commander");
const jwt = require("jsonwebtoken");
const fs = require("fs");

async function main() {
  program
    .command("genjwt")
    .option("--in <idtokenFile>")
    .option("--private-key <privateKeyFile>")
    .option("--nonce <nonce>")
    .action(genJwt);
  // program.command("create-account <idtokenFile> <privateKeyFile> <nonce>").action(genJwt);
  program.parse();
}

function genJwt(options: { in: string; privateKey: string; nonce: string }) {
  const idToken = JSON.parse(fs.readFileSync(options.in ?? "id_token.json"));
  idToken.nonce = options.nonce;
  const pk = fs.readFileSync(options.privateKey ?? "test_key.pem");
  const token = jwt.sign(idToken, pk, { algorithm: "RS256" });
  console.log(token);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
