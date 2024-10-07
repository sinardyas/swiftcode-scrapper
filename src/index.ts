import { load } from "cheerio";
import ConcurrentManager from 'concurrent-manager';
import { logger } from "./utils/log";
import { db } from "./db";
import { branches, countries as sCountries } from "./db/schema";

interface Country { 
    code: string; 
    name: string; 
}

type RawResponse = {
    value: string;
}
type Branch = string;
type Bank = {
    name: string;
    branches: Branch[]
};
type CountryWithBank = Country & { 
    banks: Bank[];
}

async function fetchBanks(c: Country) {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const body = new URLSearchParams();
    body.append("input", "country");
    body.append("country", c.countryCode);

    const requestOptions = {
        method: "POST",
        headers,
        body,
        redirect: "follow"
    };

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result = await fetch("https://www.theswiftcodes.com/ajax/code-finder.ajax.php", requestOptions as any);
    const parsedResult: RawResponse[] = await result.json() as RawResponse[];

    return {
        ...c,
        banks: parsedResult.map(each => ({name: each.value, branches: []}))
    }
}

async function fetchBranches(c: Country, bank: Bank) {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const body = new URLSearchParams();
    body.append("input", "bank");
    body.append("country", c.code);
    body.append("bank", bank.name);

    const requestOptions = {
        method: "POST",
        headers,
        body,
        redirect: "follow"
    };

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result = await fetch("https://www.theswiftcodes.com/ajax/code-finder.ajax.php", requestOptions as any);
    const parsedResult: RawResponse[] = await result.json() as RawResponse[];

    const _branches = parsedResult.map(each => each.value);
    logger.info(`> Country: ${c.name} Code: ${c.code} Bank: ${bank} :: ${JSON.stringify(_branches, null, 2)}`);
    return _branches;
}

logger.info('==== Start ====');

logger.info('> Fetching country.....');
const data = await fetch('https://www.theswiftcodes.com/united-states/').then(
    (res) => res.text(),
);

const $ = load(data);

const countries: Country[] = [];
$(".finder-select.finder-country")
    .children('option')
    .each((i, el) => {
        const code = $(el).val() as string;
        const name = $(el).text();
        countries.push({
            code,
            name
        });
    });

console.log('countries ', countries.length);
logger.info(`> Total ${countries.length} countries successfully fetched`);

// for (const c of countries) {
//     await db.insert(sCountries).values({
//         name: c.countryName,
//         code: c.countryCode
//     });
// }

const concurrent = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const c of countries) {
    concurrent.queue(() => fetchBanks(c));
}

logger.info('> Fetching banks from countries.....');
const countryWithBank$ = await concurrent.run();

const countryWithBank: CountryWithBank[] = countryWithBank$.map(r => r.response) as CountryWithBank[];
logger.info(`> Total ${countryWithBank.length} banks successfully fetched`);

const concurrent2 = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const _countryWithBank of countryWithBank) {
    for (const bank of _countryWithBank.banks) {
        concurrent2.queue(() => fetchBranches(_countryWithBank, bank));
    }
    // console.log('_countryWithBank ', _countryWithBank);
}

logger.info('> Fetching bank branches from countries.....');
await concurrent2.run();
logger.info('> Bank branches successfully fetched');

logger.info('==== Finish ====');