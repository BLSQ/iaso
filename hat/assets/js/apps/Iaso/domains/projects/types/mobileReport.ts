export type MobileReport = {
    id: number;
    name: string;
    project: number;
    published_version: string;
    published_version_id: number;
    url: string | null;
    status: 'published' | 'unpublished';
    created_at: string;
    updated_at: string;
};

export type MobileReportVersion = {
    id: number;
    name: string;
    status: 'published' | 'unpublished';
    url: string | null;
    file_size: number | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
};
