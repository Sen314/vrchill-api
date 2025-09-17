import { gotw, gotw_vrchill} from "./util.js";

var connectApiKey = ''

export async function searchJellyfinVideos(query) {

    var connectApiHost = "http://192.168.1.108:8096";
    var connectApiPath = `/Items?${query}`;
    var connectApiKey = "9a91066f635e4212bb06b4dc3eb0eef1";
    var url= `http://192.168.1.108:8096/Items?${encodeURIComponent(query)}`

    
    var options = {
        //host: connectApiHost,
        //path: connectApiPath,
        headers: {
            "Authorization": "Key " + connectApiKey,
            "X-MediaBrowser-Token": `${connectApiKey}`
        },
        //port: 8096,
        method: "GET",
        };

    try {
        var res = await gotw_vrchill(url,options), html = res.body ;
    } catch (error) {
        console.error(error.response.statusCode);
    }

    var json = JSON.parse(html);
    console.log(res);
    console.log(json);
    console.log(res.body);

    
    // var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)?.[1];
    // if (!ytInitialData) {
    //     console.error("missing ytInitialData", query, res.status, html);
    // }
    // ytInitialData = JSON.parse(ytInitialData);
    // console.debug(ytInitialData);

    // var sectionListRendererContents = ytInitialData
    //     .contents
    //     .twoColumnSearchResultsRenderer
    //     .primaryContents
    //     .sectionListRenderer
    //     .contents;
    var jfvideos = json.Items;
    if(!jfvideos) return {jfvideos: []};

    // var videos = sectionListRendererContents
    //     ?.find(x => x.itemSectionRenderer?.contents?.find(x => x.videoRenderer))
    //     ?.itemSectionRenderer
    //     .contents
    //     .filterMap(x => x.videoRenderer)
    //     .map(parseVideoRendererData);
    // if (!videos) return {videos: []};

    // var latest = sectionListRendererContents
    //     .find(x => x.itemSectionRenderer?.contents?.find(x => x.shelfRenderer))
    //     ?.itemSectionRenderer
    //     .contents
    //     .find(x => x.shelfRenderer?.title?.simpleText?.startsWith("Latest from"))
    //     ?.shelfRenderer
    //     .content
    //     .verticalListRenderer
    //     .items
    //     .filterMap(x => x.videoRenderer)
    //     .map(parseVideoRendererData);
    // console.debug("latest", latest);
    // if (latest) videos = [...latest, ...videos];

    // console.debug(videos.length, "results");

    // try {
    //     var ytcfg = html.match(/ytcfg.set\(({.*})\);/)[1];
    //     ytcfg = JSON.parse(ytcfg);
    //     var continuationData = {
    //         context: ytcfg.INNERTUBE_CONTEXT,
    //         continuation: sectionListRendererContents.findMap(x => x.continuationItemRenderer).continuationEndpoint.continuationCommand.token
    //     }
    // } catch (error) {
    //     console.error(error.stack);
    // }

    return jfvideos;
}




export async function continueYouTubeVideoSearch(continuationData) {
    var res = await gotw("https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false", {
        method: "POST",
        json: continuationData,
        responseType: "json"
    });
    var data = res.body;
    console.debug(data);

    var continuationItems = data
        .onResponseReceivedCommands[0]
        .appendContinuationItemsAction
        .continuationItems;
    var videos = continuationItems
        .find(x => x.itemSectionRenderer?.contents.find(x => x.videoRenderer))
        .itemSectionRenderer
        .contents
        .filterMap(x => x.videoRenderer)
        .map(parseVideoRendererData);
    var continuationToken = continuationItems
        .findMap(x => x.continuationItemRenderer)
        ?.continuationEndpoint
        .continuationCommand
        .token;
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
    var res = await gotw("https://www.youtube.com/playlist?list=" + playlistId);
    var html = res.body;
    var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
    ytInitialData = JSON.parse(ytInitialData);
    console.debug(ytInitialData);

    var sectionListRendererContents = ytInitialData
        .contents
        .twoColumnBrowseResultsRenderer
        .tabs
        .find(tab => tab.tabRenderer.selected)
        .tabRenderer
        .content
        .sectionListRenderer
        .contents;
    var videos = sectionListRendererContents
        .findMap(x => x.itemSectionRenderer?.contents)
        .findMap(x => x.playlistVideoListRenderer?.contents)
        .filterMap(x => x.playlistVideoRenderer)
        .map(parseVideoRendererData);
    if (!videos) return {videos: []};
    console.debug(videos.length, "results");

    try {
        var ytcfg = html.match(/ytcfg.set\(({.*})\);/)[1];
        ytcfg = JSON.parse(ytcfg);
        var continuationData = {
            context: ytcfg.INNERTUBE_CONTEXT,
            continuation: sectionListRendererContents.findMap(x => x.continuationItemRenderer).continuationEndpoint.continuationCommand.token
        }
    } catch (error) {
        console.error(error.stack);
    }
    return {videos, continuationData};
}




