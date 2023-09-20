// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */
import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "./JWT.sol";
import "hardhat/console.sol";

/**
 * minimal account.
 *  this is sample minimal account.
 *  has execute, eth handling methods
 *  has a single signer that can send requests through the entryPoint.
 */
contract NonZKGoogleAccount is JWT, SimpleAccount {
    string public sub;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    function initialize(address anOwner, string memory _sub) public virtual initializer {
        _initialize(anOwner);
        sub = _sub;
    }

    function updateOwnerByGoogleOIDC(string memory id_token) external view returns (uint256 validationData) {
        // TODO: parse userOp.signature
        // string memory header = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";
        // string
        //     memory payload = '{"iss":"http://server.example.com","sub":"248289761001","aud":"s6BhdRkqt3","nonce":"0x8d9abb9b140bd3c63db2ce7ee3171ab1c2284fd905ad13156df1069a1918b2b3","iat":1311281970,"exp":1726640433,"name":"JaneDoe","given_name":"Jane","family_name":"Doe","gender":"female","birthdate":"0000-10-31","email":"janedoe@example.com","picture":"http://example.com/janedoe/me.jpg"}';
        // string memory payload = '{"iss":"http://server.example.com","sub":"248289761001"}';
        // bytes
        //     memory signature = hex"36afd1c5e35b74850fba558d508f1fcbe1bc4501ce53545d785f08a5f36d6136d3a90f951b0e9f88f22c652a76e6fd019b5afd25350543b06fe353c8548eed33c210463fba20bfca42beed4785b7ac45ab5eded1a575e28bdc400e97edfbbcd7ddf9342a59ea55a42d17b5419a9cb55fb3eba3d70687e4f8a726901272740ad0a29ffb3f6edccbb61e9931953c9f66600841a54a13e6540c736be5eb704526482f8d8388a301000751427c3481ff5ed702e88d760a0638fb7e688a1490da054b76d42ef964dd5a055218f1e02f5de7bc3a1f83b279572225fd2333b9137d88cdfc91dda4c242b707e6ab739944f681c371114632d63fd739cf069e9019abdacf";
        if (keccak256(abi.encodePacked(sub)) != keccak256(abi.encodePacked(getSub(id_token))))
            return SIG_VALIDATION_FAILED;

        return 0;
    }
}
