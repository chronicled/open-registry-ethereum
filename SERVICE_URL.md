# Service URLs

## Introduction

Together with the identity of Things, we provide the option to store additional information on the blockchain to describe the registered Things. Alongside the information registered on the blockchain, we also created an open, blockchain-powered architecture to serve information from private servers. This architecture addresses the following use cases:

- Serve larger data streams for which a blockchain is not designed for (e.g., images, videos).
- Deliver dynamic content
- Permission-based access to content

Such use cases can be addressed by implementing a microservices <a href='https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/'>discovery pattern</a> on top of the blockchain-based Registry for IoT.

<img src='https://assets.wp.nginx.com/wp-content/uploads/2016/04/Richardson-microservices-part4-2_client-side-pattern.png' width='300' />

*Image from https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/*

In other words, we use the blockchain record as a means to discover additional content, and we provide a means of authentication for discovering that content.

The record on the blockchain contains a field with a **service discovery URL** that can provide some basic information about the Thing, and we can then further authenticate the user in order to gain access to the **service registry** (which partners provide in order to give additional content to authenticated users).

### Authentication

Normal user authentication in web applications is via some combination of a username and password. However, we can leverage **digital signatures** that provide **proof of proximity** in order to authenticate. In other words, we can prove that we are near the Thing because the physical tag will provide a valid signature to the service registry in exchange for some token (we can use the standard <a href='https://jwt.io/'>JSON Web Token (JWT)</a> in this case). This token is useful, because it provides us access to all of the services that the service registry provides for that particular Thing.

### Interoperability

An important goal for the project is to achieve interoperability. As part of defining the specification for the service discovery URL, the project team will also be working on publishing specifications for the services that can be made available by private servers and consumed by the users of the open registry.

## Example

This process takes place in 3 steps: discovery, authentication, and consumption.

John buys a pair of sneakers from Nike. A **tamperproof, encrypted BLE tag** is attached to the sneakers. Using his iPhone, he uses the Chronicled app to scan the BLE tag and ends up on a page that shows information about the shoe (some images of the shoe and a description of the shoe). This is the **discovery** step.

However, Nike can also provide some additional content to John, but only if John proves he is near the shoe. This is the **authentication** step that encompasses the principle of 'proof of proximity'. John taps the 'Verify' button in the app, and exchanges a digital signature from the chip in exchange for a JWT and a list of service URLs from Nike's service registry. As long as John maintains this JWT, he has access to these particular services (JWT also provides the concept of permissions, so Nike can provide the same service URL for multiple products, but the permissions in the JWT may inform which parts of that service he can consume).

In this case, the services Nike gave John were access to a private shoe selection with discounted prices, as well as special video content and other promotions. This is the **consumption** step. John's token may expire at some point, so as long as he is able to maintain proximity to his sneakers, he can have continual access to these services.

### Code example

John scans the BLE tag on his Nike Air Max 95 "Washington Redskins" sneakers and gets a blockchain record, which leads him to the service discovery page.

**Blockchain record**

```javascript
{
  identities: ['pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6'],
  service_discovery_url: 'https://www.chronicled.org/service_discovery?identity=pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6'
}
```
**Service discovery page**

*https://www.chronicled.org/service_discovery?identity=pbk%3Aec%3Asecp256r1%3A0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6*

Response:

```javascript
{
  identities: ['pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6'],
  product: {
	  name: 'Air Max 95 Washington Redskins',
	  style_id: '542052-632',
	  color: 'Team Red/White-University (Washington)',
	  release_date: new Date('2012-04-29T00:00:00-0700'),
	  brand: 'Nike',
	  age: 'adult',
	  gender: 'male',
	  image_urls: [
	    'xOqXr3ydDDBr'
	  ],
  },
  authentication_url: 'https://www.nike.com/service_registry/authenticate'
}
```

**Verification**

John then retrieves a digital signature from the BLE chip and authenticates against the `authentication_url` in exchange for a JWT and some services from Nike.

Request:

```javascript
// https://www.nike.com/service_registry/authenticate

// body
{
  signature: '3046022100ba985cf7cc3fb9ea3d3ea8a499f2c460affb1068c9e4ad55971dd04b7d0e6ecd0221009ba952d8f499e3a638f159392c56f2fb8704ab64a9aa503629540e6049ec4466',
  urn: 'pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6',
  challenge: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
}
```

Response:

```javascript
{
  id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicHJvZHVjdF9pZCI6ImFiWDY3IiwiYWRtaW4iOmZhbHNlLCJleHBpcmVzIjoxNDcxNDc5MjY2MDY5fQ.bzPZUuY0QP5yVp-aXWte_DhfyU4WhqlFcx9lBW75yWbG-lmN0Nfp3bjoH34w-BIj63PKoggdrrnTTSm5Oc-lWUUTX0bYWLnZuOnIOcc_xhXcZIFJjEaPbO5PbjRfGWPrnMMy4Fr0nCNCAHP282qNaHFADaTuFSBH4Kyej2vrGs0',
  service_urls: [
  	'https://www.nike.com/service_registry/promotion?product_id=abX67',
  	'https://www.nike.com/service_registry/video?product_id=abX67'
  ]
}
```

If we decode the `id_token` (https://www.jwt.io), we see this information in the payload:

```javascript
{
  "sub": "1234567890",
  "name": "John Doe",
  "product_id": "abX67",
  "admin": false,
  "expires": 1471479266069
}
```
In other words, John's access to the content for his specific product ID expires some time on August 17th. He can authenticate again for a new token and get continued access to the content, as long as he stays close to his sneakers. Additionally, the `service_urls` Nike provides can change at any time as well during the next authentication (in other words, some services can expire or change at Nike's discretion, which is a benefit of using the service discovery pattern).

# Conclusion

Based on the principle of interoperability (using publicly available specifications), content providers and partners can implement any of the discovery, authentication, and consumption stages as outlined above. Services can be easily interchanged, and data from multiple services can be aggregated together. This provides a high degree of dynamic content that plays well alongside the unforgeable identities of Things.
