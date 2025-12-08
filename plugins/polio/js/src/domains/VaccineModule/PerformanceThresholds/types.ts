export type PerformanceThreshold = {
    id: number;
    indicator: string;
    success_threshold: Record<string, string>; // JSON Logic
    warning_threshold: Record<string, string>; // JSON Logic
    fail_threshold: Record<string, string>; // JSON Logic
    created_at: string;
    updated_at: string;
};
