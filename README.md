pre-fill VRCUrlInputField with user-friendly prefix:

```
https://api.u2b.cx/search/{domain}/   Type YouTube search query here →                       {user input}
```

{domain} must be short unique alphabetical string representing the world, and {user input} is end of string where user types. You can customize everything between / and → for cosmetic purposes, user input is everything after → with whitespace trimmed.

Server will return JSON string of array of YouTube search results in this format:

- `id`: (string) YouTube video id
- `vrcurl`: (number) index of VRCUrl that will redirect to the youtube url
- `title`: (string)
- `duration`: (number) video duration in ms
- `durationString`: (string) formatted duration
- `uploaded`: (string) when the video was uploaded (i.e. "12 years ago")
- `views`: (number)
- `thumbnail_vrcurl`: (number) index of VRCUrl that will redirect to thumbnail image url
- `channel` (object)
	- `name`: (string)
	- `id`: (string)
	- todo should we include icon?

### VRCUrls

Since VRCUrls are immutable you must define an array of at LEAST 10,000 VRCUrl instances like so:

```csharp
VRCUrl[] vrcurl_pool = [
	new VRCUrl("https://api.u2b.cx/vrcurl/{domain}/0"),
	new VRCUrl("https://api.u2b.cx/vrcurl/{domain}/1"),
	new VRCUrl("https://api.u2b.cx/vrcurl/{domain}/2"),
	// etc...
]
//todo: provide tool to auto generate
```

The server converts all URLs in the JSON response such that the VRCUrl at the Nth index will be 302 redirected to its substitute, that is until the list of VRCUrls are cycled through.

{domain} must be the same as in the search url, it allows different worlds to use the same api without using the same pool of VRCUrls.

If you want a different size pool you can specify by suffixing an integer to {domain}, i.e. if the domain is `foobar1000` the server will cycle through 0-999. Your pool size must be equal or larger than this value.