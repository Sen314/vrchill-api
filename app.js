import Koa from "koa";
import Router from "@koa/router";
import { cachedYoutubeSearch } from "./ytsearch.js";
import { resolveVrcUrl } from "./vrcurl.js";

export var app = new Koa();
var router = new Router();

router.get("/search/:domain/:query", async ctx => {
	var query = ctx.params.query.replace(/^.*→/, '').trim();
	ctx.body = await cachedYoutubeSearch(ctx.params.domain, query);
});

router.get("/vrcurl/:domain/:num", async ctx => {
	var url = await resolveVrcUrl(ctx.params.domain, ctx.params.num);
	if (url) ctx.redirect(url);
	else ctx.status = 404;
});

app.use(router.routes());
app.use(router.allowedMethods());
