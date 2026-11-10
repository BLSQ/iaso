import { FeatureFlag } from '../types/featureFlag';

export type Project = {
    app_id?: string;
    feature_flags?: Array<FeatureFlag>;
    name: string;
    description?: string;
    id: number;
    updated_at?: number;
    needs_authentication?: boolean;
    old_app_id?: string | null | undefined;
    created_at?: number;
    color: string | null | undefined;
};

/** Create omits `id`; update includes it. */
export type ProjectSavePayload = Omit<Project, 'id'> & { id?: number };
