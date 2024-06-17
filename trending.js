import { parseVideoRendererData } from "./util.js";

export async function getTrending(bp) {
	var url = `https://www.youtube.com/feed/trending`;
	if (bp) url += `?bp=${bp}`;
	var html = await fetch(url).then(res => res.text());
	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);

	var tabs = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs.map(t => {
		return {
			name: t.tabRenderer.title,
			//url: `https://www.youtube.com` + t.tabRenderer.endpoint.commandMetadata.webCommandMetadata.url
			bp: t.tabRenderer.endpoint.browseEndpoint.params
		}
	});

	var videos = ytInitialData
		.contents
		.twoColumnBrowseResultsRenderer
		.tabs
		.find(tab => tab.tabRenderer.selected)
		.tabRenderer
		.content
		.sectionListRenderer
		.contents
		// regular trending in sections with shelfRenderer without title
		.filterMap(x => {
			var shelfRenderer = x.itemSectionRenderer.contents.find(x => x.shelfRenderer)?.shelfRenderer;
			if (shelfRenderer && !shelfRenderer.title) {
				return shelfRenderer
					.content
					.expandedShelfContentsRenderer
					.items
					.filterMap(x => x.videoRenderer)
					.map(parseVideoRendererData)
			};
		})
		.flat();


	return {tabs, videos};
}