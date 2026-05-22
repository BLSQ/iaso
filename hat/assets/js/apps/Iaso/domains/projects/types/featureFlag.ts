export type FeatureFlag = {
    id: number | string;
    code: string;
    description: string;
    name: string;
    configuration_schema: Record<string, any>;
    created_at?: number;
    updated_at?: number;
    category: string;
    is_dangerous: boolean;
};

export type ProjectFeatureFlag = {
    id: number | string;
    code: string;
    description: string;
    name: string;
    configuration?: Record<string, any>;
};
