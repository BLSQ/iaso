import { ProjectFeatureFlag } from './featureFlag';

export type Project = {
    app_id: string;
    feature_flags: ProjectFeatureFlag[];
    name: string;
    id: number | string | null | undefined;
    updated_at?: number;
    needs_authentication?: boolean;
    old_app_id?: string | null | undefined;
    created_at?: number;
    color?: string;
};
