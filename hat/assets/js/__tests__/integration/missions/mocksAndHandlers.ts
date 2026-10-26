import { delay, http, HttpResponse, type RequestHandlerOptions } from 'msw';

import { FormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';

import { OrgUnitTypeDropdownOption } from 'Iaso/domains/orgUnits/configuration/types';

// handlers
const formOptionsMock = {
    forms: [
        { name: 'Form A', id: 1 },
        { name: 'Form B', id: 2 },
        { name: 'Form C', id: 3 },
    ],
};

export const getCustomFormOptionsMockHandler = (
    overrideResponse?:
        | FormsDropdownOptions[]
        | ((
              info: Parameters<Parameters<typeof http.get>[1]>[0],
          ) => Promise<FormsDropdownOptions[]> | FormsDropdownOptions[]),
    options?: RequestHandlerOptions,
) => {
    return http.get(
        '*/api/forms/',
        async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
            await delay(
                (() =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0)(),
            );

            return HttpResponse.json(
                overrideResponse !== undefined
                    ? typeof overrideResponse === 'function'
                        ? await overrideResponse(info)
                        : overrideResponse
                    : formOptionsMock,
                { status: 200 },
            );
        },
        options,
    );
};

const orgUnitTypesMock = [
    { id: 1, name: 'OUT 1' },
    { id: 2, name: 'OUT 2' },
    { id: 3, name: 'OUT 3' },
];

export const getCustomOUTOptionsMockHandler = (
    overrideResponse?:
        | OrgUnitTypeDropdownOption[]
        | ((
              info: Parameters<Parameters<typeof http.get>[1]>[0],
          ) =>
              | Promise<OrgUnitTypeDropdownOption[]>
              | OrgUnitTypeDropdownOption[]),
    options?: RequestHandlerOptions,
) => {
    return http.get(
        '*/api/v2/orgunittypes/dropdown/',
        async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
            await delay(
                (() =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0)(),
            );

            return HttpResponse.json(
                overrideResponse !== undefined
                    ? typeof overrideResponse === 'function'
                        ? await overrideResponse(info)
                        : overrideResponse
                    : orgUnitTypesMock,
                { status: 200 },
            );
        },
        options,
    );
};

type EntityType = {
    id: number;
    name: string;
};

const entityTypesMock = [
    { id: 1, name: 'ET 1' },
    { id: 2, name: 'ET 2' },
    { id: 3, name: 'ET 3' },
];

export const getCustomEntityTypeOptionsMockHandler = (
    overrideResponse?:
        | EntityType[]
        | ((
              info: Parameters<Parameters<typeof http.get>[1]>[0],
          ) => Promise<EntityType[]> | EntityType[]),
    options?: RequestHandlerOptions,
) => {
    return http.get(
        '*/api/entitytypes/',
        async (info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
            await delay(
                (() =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0)(),
            );

            return HttpResponse.json(
                overrideResponse !== undefined
                    ? typeof overrideResponse === 'function'
                        ? await overrideResponse(info)
                        : overrideResponse
                    : entityTypesMock,
                { status: 200 },
            );
        },
        options,
    );
};

export const getApiNotificationMockHandler = (
    options?: RequestHandlerOptions,
) => {
    return http.get(
        '*/api/notifications/',
        async (_info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
            await delay(
                (() =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0)(),
            );

            return HttpResponse.json([], { status: 200 });
        },
        options,
    );
};