export async function continueYouTubePlaylist(continuationData) {
    var res = await gotw("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
        method: "POST",
        json: continuationData,
        responseType: "json"
    });
    var data = res.body;
    console.debug(data);

    if (!data.onResponseReceivedActions) return {videos:[]};
    var continuationItems = data
        .onResponseReceivedActions[0]
        .appendContinuationItemsAction
        .continuationItems;
    var videos = continuationItems
        .findMap(x => x.itemSectionRenderer?.contents)
        .filterMap(x => x.playlistVideoListRenderer)
        .map(parseVideoRendererData);
    var continuationToken = continuationItems
        .findMap(x => x.continuationItemRenderer)
        ?.continuationEndpoint
        .continuationCommand
        .token;
    console.debug(videos.length, "results");

    return {
        videos,
        continuationData: continuationToken ? {
            context: continuationData.context,
            continuation: continuationToken
        } : null
    }
}









export async function getTrending(bp) {
    var url = `https://www.youtube.com/feed/trending`;
    if (bp) url += `?bp=${bp}`;
    var res = await gotw(url);
    var html = res.body;
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
            var shelfRenderer = x.itemSectionRenderer.contents.findMap(x => x.shelfRenderer);
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












Object.prototype.concatRunsText = function concatRunsText() {
    return this.reduce((str, obj) => str += obj.text, "");
};

function parseVideoRendererData(data) {
    return {
        id: data.videoId,
        live: Boolean(data.badges?.find(x => x.metadataBadgeRenderer?.style == "BADGE_STYLE_TYPE_LIVE_NOW")),
        title: data.title?.runs?.concatRunsText(),
        description: data.detailedMetadataSnippets?.[0]?.snippetText?.runs?.concatRunsText() 
            || data.descriptionSnippet?.runs?.concatRunsText(),
        //thumbnailUrl: data.thumbnail?.thumbnails?.find(x => (x.width == 360 && x.height == 202) || (x.width == 246 && x.height == 138))?.url || data.thumbnail?.thumbnails?.[0]?.url,
        thumbnail: data.thumbnail?.thumbnails?.find(x => (x.width == 360 && x.height == 202) || (x.width == 246 && x.height == 138)) || data.thumbnail?.thumbnails?.[0],
        /*thumbnail: {
            url: `https://i.ytimg.com/vi/${data.videoId}/mqdefault.jpg`,
            width: 320,
            height: 180
        },*/
        uploaded: data.publishedTimeText?.simpleText || data.videoInfo?.runs?.[2]?.text,
        lengthText: data.lengthText?.simpleText,
        longLengthText: data.lengthText?.accessibility?.accessibilityData?.label,
        viewCountText: data.viewCountText?.runs ? data.viewCountText.runs.concatRunsText() : data.viewCountText?.simpleText,
        shortViewCountText: data.shortViewCountText?.simpleText || data.videoInfo?.runs?.[0]?.text,
        channel: {
            name: (data.ownerText || data.shortBylineText)?.runs?.concatRunsText(),
            id: (data.ownerText || data.shortBylineText)?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
            iconUrl: data.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url
        }
    };
}