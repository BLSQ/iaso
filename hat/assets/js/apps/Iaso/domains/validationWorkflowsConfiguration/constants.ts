export const API_URL = '/api/validation-workflows/';
export const WF_BASE_QUERYKEY = 'submissions-workflows';

export const getNodeTemplatesUrl = (
    workflowSlug: string,
    nodeSlug?: string,
): string =>
    `${API_URL}${workflowSlug}/node-templates/${nodeSlug ? `${nodeSlug}/` : ''}`;
