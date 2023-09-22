// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */
import "@openzeppelin/contracts/utils/Strings.sol";
import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "./JWT.sol";
import "hardhat/console.sol";
import "./lib/LibRsa.sol";
import "./lib/LibBase64.sol";

/**
 * minimal account.
 *  this is sample minimal account.
 *  has execute, eth handling methods
 *  has a single signer that can send requests through the entryPoint.
 */
contract NonZKGoogleAccount is SimpleAccount, JWT {
    string public sub;
    uint256 public recoveryNonce;

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    function initialize(address anOwner, string memory _sub) public virtual initializer {
        _initialize(anOwner);
        sub = _sub;
    }

    function _updateRecoveryNonce() internal {
        recoveryNonce++;
    }

    function updateOwnerByGoogleOIDC(
        address newOwner,
        string calldata header,
        string calldata idToken,
        bytes calldata sig
    ) external {
        require(verifySig(header, idToken, sig), "verifySig failed");
        require(verifySub(idToken), "verifySub failed");
        require(verifyNonce(idToken), "verifyNonce failed");

        owner = newOwner;
        _updateRecoveryNonce();
    }

    function verifySig(string calldata header, string calldata idToken, bytes calldata sig) public view returns (bool) {
        string memory payload = LibBase64.urlEncode(bytes(idToken));
        if (
            LibRsa.rsapkcs1Verify(
                sha256(abi.encodePacked(header, ".", payload)),
                hex"c61e4b8d980041ab0c39de06ed6b03187e9e3c6eb6649ec58176d3ed4e5a004a1422a0ee0098f6a0d5d1a364eb18a3e866dd59d8eda78008eba5966868be01baba31c2756a30bb7c2c98fab5bd55d8eb17d6f22fbc3057649f9796c49283d25fd94175ea3b4c1d1e055a29feb5c3ec9984a8b9b280cf1d6171faaef7e53b9891d3b76f58fcb1e03a4a7278d76d0c1d76e3b081f4dc233bba4d90b351949faafb38e9cce83190cdf0160dfbbd8d633bd505561fee13dcb7547f7b6c40797c79cfa13d809e45e2e6a82e07abcae2df7bad1e14af0fa633144f68bc4183ee428a5e9ca89d9e35381c6087cce73a6ab5db5728cc2801754c29fc9d89d2f3fdb84e6b",
                hex"010001",
                sig
            )
        ) {
            return true;
        }
        return false;
    }

    function verifySub(string calldata idToken) public view returns (bool) {
        if (keccak256(abi.encodePacked(sub)) == keccak256(abi.encodePacked(_getSub(idToken)))) return true;

        return false;
    }

    function verifyNonce(string calldata idToken) public view returns (bool) {
        string memory a = Strings.toString(recoveryNonce);
        string memory b = _getNonce(idToken);
        if (Strings.equal(a, b)) return true;

        return false;
    }
}
