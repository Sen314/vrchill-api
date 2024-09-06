if (process.env.D!="BUG") console.debug = () => {};
else console.debug(process.env);
import "./util.js";
import Koa from "koa";
import Router from "@koa/router";
import send from "koa-send";
import qs from "qs";
import { cachedVRCYoutubeSearch, getImageSheet } from "./VRCYoutubeSearch.js"
import { resolveVrcUrl } from "./vrcurl.js";
import { getVideoCaptionsCached } from "./youtube-captions.js";
import { stringToBoolean } from "./util.js";
import { readFileSync } from "fs";
var shorturlmap = JSON.parse(readFileSync("./shorturlmap.json", "utf8"));

var app = new Koa();
var router = new Router();


router.get(["/search", "/trending"], async ctx => {
	if (ctx.path == "/trending") {
		var input = {"type":"trending"};
	} else {
		var input = ctx.querystring.match(/[?&]input=(.*)/i)?.[1];
		if (!input) {
			ctx.status = 400;
			ctx.body = "missing search query";
			return;
		}
		input = decodeURIComponent(input).replace(/^.*→/, '').replaceAll("\u200b", '').trim();
	}

	var pqs = qs.parse(ctx.querystring, {duplicates: 'first'});

	if (!pqs.pool || !/^[a-z-_]+\d*$/.test(pqs.pool)) {
		ctx.status = 400;
		ctx.body = "invalid pool";
		return;
	}

	var options = {
		thumbnails: stringToBoolean(pqs.thumbnails),
		icons: stringToBoolean(pqs.icons),
		captions: stringToBoolean(pqs.captions),
		mode: pqs.mode,
		bp: pqs.bp
	};

	ctx.body = await cachedVRCYoutubeSearch(pqs.pool, input, options);
});


router.get("/vrcurl/:pool/:num", async ctx => {
	var dest = await resolveVrcUrl(ctx.params.pool, ctx.params.num);
	if (!dest) {
		ctx.status = 404;
		return;
	}
	switch (dest.type) {
		case "redirect":
			ctx.redirect(dest.url);
			break;
		case "video":
			if (ctx.get("User-Agent").includes("UnityWebRequest")) {
				ctx.body = {captions: await getVideoCaptionsCached(dest.id)};
			} else {
				ctx.redirect(`https://www.youtube.com/watch?v=${dest.id}`);
			}
			break;
		case "imagesheet":
			let buf = await getImageSheet(dest.key);
			if (!buf) {
				ctx.status = 404;
				return;
			}
			ctx.body = buf;
			ctx.type = "image/png";
			break;
		case "continuation":
			ctx.body = await cachedVRCYoutubeSearch(ctx.params.pool, {type: "continuation", for: dest.for, continuationData: dest.continuationData}, dest.options);
			break;
		case "trending":
			ctx.body = await cachedVRCYoutubeSearch(ctx.params.pool, {type: "trending", bp: dest.bp}, dest.options);
			break;
		case "captions":
			ctx.body = await getVideoCaptionsCached(dest.videoId);
			break;
		default:
			console.error("unknown vrcurl type", dest.type);
			ctx.status = 500;
	}
});


router.get("/robots.txt", ctx => {
	ctx.body = `User-agent: *\nDisallow: /`;
});

router.get("/test.html", async ctx => {
	await send(ctx, "test.html");
});

router.get("/", ctx => {
	ctx.redirect("https://www.u2b.cx/");
});





app.use(async (ctx, next) => {
	try {
		await next();
	} catch (error) {
		console.error(ctx.url, error.stack);
		ctx.status = 500;
		ctx.type = "text";
		ctx.body = error.stack;
	}
});


// short urls to work around https://feedback.vrchat.com/udon/p/vrcurlinputfield-incorrect-focus-issue-on-quest
app.use(async (ctx, next) => {
	var subdomain = ctx.hostname.match(/(.*).u2b.cx$/i)?.[1];
	if (subdomain && !["api","api2","dev"].includes(subdomain)) {
		if (shorturlmap[subdomain]) {
			ctx.url = shorturlmap[subdomain] + ctx.url.slice(1);
		} else {
			ctx.status = 404;
			return;
		}
	}
	await next();
});

// work around vrchat json parser bug https://feedback.vrchat.com/udon/p/braces-inside-strings-in-vrcjson-can-fail-to-deserialize
app.use(async (ctx, next) => {
	await next();
	if (ctx.type != "application/json") return;
	ctx.body = structuredClone(ctx.body);
	(function iterateObject(obj) {
		for (var key in obj) {
			if (typeof obj[key] == "string") {
				obj[key] = obj[key].replace(/[\[\]{}]/g, chr => "\\u" + chr.charCodeAt(0).toString(16).padStart(4, '0'));
			} else if (typeof obj[key] == "object") {
				iterateObject(obj[key]);
			}
		}
	})(ctx.body);
	ctx.body = JSON.stringify(ctx.body).replaceAll("\\\\u", "\\u");
});


app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT || 8142, process.env.ADDRESS);