import { IOrgUnit } from '../../orgUnits/types/orgUnit';

export interface IInstance {
    uuid: string;
    id: number;
    device_id: string;
    file_name: string;
    file_url: string;
    form_id: number;
    form_name: string;
    created_at: number;
    updated_at: number;
    latitude: number;
    longitude: number;
    altitude: number;
    files: Array<string>;
    status: string;
    export_statuses: Array<string>;
    correlation_id: string | null;
    deleted: boolean;
    org_unit: IOrgUnit;

    period: unknown;
    file_content: unknown;
    form_descriptor: unknown;
    last_export_success_at: unknown;
}
