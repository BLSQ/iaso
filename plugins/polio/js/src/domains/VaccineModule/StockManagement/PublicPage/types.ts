import { VaccineForStock } from '../../../../constants/types';

export type EntryType =
    | 'vaccine_arrival_report'
    | 'outgoing_stock_movement'
    | 'incident_report'
    | 'destruction_report'
    | 'earmarked_stock__created'
    | 'earmarked_stock__returned'
    | 'earmarked_stock__used';

export type Entry = {
    date: string;
    action: string;
    vials_in: number | null;
    doses_in: number | null;
    vials_out: number | null;
    doses_out: number | null;
    type: EntryType;
    doses_per_vial: number;
    id: number;
    vaccine_stock_id: number;
    country_name: string;
    country_id: number;
    vaccine_type: VaccineForStock;
    vials_type: 'usable' | 'unusable';
};

export type PublicVaccineStockResults = {
    total_vials: number;
    total_doses: number;
    earmarked_vials: number | null;
    earmarked_doses: number | null;
    movements: Entry[];
};

export type PublicVaccineStockResponse = {
    count: number;
    results: PublicVaccineStockResults;
    has_next: boolean;
    has_previous: boolean;
    page: number;
    pages: number;
    limit: number;
};
