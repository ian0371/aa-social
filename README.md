# aa-social

ERC-4337 login contracts for OAuth recovery

```
cat .env
MUMBAI_URL="https://polygon-mumbai.g.alchemy.com/v2/[API_KEY]"
PRIVATE_KEY=0x1234
NEW_PRIVATE_KEY=0x5678
```

# Localhost

## Run a localhost network

```
hh node --tags localhost
```

## Setup SCA

```
hh run script/create_account.ts --network localhost
hh run script/deposit.ts --network localhost
```

Output:

```
sca deployed to 0xCEba0E06922b904e29120a55Daf24fB1cEB7D66b
owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## Send UserOp (No bundler)

```
hh run script/send_userop.ts --network localhost
```

Output:

```
counter.number before tx BigNumber { value: "0" }
counter.number after tx BigNumber { value: "1" }
```

## Recovery

```
hh run script/send_userop.ts --network localhost
```

Output:

```
sca owner before tx 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
sca owner after tx 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

# Mumbai

Check two accounts are set

```
hh accounts --network mumbai
```

Output:

```
0xBeBe3506E02c6EA2039B48cEb462Da6F7AfE6a89 0.588129131632171495
0x47a945D6FaAad8512Cd10432FDf98b5A862DaC10 0.5
```

`EntryPoint`, `NonZKGoogleAccountFactory`, and `Counter` are already deployed:

```
EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
NonZKGoogleAccountFactory: 0x9ca5CdB44F932DFb7711f1E8DBB2f35c7c3081e5
Counter: 0xa2688D6555F42b3A5131408Da66dE1409b7db87D
```

## Setup SCA

```
hh run script/create_account.ts --network mumbai
hh run script/deposit.ts --network mumbai
```

## Send UserOp (Using bundler)

```
hh run script/send_userop_bundler.ts --network mumbai
```

NOTE: you may need to adjust `maxFeePerGas`, `maxPriorityFeePerGas` on error.

## recover address

```
hh run script/recover.ts --network mumbai
```
