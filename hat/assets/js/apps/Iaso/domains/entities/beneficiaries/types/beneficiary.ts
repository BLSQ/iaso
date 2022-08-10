/* eslint-disable camelcase */

type Attributes = {
    name: string;
    file_content: Record<string, string>;
};
export type Beneficiary = {
    id: number;
    uuid: string;
    name: string;
    created_at: number;
    updated_at: number;
    attributes: Attributes;
    entity_type: number;
    entity_type_name: string;
};
