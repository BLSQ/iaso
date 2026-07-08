import { UrlParams } from 'bluesquare-components';

export type InstanceValidationParams = {
    accountId: string;
    instanceId: string;
    selectedStep?: string;
} & Partial<UrlParams>;
