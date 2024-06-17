import { parseVideoRendererData } from "./util.js";

export async function searchYouTubeVideos(query) {
	var url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.replaceAll(' ', '+'))}&sp=EgIQAQ%253D%253D`;
	var html = await fetch(url).then(res => res.text());

	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);
	console.debug(ytInitialData);

	var videos = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.find(x => x.itemSectionRenderer?.contents?.find(x => x.videoRenderer))?.itemSectionRenderer?.contents?.filterMap(x => x.videoRenderer)?.map(parseVideoRendererData);
	if (!videos) return {videos: []};
	console.debug(videos.length, "results");

	try {
		var ytcfg = html.match(/ytcfg.set\(({.*})\);/)[1];
		ytcfg = JSON.parse(ytcfg);
		var continuationData = {
			context: ytcfg.INNERTUBE_CONTEXT,
			continuation: ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.find(x => x.continuationItemRenderer).continuationItemRenderer.continuationEndpoint.continuationCommand.token
		}
	} catch (error) {
		console.error(error.stack);
	}

	return {videos, continuationData};
}


export async function continueYouTubeVideoSearch(continuationData) {
	var data = await fetch("https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(continuationData)
	}).then(res => res.json());
	console.debug(data);

	var continuationItems = data.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems;
	var videos = continuationItems.find(x => x.itemSectionRenderer?.contents.find(x => x.videoRenderer)).itemSectionRenderer.contents.filterMap(x => x.videoRenderer).map(parseVideoRendererData);
	var continuationToken = continuationItems.find(x => x.continuationItemRenderer)?.continuationItemRenderer.continuationEndpoint.continuationCommand.token
	console.debug(videos.length, "results");


	return {
		videos,
		continuationData: continuationToken ? {
			context: continuationData.context,
			continuation: continuationToken
		} : null
	}
}



export async function getYouTubePlaylist(playlistId) {
	var html = await fetch("https://www.youtube.com/playlist?list=" + playlistId).then(res => res.text());
	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);
	console.debug(ytInitialData);

	var sectionListRendererContents = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs.find(tab => tab.tabRenderer.selected).tabRenderer.content.sectionListRenderer.contents;
	var videos = sectionListRendererContents.find(x => x.itemSectionRenderer).itemSectionRenderer.contents.find(x => x.playlistVideoListRenderer).playlistVideoListRenderer.contents.filterMap(x => x.playlistVideoRenderer).map(parseVideoRendererData);
	if (!videos) return {videos: []};
	console.debug(videos.length, "results");

	try {
		var ytcfg = html.match(/ytcfg.set\(({.*})\);/)[1];
		ytcfg = JSON.parse(ytcfg);
		var continuationData = {
			context: ytcfg.INNERTUBE_CONTEXT,
			continuation: sectionListRendererContents.find(x => x.continuationItemRenderer).continuationItemRenderer.continuationEndpoint.continuationCommand.token
		}
	} catch (error) {
		console.error(error.stack);
	}
	return {videos, continuationData};
}


export async function continueYouTubePlaylist(continuationData) {
	var data = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(continuationData)
	}).then(res => res.json());
	console.debug(data);

	if (!data.onResponseReceivedActions) return {videos:[]};
	var continuationItems = data.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
	var videos = continuationItems.find(x => x.itemSectionRenderer).itemSectionRenderer.contents.filterMap(x => x.playlistVideoListRenderer).map(parseVideoRendererData);
	var continuationToken = continuationItems.find(x => x.continuationItemRenderer)?.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
	console.debug(videos.length, "results");

	return {
		videos,
		continuationData: continuationToken ? {
			context: continuationData.context,
			continuation: continuationToken
		} : null
	}
}