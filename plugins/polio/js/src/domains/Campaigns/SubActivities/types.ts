import { Scope } from '../../../constants/types';

export type SubActivityFormValues = {
    round_number?: number;
    campaign?: string; // obr name
    id?: number;
    name?: string;
    start_date: string; // date
    end_date: string; // date
    age_unit?: 'm' | 'y';
    age_min?: number;
    age_max?: number;
    scopes: Scope[];
};
