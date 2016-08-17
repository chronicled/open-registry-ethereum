# Service URL Schema

## Introduction

We are storing information about Things on the blockchain, but there are several limitations:

- Amount of data that can be stored
- Types of data that can be stored
- The dynamic nature of the data that we want to store

The microservices <a href="https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/">discovery pattern</a> solves some of these problems.

<img src="https://assets.wp.nginx.com/wp-content/uploads/2016/04/Richardson-microservices-part4-2_client-side-pattern.png" width="300" />

*Image from https://www.nginx.com/blog/service-discovery-in-a-microservices-architecture/*

The record on the blockchain contains a field with a **service discovery URL** that can provide some basic information about the Thing, and we can then further authenticate the user in order to gain access to the **service registry** (which partners provide in order to give additional content to authenticated users).

### Authentication

Normal user authentication in web applications is via some combination of a username and password. However, we can leverage **digital signatures** that provide **proof of proximity** in order to authenticate. In other words, we can prove that we are near the Thing because the physical tag will provide a valid signature to the service registry in exchange for some token (we can use the standard <a href="https://jwt.io/">JSON Web Token (JWT)</a> in this case). This token is useful, because it provides us access to all of the services that the service registry provides for that particular Thing.

## Example

This process takes place in 3 steps: discovery, authentication, and consumption.

John buys a pair of sneakers from Nike. A **tamperproof, encrypted BLE tag** is attached to the sneakers. Using his iPhone, he uses the Chronicled app to scan the BLE tag and ends up on a page that shows information about the shoe (some images of the shoe and a description of the shoe). This is the **discovery** step.

However, Nike can also provide some additional content to John, but only if John proves he is near the shoe. This is the **authentication** step that encompasses the principle of "proof of proximity". John taps the "Verify" button in the app, and exchanges a digital signature from the chip in exchange for a JWT and a list of service URLs from Nike's service registry. As long as John maintains this JWT, he has access to these particular services (JWT also provides the concept of permissions, so Nike can provide the same service URL for multiple products, but the permissions in the JWT may inform which parts of that service he can consume).

In this case, the services Nike gave John were access to a private shoe selection with discounted prices, as well as special video content and other promotions. This is the **consumption** step. John's token may expire at some point, so as long as he is able to maintain proximity to his sneakers, he can have continual access to these services.
