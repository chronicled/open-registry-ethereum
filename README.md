# Open Registry for IoT: Smart Contracts

This open source project represents Ethereum smart contracts which are at the essence of Open Registry for IoT.
You can find contracts in `/contracts` directory.

- `Registrar` — whitelisting contract, stores all Registrants which are allowed to add new Things to the registry.
- `Registry` — registry itself, stores identities and information about all Things added.

Separate repository provides SDK which gives clear interface to the contracts for JavaScript.

### Install Dependencies

```
$ npm install -g truffle
$ npm install -g ethereumjs-testrpc
```

### Test contracts

```
$ testrpc
$ truffle test
```


# URN Specification
> Draft

In the Open Registry, all Things have identities. We have adopted a Uniform Resource Name (URN) standard format to represent these identities, ranging from cryptographic public keys to BLE & NFC device IDs. The URN format is easily readable and allows for the support of a wide variety of identities. It complies with current standards for representing products, books, electronics, etc., and can be used to identify literally anything without need to specify schema / protocol this identity can reached by. This extensibility is essential for building a universal and open platform for the Internet of Things.

## Format
Each identity will be split by `:` into multiple sections, denoting more specific information about the identity after each subsequent colon. The last section denotes the actual identity of the Thing.
```
<Category>[:<Subcategory>[:<sub-Subcategory> … ]]:<ID>
```
All categories are case-insensitive.

## Examples

BLE

```
ble:1.0:0A153C993D9C
```

NFC

```
nfc:1.0:04062782DF4980
```

Serial number

```
sn:C02EK02HG8DL
```

Elliptic Curve Public Key

```
pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6
```

RSA public key

```
pbk:rsa:2048:cb47e6aada931986bb6bbf02c8618437c072cefa4e19c1ee6cb189b95a49e3ce94fb4de129c30ab7e683f827c98eb05e844af24f809ed5f217e93c14d58f64b98fc9136d3c2b56a672853a8f52c7ac7acd201b09d0f578f32f377f954905e18fa360448901d0ac538cd1102dc0821cd13a843e370471c00e95daf4bba001186c5b2220e15f2f4777aa9b0a823186c34d82fd557e245b4d5816f48bdc09dd34806982609b63012dd13fe603f23730940e68463b1b68f24ee77907925d286d55ec22bad53119f8354388e051854ef436589538f1efbf104af477dc3ca2cf29974fcf432639b8716c38c717d44c8f0c90d59f02f2ab0aef8b59c2feb460e2cbfb57010001
```


## Construction of Public Key

Public Key
```
pbk
```

Elliptic Curve Public Key
```
pbk:ec
```

RSA Public Key
```
pbk:rsa
```

Elliptic curve using verified random parameters
```
pbk:ec:secp256r1
```

Full ECC URN
```
pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6
```

## Elliptic Curve Public Key
Asymmetric encryption public key is stored in open registry to securely verify authenticity identity of a Thing using by means of cryptographic signature.

## From Raw ECC Public Key to Identity in the Open Registry
Here we will illustrate an example how to convert an uncompressed public key into URN identity to be stored in the Open Registry. Its assumed that you have already generated your ECC key pair.

The public key is represented as a point `(x,y)` on an elliptic curve. Convert point coordinates into their hexadecimal representations. For this example we will use the following point:
`x=0x7462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975`
`y=0xd53acb27ef5da1cba6ff90e3611637e55a14ce6a9ec25063cd0de943f1dd3b04`

### Representation
We're using format suggested in https://www.ietf.org/rfc/rfc5480.txt
Uncompressed public keys: mark the first octet with `0x04`
Compressed public keys: mark the first octet with the correct polarity byte `0x02, 0x03` depending on the polarity of the `y` coordinate (explained below).

The public key in an uncompressed representation is then:
`047462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975d53acb27ef5da1cba6ff90e3611637e55a14ce6a9ec25063cd0de943f1dd3b04`

### Converting into URN Format
Before the uncompressed public key can be registered to the Open Registry, it must be converted into the correct URN format as described above. Since we are using ECC's `secp256r1` standard, the URN prefix is `pbk:ec:secp256r1`.

### Open Registry SDK
From here, the URN is fed into the Open Registry SDK. Here, it is parsed, compressed, and packaged to be deployed into the Open Registry. It matches the schema of the URN to identify what cryptographic standards are being used and adjusts the keys accordingly.

### Parsing
For ECC keys, the SDK checks the first byte. If the first byte is `0x04` then it compresses the key to minimize amount of data stored. If the first byte is `0x02` or `0x03` then it's already compressed.

### Compressing
Compression is done by eliminating Y coordinate from the public key, since elliptic curve is symmetric to X axis. Though information on which side of X the point is located is crucial.
That's why polarity is appended to the `x` coordinate of compressed key. And since ECC uses modulo, one just need to know whether it's even or odd. To demonstrate consider values `-1`, `1` and modulo `5`. Since `-1 % 5 = 4` and `1 % 5 = 1` it's clearly distinguishable where value falls.

```
even --> 0x02
odd  --> 0x03
```

We've built our own library to compress and decompress public keys for secp256r1. It can be found at:
https://github.com/chronicled/open-registry-utils

Specifically, the method is `ec.compress(<Public key>);`
For our example, compressing will result in: `027462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975`.
Now public key is compressed and ready to be deployed as an identity of a Thing in the Open Registry.


## RSA Public Key
URN format of an RSA public key is as follows:
```
pbk:rsa:<key size in bits>:<public key of defined size><exponent used>
```

A sample RSA public key in URN format with `2048` bits key and exponent `0x010001` is:
```
pbk:rsa:2048:cb47e6aada931986bb6bbf02c8618437c072cefa4e19c1ee6cb189b95a49e3ce94fb4de129c30ab7e683f827c98eb05e844af24f809ed5f217e93c14d58f64b98fc9136d3c2b56a672853a8f52c7ac7acd201b09d0f578f32f377f954905e18fa360448901d0ac538cd1102dc0821cd13a843e370471c00e95daf4bba001186c5b2220e15f2f4777aa9b0a823186c34d82fd557e245b4d5816f48bdc09dd34806982609b63012dd13fe603f23730940e68463b1b68f24ee77907925d286d55ec22bad53119f8354388e051854ef436589538f1efbf104af477dc3ca2cf29974fcf432639b8716c38c717d44c8f0c90d59f02f2ab0aef8b59c2feb460e2cbfb57010001
```


## Useful Resources
Standards naming: https://www.ietf.org/rfc/rfc4492.txt

## Copyright
Copyright (c) 2016 Chronicled, Inc. All rights reserved.
