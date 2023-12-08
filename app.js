import Koa from "koa";
import Router from "@koa/router";
import { cachedYoutubeSearch } from "./ytsearch.js";
import { getImageSheet } from "./imagesheet.js";
import { resolveVrcUrl } from "./vrcurl.js";

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
		thumbnails: Boolean(ctx.query.thumbnails),
		icons: Boolean(ctx.query.icons)
	};

	ctx.body = await cachedYoutubeSearch(ctx.query.pool, query, options);
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
			ctx.type = "image/jpeg";
			break;
		default:
			ctx.status = 500;
	}
});


app.use(router.routes());
app.use(router.allowedMethods());
