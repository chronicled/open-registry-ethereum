# Service URL Schema

## Introduction
Service URL is the property of published Thing in Open Registry. Since amount of data one can put in public blockchain is limited, this concept was introduced which allows to discover much bigger amount of information about Thing (product), like detailed description, images, videos, assembling instructions, manuals, materials used and more. 

Also Service URL allows to apply Proof of Proximity concept, which allows to provide unique / locked content to consumers which are in possession of the Thing.

## Data Format
Service URL response should be in JSON format.

## Data Schema
```
{
	version: <schema version>,
	sku: <string:SKU number>,
	name: <string>,
	description: <string>,
	sizes: [<string>],
	colors: [<string>],
	thumbnail_url: <>,
	product_page_url: <>,
	weight: <string>,
	dimensions: <string>,
	product_id: <string: registrant's internal ID>,
	rating: <number:0-5>,
	promotions: [description: <>, image_url: <>, action_url: <>],
	images: [{title: <>, url: <>}],
	videos: [{title: <>, url: <>, length: <>}],
	ecommerce_points: [{title: <>, thumbnail_url: <>, sell_point_url: <>}], // Where to buy
	related_products: [{title: <>, description: <>, thumbnail_url: <>, product_page_url: <>}],
	proximity_proof: {challenge_url: <>, metadata_url: <>},
	instructions: [{title: <>, url: <>}]
}
```

## Challenge URL Spec
`POST` request should contain:
* `identityURN` - identity of a Thing as stored in Open Registry in URN format.
Example response:
```
{challenge: "94a39945bc5078f863aab616dc61923b9c1f32f0f69abd6244ef591f87a22e4b"}
```

## Metadata URL
`POST` request:
* `identityURN`
* `challenge` — challenge obtained from previous request.
* `signature` — challenge signed by chip

Example response:
```
{
	"result": "IN_PROXIMITY",
	"payload": <same Service URL data schema, with all protected data available excluding proximity_proof field>
}
```

## Copyright
Copyright (c) 2016 Chronicled, Inc. All rights reserved.
