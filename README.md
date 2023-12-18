# VRChat YouTube Search API

An API server for building YouTube search UIs in VRChat, with pagination, thumbnails and channel icons.

Test in browser: https://api.u2b.cx/test.html

# Endpoints

## GET `/search`

### Required query parameters

- `pool`: id of the VRCUrl pool, only letters numbers hyphens or underscores, optionally followed by an integer for pool size.
- `input`: youtube search query. All chars up to and including this exact unicode char `→` are ignored, and then whitespace is trimmed.

### Optional query parameters

- `thumbnails`: set to `1`, `true`, `yes`, `on` or whatever to load thumbnails
- `icons`: set to `1`, `true`, `yes`, `on` or whatever to load channel icons

### Example URL

```
https://api.u2b.cx/search?pool=example10000&input=   Type YouTube search query here →                       penile apparatus
```

### Response format

JSON object:

- `results`: Array of Object
	- `vrcurl`: (integer) index of VRCUrl that will redirect to the youtube url
	- `live`: (boolean) whether it's a live stream
	- `title`: (string) i.e. `"Nyan Cat! [Official]"`
	- `id`: (string) YouTube video id i.e. `"2yJgwwDcgV8"`
	- `description`: (string) short truncated description snippet i.e. `"http://nyan.cat/ Original song : http://momolabo.lolipop.jp/nyancatsong/Nyan/"`
	- `lengthText`?: (string) i.e. `"3:37"`
	- `longLengthText`?: (string) i.e. `"3 minutes, 37 seconds"`
	- `viewCountText`: (string) i.e. `"2,552,243 views"` or `"575 watching"` for live streams
	- `shortViewCountText`?: (string) i.e. `"2.5M views"`
	- `uploaded`: (string) i.e. `"12 years ago"`
	- `channel`: (object)
		- `name`: (string) i.e. `"NyanCat"`
		- `id`: (string) i.e. `"UCsW85RAS2_Twg_lEPyv7G8A"`
		- `icon`?: (object)
			- `x`: (integer) px from left
			- `y`: (integer) px from top
			- `width`: (integer)
			- `height`: (integer)
	- `thumbnail`?: (object)
		- `x`: (integer) px from left
		- `y`: (integer) px from top
		- `width`: (integer)
		- `height`: (integer)
- `imagesheet_vrcurl`?: (integer) index of the vrcurl for the collage of thumbnails and/or icons
- `nextpage_vrcurl`: (integer) index of the vrcurl that will serve the JSON for the next page of results


## GET `/vrcurl/{pool}/{index}`

- `{pool}`: must be same as pool param in search endpoint.
- `{index}`: vrcurl index number

Response may be 302 redirect to youtube url, `image/png` for imagesheet or `application/json` for next page

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

Use the x, y, width and height values from the json to crop the image from the sheet.