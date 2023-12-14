export const mockFormAList: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            id: 1,
            action: 'forma_unusable',
            forma_reception_rrt: '2023-05-06',
            date_of_report: '2023-05-03',
            vials_used: 25,
            vials_missing: 3,
            unusable_vials: 7,
            lot_numbers_for_usable_vials: [1234, 5678], // not sure about this. Maybe the array is good to be able to display the numbers on top of each other
        },
        {
            id: 2,
            action: 'forma_unusable',
            forma_reception_rrt: '2023-09-02',
            date_of_report: '2023-09-01',
            vials_used: 35,
            vials_missing: 10,
            unusable_vials: 4,
            lot_numbers_for_usable_vials: [9999, 6666], // not sure about this. Maybe the array is good to be able to display the numbers on top of each other
        },
    ],
};

export const mockDestructionsList: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            id: 1,
            action: 'PV Destruction - Mordor', // This seems to be input by the user
            destruction_reception_rrt: '2023-09-02',
            date_of_report: '2023-09-01',
            vials_destroyed: 12,
        },
        {
            id: 2,
            action: 'PV Destruction - Mordor',
            destruction_reception_rrt: '2023-10-02',
            date_of_report: '2023-09-21',
            vials_destroyed: 17,
        },
    ],
};
export const mockIncidentsList: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            id: 1,
            action: 'Vaccine expired',
            incident_reception_rrt: '2023-09-02',
            unusable_vials: 7,
            usable_vials: 0,
        },
        {
            id: 2,
            action: 'Return',
            incident_reception_rrt: '2023-09-02',
            unusable_vials: 0,
            usable_vials: 15,
        },
    ],
};
