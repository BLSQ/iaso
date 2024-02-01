import {
    RETURN_TO_SUPPLIER,
    VACCINE_EXPIRED,
} from '../StockVariation/Modals/useIncidentOptions';

// GET /api/polio/vaccine/stock/outgoing_stock_movement/?vaccine_stock=2&limit=4
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
            campaign: 'DRC-2023-03-01_nOPV', // "campaign" done
            form_a_reception_date: '2023-05-06', // "form_a_reception_date" done
            report_date: '2023-05-03', // "report_date" done
            usable_vials_used: 25, // "usable_vials_used" done
            missing_vials: 3, // "missing_vials" done
            unusable_vials: 7, // "unusable_vials" done
            lot_numbers_for_usable_vials: [1234, 5678], // its an array of Strings at the moment like  "lot_numbers": [ "LOT-5556", "LOT-5557"],
            // vaccine_stock : 2 // id of connected vaccine_stock is present in API
        },
        {
            id: 2,
            campaign: 'DRC-11Prov-03-2022',
            form_a_reception_date: '2023-09-02',
            report_date: '2023-09-01',
            usable_vials_used: 35,
            missing_vials: 10,
            unusable_vials: 4,
            lot_numbers_for_usable_vials: [9999, 6666],
        },
    ],
};

// GET /api/polio/vaccine/stock/destruction_report/?vaccine_stock=2&limit=4
export const mockDestructionsList: any = {
    count: 2,
    page: 1,
    pages: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            id: 1, // ok
            action: 'PV Destruction - Mordor', // ok string, input by the user
            destruction_reception_rrt: '2023-09-02', // "rrt_destruction_report_reception_date"
            destruction_report_date: '2023-09-01', // destruction_report_date done
            unusable_vials_destroyed: 12, // unusable_vials_destroyed
            // lot_number: "LOT_123" // present on API MUST BE CHANGED to lot_numbers (multiple)
            // vaccine_stock : 2 // id of connected vaccine_stock is present in API
        },
        {
            id: 2,
            action: 'PV Destruction - Mordor',
            destruction_reception_rrt: '2023-10-02',
            destruction_report_date: '2023-09-21',
            unusable_vials_destroyed: 17,
        },
    ],
};

// GET /api/polio/vaccine/stock/incident_report/?vaccine_stock=2&limit=2
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
            stock_correction: VACCINE_EXPIRED, // this is ok but the values returnes by API are actually in lowercase like vvm_reached_discard_point
            incident_report_received_by_rrt: '2023-09-02', // incident_report_received_by_rrt done
            date_of_incident_report: '2023-09-21', // date_of_incident_report
            unusable_vials: 7, // ok
            usable_vials: 0, // ok
            // vaccine_stock : 2 // id of connected vaccine_stock is present in API
        },
        {
            id: 2,
            stock_correction: RETURN_TO_SUPPLIER,
            incident_report_received_by_rrt: '2023-09-02',
            date_of_incident_report: '2023-09-21',
            unusable_vials: 0,
            usable_vials: 15,
        },
    ],
};
