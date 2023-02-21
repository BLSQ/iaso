/* eslint-disable camelcase */
export type EntityType = {
    id: number;
    name: string;
    created_at: number;
    updated_at: number;
    reference_form?: number;
    fields_detail_info_view?: string[];
    fields_list_view?: string[];
    fields_duplicate_search?: string[];
};
