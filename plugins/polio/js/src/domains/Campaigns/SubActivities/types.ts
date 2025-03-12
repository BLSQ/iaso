import { Nullable } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Scope } from '../../../constants/types';

export type SubActivityFormValues = {
    round_number?: number;
    campaign?: string; // obr name
    id?: number;
    name: string;
    round_start_date?: Nullable<string>; // date
    round_end_date?: Nullable<string>; // date
    start_date: string; // date
    end_date: string; // date
    lqas_started_at?: string; // date
    lqas_ended_at?: string; // date
    im_started_at?: string; // date
    im_ended_at?: string; // date
    age_unit?: 'm' | 'y';
    age_min?: number;
    age_max?: number;
    scopes: Scope[];
};
