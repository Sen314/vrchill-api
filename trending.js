import { parseVideoRendererData } from "./util.js";

export async function getTrending() {
	var url = `https://www.youtube.com/feed/trending`;
	var html = await fetch(url).then(res => res.text());
	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);
	var videos = ytInitialData
		.contents
		.twoColumnBrowseResultsRenderer
		.tabs[0] //Now
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
					.map(parseVideoRendererData)
			};
		})
		.flat();
	return videos;
}

console.log(JSON.stringify(await getTrending(),null,4))