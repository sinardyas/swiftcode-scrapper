import ConcurrentManager from 'concurrent-manager';
import { logger } from "./utils/log";
import { db } from "./db";
import { banks as sBanks, countries as sCountries } from "./db/schema";
import type { Country, CountryWithBanks, RawResponse  } from "./type";

type CountryWithDbId = Country & { id: number };
type CountryWithBanksAndDbId = CountryWithBanks & { id: number };

async function fetchBanks(country: CountryWithDbId): Promise<CountryWithBanksAndDbId> {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const body = new URLSearchParams();
    body.append("input", "country");
    body.append("country", country.code);

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
        ...country,
        banks: parsedResult.map(each => ({name: each.value, branches: []}))
    }
}

logger.info('==== Start ====');
const countries = await db.select({ id: sCountries.id, name: sCountries.name, code: sCountries.code })
    .from(sCountries) as CountryWithDbId[];

const apiFetcher = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const country of countries) {
    apiFetcher.queue(() => fetchBanks(country));
}

logger.info('> Fetching banks from countries.....');
const countryWithBank$ = await apiFetcher.run();
const countryWithBank: CountryWithBanksAndDbId[] = countryWithBank$.map(r => r.response) as CountryWithBanksAndDbId[];
logger.info(`> Total ${countryWithBank.length} banks successfully fetched`);


const dbCreator = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const country of countryWithBank) {
    for (const bank of country.banks) {
        dbCreator.queue(async () => db.insert(sBanks).values({
            name: bank.name,
            countryId: country.id
        }));
    }
}

logger.info('> Inserting banks to database.....');
await dbCreator.run();
logger.info('> Finish inserting banks');