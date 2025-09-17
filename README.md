# VRChat Jellyfin Search API

start api
node index.js 'Ipwan' 'jellyfin_userid' 'jellyfin_apikey'



### Response format

JSON object:
Nah

## GET `/trending`

Gets Trending YouTube videos. Identical to `/search` but without `input` parameter, and response includes additional field:

- `tabs`: Array of Object
	- `name`: (string) Tab title ("Now", "Music", "Gaming", "Movies")
	- `vrcurl`: (integer) index of vrcurl to load that tab (same response format)

## GET `/vrcurl/{pool}/{index}`

- `{pool}`: must be same as pool param in search endpoint.
- `{index}`: vrcurl index number

Response may be 302 redirect to youtube url, `image/png` for imagesheet, `application/json` for next page (see response format above) or trending tab or video json data (see below).

### Video metadata JSON format

- `captions`: Array of Object
	- `name`: (string) caption track name like "English" or "English (auto-generated)"
	- `id`: (string) id like `.en` or `a.en`
	- `lines`: Array of Object
		- `start`: (float) video seconds when the caption is displayed
		- `dur`: (float) seconds to display the caption
		- `text`: (string) caption text

# VRCUrls

Since VRCUrls are immutable you must create a pool of them which the server will correspond with to receive user selections. Create an array of 10,000 VRCUrls like so:

```csharp
VRCUrl[] vrcurl_pool = [
	new VRCUrl("https://api.u2b.cx/vrcurl/{pool}/0"),
	new VRCUrl("https://api.u2b.cx/vrcurl/{pool}/1"),
	new VRCUrl("https://api.u2b.cx/vrcurl/{pool}/2"),
	// etc...
]
//todo: provide tool to auto generate
```

`{pool}` must be a unique string in the format `^[a-z-_]+\d*$`. You can specify the pool size by suffixing with an integer, or else the default is 10,000.

All resources (youtube urls etc) referenced in the search results will be substituted by an integer that is the index of the VRCUrl in this array that will serve the resource.


# Imagesheet

Video thumbnails and channel icons are collated together into one image and served at a VRCUrl to be loaded by VRCImageDownloader.

Use the x, y, width and height values from the json to crop the image from the sheet. Do not make any assumptions about these values as the server could arrange the images wherever it wants.