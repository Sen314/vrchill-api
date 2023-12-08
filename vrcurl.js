import Keyv from "keyv";

var keyv = new Keyv('sqlite://vrcurl.sqlite');



async function nextNum(pool) {
	var num = await keyv.get(`${pool}:nextnum`);
	num ||= 0;
	
	var max = pool.match(/\d+$/)?.[0];
	if (max) max = Number(max);
	else max = 10000;
	if (num >= max) num = 0;

	keyv.set(`${pool}:nextnum`, num + 1);
	return num;
}


export async function putVrcUrl(pool, dest) {
	var num = await nextNum(pool);
	await keyv.set(`${pool}:${num}`, dest);
	return num;
};

export async function resolveVrcUrl(pool, num) {
	return await keyv.get(`${pool}:${num}`);
};