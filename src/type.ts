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

export type RBranch = string;

export type RSwiftcode = string;

export type Branch = {
    id: number;
    city: string;
    bank: string;
    country: string;
}

export type BankWithBranches = Bank & {
    branches: RBranch[];
}

export type CountryWithBanks = Country & { 
    banks: BankWithBranches[];
}

export type WithId = {
    id: number
};

export type CountryWithDbId = Country & WithId;
export type CountryWithBanksAndDbId = CountryWithBanks & WithId;