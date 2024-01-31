import Koa from "koa";
import Router from "@koa/router";
import send from "koa-send";
import { cachedVRCYoutubeSearch } from "./VRCYoutubeSearch.js"
import { getImageSheet } from "./imagesheet.js";
import { resolveVrcUrl } from "./vrcurl.js";
import { stringToBoolean } from "./util.js";

export var app = new Koa();
var router = new Router();


router.get("/search", async ctx => {
	var query = ctx.query.input?.replace(/^.*→/, '').trim();
	if (!query) {
		ctx.status = 400;
		ctx.body = "missing search query";
		return;
	}

	if (!ctx.query.pool || !/^[a-z-_]+\d*$/.test(ctx.query.pool)) {
		ctx.status = 400;
		ctx.body = "invalid pool";
		return;
	}

	var options = {
		thumbnails: stringToBoolean(ctx.query.thumbnails),
		icons: stringToBoolean(ctx.query.icons)
	};

	ctx.body = await cachedVRCYoutubeSearch(ctx.query.pool, query, options);
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
		case "imagesheet":
			let buf = await getImageSheet(ctx.params.pool, ctx.params.num);
			if (!buf) {
				ctx.status = 404;
				return;
			}
			ctx.body = buf;
			ctx.type = "image/png";
			break;
		case "ytContinuation":
			ctx.body = await cachedVRCYoutubeSearch(ctx.params.pool, dest.continuationData, dest.options);
			break;
		default:
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
	ctx.type = "json";
});

app.use(router.routes());
app.use(router.allowedMethods());
