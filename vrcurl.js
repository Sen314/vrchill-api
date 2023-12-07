import Keyv from "keyv";

var keyv = new Keyv('sqlite://vrcurl.sqlite');



async function nextNum(domain) {
	var num = await keyv.get(`${domain}:nextnum`);
	num ||= 0;
	
	var max = domain.match(/\d+$/)?.[0];
	if (max) max = Number(max);
	else max = 10000;
	if (num >= max) num = 0;

	keyv.set(`${domain}:nextnum`, num + 1);
	return num;
}


export async function toVrcUrl(domain, url) {
	var num = await nextNum(domain);
	await keyv.set(`${domain}:${num}`, url);
	return num;
};

export async function resolveVrcUrl(domain, num) {
	return await keyv.get(`${domain}:${num}`);
};