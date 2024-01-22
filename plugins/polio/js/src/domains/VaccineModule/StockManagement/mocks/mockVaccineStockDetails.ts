export const mockUsableVials: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            date: '2023-10-09',
            action: 'PO1234556',
            vials_in: 1500,
            doses_in: 30000,
            vials_out: null,
            doses_out: null,
        },
        {
            date: '2023-10-11',
            action: 'losses',
            vials_in: null,
            doses_in: null,
            vials_out: 50,
            doses_out: 1000,
        },
    ],
};
export const mockUnusableVials: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            date: '2023-11-07',
            action: 'PV Destruction Mordor',
            vials_in: null,
            vials_out: 20,
        },
        {
            date: '2023-11-21',
            action: 'forma_vials_unusable',
            vials_in: 35,
            vials_out: null,
        },
    ],
};

export const mockSummary = {
    country_name: 'CAMEROON',
    vaccine_type: 'bOPV',
    total_usable_doses: 5000,
    total_usable_vials: 2550,
    total_unusable_doses: 1000,
    total_unusable_vials: 550,
};
