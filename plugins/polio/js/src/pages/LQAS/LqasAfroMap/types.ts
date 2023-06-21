export type AfroMapParams = {
    accountId: string;
    startDate?: string; // date in dd-mm-yyyy format
    endDate?: string; // date in dd-mm-yyyy format
    round?: string; // 'latest' or a number in string form
};

export type MapCategory = 'lqas' | 'imIHH' | 'imOHH' | 'imGlobal';
