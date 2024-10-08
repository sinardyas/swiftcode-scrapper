export type RawResponse = {
    value: string;
}

interface Base {
    id?: number; 
    name: string; 
}

export type Country = Base & {
    code: string; 
}
export type Bank = Base;
export type Branch = Base;
export type Swiftcode = Base;

export type RCountry = string;
export type RBank = string;
export type RBranch = string;
export type RSwiftcode = string;

export type CountryWithBanks = Country & {
    banks: Bank[]
}

export type BankWithBranches = Bank & {
    branches: Branch[]
}

export type BankWithCountryCode = Bank & {
    countryCode: string;
}

export type BranchWithCountryAndBank = Branch & {
    bank: RBank;
    country: RCountry;
}

export type BranchWithSwiftcodes = Branch & {
    swiftcodes: Swiftcode[]
}

export type BranchWithCountryAndBankAndSwiftCode = BranchWithCountryAndBank & {
    swiftcodes: Swiftcode[]
}