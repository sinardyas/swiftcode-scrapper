import type { Bank, BankWithBranches, RawResponse  } from "./type";
import { db } from "./db";
import { banks as sBanks, countries as sCountries, branches as sBranches } from "./db/schema";
import { logger } from "./utils/log";
import { eq } from "drizzle-orm";
import ConcurrentManager from "concurrent-manager";

type BankWithCountryCode = Bank & { countryCode: string; id: number; };
type BankWithBranchesAndDbId = BankWithBranches & { id: number; }

async function fetchBranches(bank: BankWithCountryCode): Promise<BankWithBranchesAndDbId> {
    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const body = new URLSearchParams();
    body.append("input", "bank");
    body.append("country", bank.countryCode);
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
    logger.info(`> Country Code: ${bank.countryCode} Bank: ${bank.name} :: ${JSON.stringify(_branches, null, 2)}`);

    return {
        id: bank.id,
        name: bank.name,
        branches: _branches
    }
}

const banks = await db.select({ id: sBanks.id, name: sBanks.name, countryCode: sCountries.code })
    .from(sBanks)
    .leftJoin(sCountries, eq(sBanks.countryId, sCountries.id)) as BankWithCountryCode[];

const apiFetcher = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const bank of banks) {
    apiFetcher.queue(() => fetchBranches(bank));
}

logger.info('> Fetching branches.....');
const bankWithBranches$ = await apiFetcher.run();
const bankWithBranches = bankWithBranches$.map(r => r.response) as BankWithBranchesAndDbId[];
logger.info('> Finish fetching branches');

const dbCreator = new ConcurrentManager({
    concurrent: 20, // max concurrent process to be run
    withMillis: true // add millisecond tracing to process
});

for (const bank of bankWithBranches) {
    for (const branch of bank.branches) {
        dbCreator.queue(() => db.insert(sBranches).values({
            bankId: bank.id,
            name: branch,
        }));
    }
}

logger.info('> Inserting branches to database.....');
await dbCreator.run();
logger.info('> Finish inserting branches');