export type FeatureFlag = {
    id: number | string;
    code: string;
    description: string;
    name: string;
    created_at: number;
    updated_at: number;
    category: string;
    is_dangerous: boolean;
};
