import { load } from "cheerio";
import ConcurrentManager from 'concurrent-manager';
import { logger } from "./utils/log";
import { db } from "./db";
import { countries as sCountries } from "./db/schema";
import type { Country  } from "./type";

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

const concurrent = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const c of countries) {
    concurrent.queue(async () => db.insert(sCountries).values({
        name: c.name,
        code: c.code
    }));
}

logger.info('> Inserting countries to database');
await concurrent.run();
logger.info('> Finish inserting countries');
