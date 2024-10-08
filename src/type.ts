export type RawResponse = {
    value: string;
}

export interface Country { 
    code: string; 
    name: string; 
}

export type Bank = {
    name: string;
};

export type Branch = string;

export type BankWithBranches = Bank & {
    branches: Branch[]
}

export type CountryWithBanks = Country & { 
    banks: BankWithBranches[];
}

export type WithId = {
    id: number
};

export type CountryWithDbId = Country & WithId;
export type CountryWithBanksAndDbId = CountryWithBanks & WithId;