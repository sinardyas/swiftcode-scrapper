import type { RawResponse, BranchWithCountryAndBankAndSwiftCode, BranchWithCountryAndBank } from "./type";
import { db } from "./db";
import { banks as sBanks, countries as sCountries, branches as sBranches, swiftcodes as sSwiftcodes } from "./db/schema";
import { logger } from "./utils/log";
import { eq } from "drizzle-orm";
import ConcurrentManager from "concurrent-manager";

async function fetchSwiftcodes(branch: BranchWithCountryAndBank): Promise<BranchWithCountryAndBankAndSwiftCode> {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const body = new URLSearchParams();
    body.append("input", "city");
    body.append("country", branch.country);
    body.append("bank", branch.bank);
    body.append("city", branch.name);

    const requestOptions = {
        method: "POST",
        headers,
        body,
        redirect: "follow"
    };

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result = await fetch("https://www.theswiftcodes.com/ajax/code-finder.ajax.php", requestOptions as any);
    const parsedResult: RawResponse[] = await result.json() as RawResponse[];

    const swiftcodes = parsedResult.map(each => ({name: each.value}));
    logger.info(`> Country: ${branch.country} Bank: ${branch.bank} City: ${branch.name} :: ${JSON.stringify(swiftcodes, null, 2)}`);

    return {
        id: branch.id,
        country: branch.country,
        bank: branch.bank,
        name: branch.name,
        swiftcodes: swiftcodes
    }
}

const branches = await db.select({ id: sBranches.id, name: sBranches.name, bank: sBanks.name, country: sCountries.code })
    .from(sBranches)
    .rightJoin(sBanks, eq(sBranches.bankId, sBanks.id))
    .rightJoin(sCountries, eq(sBanks.countryId, sCountries.id)) as BranchWithCountryAndBank[];

const apiFetcher = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const branch of branches) {
    apiFetcher.queue(() => fetchSwiftcodes(branch));
}

logger.info('> Fetching swiftcodes.....');
const branchWithSwiftcodes$ = await apiFetcher.run();
const branchWithSwiftcodes = branchWithSwiftcodes$.map(r => r.response) as BranchWithCountryAndBankAndSwiftCode[];
logger.info('> Finish fetching swiftcodes');

const dbCreator = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const branch of branchWithSwiftcodes) {
    for (const swiftcode of branch.swiftcodes) {
        dbCreator.queue(() => db.insert(sSwiftcodes).values({
            branchId: branch.id,
            name: swiftcode.name,
        }));
    }
}

logger.info('> Inserting swiftcodes to database.....');
await dbCreator.run();
logger.info('> Finish inserting swiftcodes');