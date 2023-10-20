/* eslint-disable camelcase */
import { UrlParams } from 'bluesquare-components';

export type Module = {
    id: number;
    name: string;
    status: boolean;
};
export type ModulesFilterParams = {
    name?: string;
};

export type ModuleParams = UrlParams &
    ModulesFilterParams & {
        select?: (
            // eslint-disable-next-line no-unused-vars
            data: Array<Module>,
        ) => Array<any>;
    };
