# Open Registry Ethereum
Smart contracts for the Open Registry


## Contrats

contracts are located in the root directory.

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

## JS libs

libraries are located in the backendSDK directory.

### Install libs

```
$ npm install
```

### Test libs

```
$ npm test
```

# URN Specification
> Draft

In the Open Registry, all Things have identities. We have adopted a Uniform Resource Name (URN) format for encoding and storing these identities, ranging from cryptographic public keys to BLE & NFC device IDs. The URN format is easily readable and allows for the support of a wide variety of identities. It complies with current standards for representing products, books, electronics, and standardized algorithms and protocols. This extensibility is essential for building a universal and open platform for the Internet of Things.

## Format
Each identity will be split by `:` into multiple sections, denoting more specific information about the identity after each subsequent colon. The last section denotes the actual identity of the Thing.
```
<Category>[:<Subcategory>[:<sub-Subcategory> … ]]:<ID>
```
All categories are case-insensitive, whereas the `ID` is case-sensitive to allow for BASE64 encoding support.

## Construction

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
We will be using compressed elliptic curve cryptographic public keys. A compressed ECC public key uses only the `x` coordinate and the polarity or sign (+/-) of the `y` coordinate to recover the uncompressed public key. Additionally, if we are only interested in reading the public key from a device and verifying a cryptographic signature, we can store only the `x` coordinate in the Open Registry, asserting that this public key coordinate matches the one received from interacting with the device. If the Open Registry contains the same `x` coordinate as is returned by the device, then we need not worry about the polarity of the ECC public key coordinate - the Thing is authentic.

We have decided to store the polarity as well in order to verify the signature without reading the public key directly from the device. This complies with how compressed ECC public keys are viewed today and will allow better compatability in the future.

### Polarity
Polarity in public key modulus is represented as even or odd. The polarity is appended to the beginning of the `x` coordinate that will be stored in the Open Registry.

```
even --> 0x02
odd  --> 0x03
```

As is used in Bitcoin's public key compression. The byte is used here since padding will always be applied to the identity. In BASE64, it will be the same length as if it was only a bit.

## RSA Public Key
The format of an RSA public key in URN format is as follows:
```
pbk:rsa:<key size in bits>:<public key of defined size><exponent used>
```

A sample RSA public key in URN format with `2048` bit key and `0x010001` will be the following:
```
pbk:rsa:2048:cb47e6aada931986bb6bbf02c8618437c072cefa4e19c1ee6cb189b95a49e3ce94fb4de129c30ab7e683f827c98eb05e844af24f809ed5f217e93c14d58f64b98fc9136d3c2b56a672853a8f52c7ac7acd201b09d0f578f32f377f954905e18fa360448901d0ac538cd1102dc0821cd13a843e370471c00e95daf4bba001186c5b2220e15f2f4777aa9b0a823186c34d82fd557e245b4d5816f48bdc09dd34806982609b63012dd13fe603f23730940e68463b1b68f24ee77907925d286d55ec22bad53119f8354388e051854ef436589538f1efbf104af477dc3ca2cf29974fcf432639b8716c38c717d44c8f0c90d59f02f2ab0aef8b59c2feb460e2cbfb57010001
```


## Examples
Elliptic Curve Public Key

```
pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6
```

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

RSA public key

```
pbk:rsa:2048:cb47e6aada931986bb6bbf02c8618437c072cefa4e19c1ee6cb189b95a49e3ce94fb4de129c30ab7e683f827c98eb05e844af24f809ed5f217e93c14d58f64b98fc9136d3c2b56a672853a8f52c7ac7acd201b09d0f578f32f377f954905e18fa360448901d0ac538cd1102dc0821cd13a843e370471c00e95daf4bba001186c5b2220e15f2f4777aa9b0a823186c34d82fd557e245b4d5816f48bdc09dd34806982609b63012dd13fe603f23730940e68463b1b68f24ee77907925d286d55ec22bad53119f8354388e051854ef436589538f1efbf104af477dc3ca2cf29974fcf432639b8716c38c717d44c8f0c90d59f02f2ab0aef8b59c2feb460e2cbfb57010001
```

IDs itself which are in hex/binary form should be converted into base64 to save space.

# From Raw Public Key to Identity in the Open Registry
Here we will illustrate an example how to convert an uncompressed public key into an identity to be stored in the Open Registry. Assume that you have already generated your ECC public and private key pair.

The public key pair is represented as a point `(x,y)` on an elliptic curve. Convert these points into their hexadecimal representations. For this example we will use the following points:
`x=0x7462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975`
`y=0xd53acb27ef5da1cba6ff90e3611637e55a14ce6a9ec25063cd0de943f1dd3b04`

## Representation
There are many ways to represent a key in a uniform octet string.
Uncompressed public keys: mark the first octet with `0x04`
Compressed public keys: mark the first octet with the correct polarity byte `0x02, 0x03` depending on the polarity of the `y` coordiante

For more details: https://www.ietf.org/rfc/rfc5480.txt

The public key in an uncompressed representation is then:
`047462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975d53acb27ef5da1cba6ff90e3611637e55a14ce6a9ec25063cd0de943f1dd3b04`

## Converting for Open Registry
Before the uncompressed public key can be registered to the Open Registry, it must be converted into the correct URN format as described above. Since we are using ECC cryptographic keys from the `secp256r1` curve, the urn prefix is `pbk:ec:secp256r1`.

## Open Registry SDK
From here, the URN is fed into the Open Registry SDK. Here, it is parsed, compressed, and packaged to be deployed into the Open Registry. It matches the schema of the URN to identify what cryptographic protocols are being used and adjusts the keys accordingly.

### Parsing
For ECC keys, the SDK checks the first byte. If the first byte is `04` then we must compress the key to optimize amount of data we're storing. If the first byte is `02` or `03` then we can proceed since the key is in compressed form.

### Compressing
The library we use to compress and decompress public keys can be found:
https://github.com/chronicled/open-registry-utils

Specifically, the method is `ec.compress(<Public key>);`
From the example, we now have: `027462163f89fc02b989e564cf7a2ce39a806273ee4042201fb5544cc794c48975`.
Now our public key is compressed and ready to be deployed as an identity of a Thing in the Open Registry.

## Resources used
https://www.ietf.org/rfc/rfc4492.txt
