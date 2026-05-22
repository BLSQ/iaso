export type SelectPeriod = '3months' | '6months' | '9months' | '12months';

export type AfroMapParams = {
    startDate?: string; // date in dd-mm-yyyy format
    endDate?: string; // date in dd-mm-yyyy format
    rounds?: string; // RoundSelection but wuth the number in string form
    period?: SelectPeriod;
    displayedShapesLeft?: 'country' | 'district';
    displayedShapesRight?: 'country' | 'district';
    zoomLeft: string;
    centerLeft: string;
    zoomRight: string;
    centerRight: string;
    leftTab: string;
    rightTab: string;
};

export type MapCategory = 'lqas' | 'imIHH' | 'imOHH' | 'imGlobal';

export type RoundSelection = number | 'latest' | 'penultimate';
