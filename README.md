


# Endpoints

## GET `/search`

### Required query parameters

- `pool`: id of the VRCUrl pool, only letters numbers hyphens or underscores, optionally followed by an integer for pool size.
- `input`: youtube search query. All chars up to and including this exact unicode char `→` are ignored, and then whitespace is trimmed.

### Optional query parameters

- `thumbnails`: if this exists thumbnails will be loaded.
- `icons`: if this exists channel icons will be loaded.

### Example URL

```
https://api.u2b.cx/search?pool=example10000&input=   Type YouTube search query here →                       penile apparatus
```

### Response format

JSON object:

- `results`: Array of Object
	- `vrcurl`: (integer) index of VRCUrl that will redirect to the youtube url
	- `title`: (string)
	- `id`: (string) YouTube video id
	- `duration`: (integer) video duration in ms
	- `durationString`: (string) formatted duration
	- `uploaded`: (string) when the video was uploaded (i.e. "12 years ago")
	- `views`: (integer)
	- `channel`: (object)
		- `name`: (string)
		- `id`: (string)
		- `icon_index`?: (string) The index of the channel icon in the image sheet. because it is deduplicated, it is not one-to-one
- `imagesheet_vrcurl`?: (integer) index of the vrcurl for the collage of thumbnails and/or icons


## GET `/vrcurl/{pool}/{index}`

- `{pool}`: must be same as pool param in search endpoint.
- `{index}`: vrcurl index number

Response may be 302 redirect to youtube url or `image/jpeg` for imagesheet.

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

Thumbnails are 480x270, arranged vertically in the same order as the JSON results.

Channel icons are 68x68 in the second column at x = 480.