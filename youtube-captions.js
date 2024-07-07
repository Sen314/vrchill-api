import { XMLParser } from "fast-xml-parser";
import { gotw } from "./util.js";

var xmlParser = new XMLParser({
	ignoreAttributes: false
});

async function getVideoData(videoId) {
	var res = await gotw(`https://www.youtube.com/watch?v=${videoId}`);

	var ytInitialPlayerResponse = res.body.match(/var ytInitialPlayerResponse = ({.*});/)[1];
	ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponse);

	return ytInitialPlayerResponse;
}

async function getVideoCaptions(videoId) {
	var ytInitialPlayerResponse = await getVideoData(videoId);
	if (!ytInitialPlayerResponse.captions) return [];
	var captionTracks = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
	captionTracks = await Promise.all(captionTracks.map(captionTrack => (async () => {
		try {
			var xml = await gotw(captionTrack.baseUrl, {resolveBodyOnly: true});
			var parsed = xmlParser.parse(xml);
			var lines = parsed.transcript.text;
			if (!Array.isArray(lines)) lines = [lines];
			lines = lines.map(({ "#text": text, "@_start": start, "@_dur": dur }) => ({ start: Number(start), dur: Number(dur), text }));
			return {
				name: captionTrack.name.simpleText,
				id: captionTrack.vssId,
				lines
			};
		} catch (error) {
			console.error("caption track error", error.stack, videoId, captionTrack, xml, parsed, lines);
		}
	})()));
	return captionTracks;
}

var cache = {};

export async function getVideoCaptionsCached(videoId) {
	if (!cache[videoId]) {
		cache[videoId] = getVideoCaptions(videoId);
		setTimeout(() => {
			delete cache[videoId];
		}, 1000*60*10); // 10 minutes
	}
	return await cache[videoId];
}