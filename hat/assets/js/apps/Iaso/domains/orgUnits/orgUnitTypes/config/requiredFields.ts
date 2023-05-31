type RequiredFields = {
    type: string;
    key: string;
};
export const requiredFields: RequiredFields[] = [
    {
        type: 'string',
        key: 'name',
    },
    {
        type: 'string',
        key: 'short_name',
    },
    {
        type: 'string',
        key: 'depth',
    },
    {
        type: 'array',
        key: 'project_ids',
    },
];
