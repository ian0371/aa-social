pragma solidity ^0.8.0;

import "./lib/JsmnSolLib.sol";

contract JWT {
    using JsmnSolLib for string;

    function _getSub(string memory json) internal pure returns (string memory) {
        (uint exitCode, JsmnSolLib.Token[] memory tokens, uint ntokens) = json.parse(30);
        require(exitCode == 0, "JSON parse failed");

        require(tokens[0].jsmnType == JsmnSolLib.JsmnType.OBJECT, "Expected JWT to be an object");
        uint i = 1;
        while (i < ntokens) {
            require(tokens[i].jsmnType == JsmnSolLib.JsmnType.STRING, "Expected JWT to contain only string keys");
            string memory key = json.getBytes(tokens[i].start, tokens[i].end);
            if (key.strCompare("sub") == 0) {
                require(tokens[i + 1].jsmnType == JsmnSolLib.JsmnType.STRING, "Expected sub to be a string");
                return json.getBytes(tokens[i + 1].start, tokens[i + 1].end);
            }
            i += 2;
        }

        revert("Could not find sub in JWT object");
    }

    function _getNonce(string memory json) internal pure returns (string memory) {
        (uint exitCode, JsmnSolLib.Token[] memory tokens, uint ntokens) = json.parse(30);
        require(exitCode == 0, "JSON parse failed");

        require(tokens[0].jsmnType == JsmnSolLib.JsmnType.OBJECT, "Expected JWT to be an object");
        uint i = 1;
        while (i < ntokens) {
            require(tokens[i].jsmnType == JsmnSolLib.JsmnType.STRING, "Expected JWT to contain only string keys");
            string memory key = json.getBytes(tokens[i].start, tokens[i].end);
            if (key.strCompare("nonce") == 0) {
                require(tokens[i + 1].jsmnType == JsmnSolLib.JsmnType.STRING, "Expected nonce to be a string");
                return json.getBytes(tokens[i + 1].start, tokens[i + 1].end);
            }
            i += 2;
        }

        revert("Could not find nonce in JWT object");
    }
}
