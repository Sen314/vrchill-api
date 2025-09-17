import { searchJellyfinVideos, continueYouTubeVideoSearch, getYouTubePlaylist, continueYouTubePlaylist, getTrending } from "./jellyfin.js";
import { putVrcUrl } from "./vrcurl.js";
import { createImageSheet } from "./imagesheet.js";

var cache = {};

export async function cachedVRCJellyfinSearch(pool, query, options, baseUrl) {
    var key = JSON.stringify([pool, query, options]);
    if (!cache[key]) {
        cache[key] = VRCJellyfinSearch(pool, query, options, key, baseUrl);
        setTimeout(() => {
            delete cache[key];
        }, 1000*60*10); // 10 mins
    }
    return (await cache[key])?.response;
}

export async function getJellyfinImageSheet(key) {
    return await (await cache[key])?.imagesheet
}


async function VRCJellyfinSearch(pool, query, options = {}, key, baseUrl) {
    console.log("search", pool, JSON.stringify(query), JSON.stringify(options));
    var response = {results: []};
    //var playlistId = query.match(/list=(PL[a-zA-Z0-9-_]{32})/)?.[1];

    //if (playlistId) console.log("playlistId:", playlistId);

    var videos = await searchJellyfinVideos(query);
    
    var images = [];

    if (options.thumbnails) {
        videos.forEach(video => {
            video.thumbnail ||= {
                url: `${baseUrl}/Items/${video.Id}/Images/Primary`,
                width: 320,
                height: 180
            };
            console.debug(video.thumbnail);
            video.thumbnail.width = 360;
            video.thumbnail.height = 202;
            // if (playlistId) video.thumbnail = {
            //     url: `${baseUrl}/Items/${video.Id}/Images/Primary`,
            //     width: 120,
            //     height: 90
            // };
            // else {
            //     video.thumbnail ||= {
            //         url: `${baseUrl}/Items/${video.Id}/Images/Primary`,
            //         width: 320,
            //         height: 180
            //     };
            //     console.debug(video.thumbnail);
            //     video.thumbnail.width = 360;
            //     video.thumbnail.height = 202;
            // }
            images.push(video.thumbnail);
        });
    }


    if (images.length) {
        try {
            response.imagesheet_vrcurl = await putVrcUrl(pool, {type: "imagesheet", key});
            //var imagesheet = createImageSheet(images, !playlistId && !options.icons);
            var imagesheet = createImageSheet(images, !options.icons);
        } catch (error) {
            console.error(error.stack);
        }
    }

    for (let video of videos) {
        video.vrcurl = await putVrcUrl(pool, {type: "video", id: video.Id});
        //let thumbnail = images.find(image => image.url == video.thumbnail.url);
        // video.thumbnail = thumbnail ? {
        //     x: thumbnail?.x,
        //     y: thumbnail?.y,
        //     width: thumbnail?.width,
        //     height: thumbnail?.height
        // } : undefined;
        // let icon = images.find(image => image.url == video.channel.iconUrl);
        // video.channel.icon = icon ? {
        //     x: icon?.x,
        //     y: icon?.y,
        //     width: icon?.width,
        //     height: icon?.height
        // } : undefined;
        if (options.captions) {
            video.captions_vrcurl = await putVrcUrl(pool, {type: "captions", videoId: video.id});
        }
        //delete video.channel.iconUrl;
        response.results.push(video);
    }

    // if (continuationData) response.nextpage_vrcurl = await putVrcUrl(pool, {
    //     type: "continuation",
    //     for: query.for || (playlistId ? "playlist" : "search"),
    //     continuationData,
    //     options
    // });

    return {response, imagesheet};
}