import { FeatureFlag } from './featureFlag';

export type Project = {
    app_id: string;
    feature_flags: Array<FeatureFlag>;
    name: string;
    id: number;
    updated_at?: number;
    needs_authentication?: boolean;
    old_app_id?: string | null | undefined;
    created_at?: number;
};
