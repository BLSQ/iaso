import { useMemo } from 'react';
import { Column } from 'bluesquare-components';
import { DESTRUCTION, EARMARKED, FORM_A, INCIDENT } from '../constants';
import {
    useGetDestructionList,
    useGetEarmarkedList,
    useGetFormAList,
    useGetIncidentList,
} from '../hooks/api';
import {
    StockVariationPageKey,
    StockVariationParams,
    StockVariationSearchKey,
    StockVariationTab,
} from '../types';
import {
    useDestructionTableColumns,
    useEarmarkedTableColumns,
    useFormATableColumns,
    useIncidentTableColumns,
} from './Table/columns';

export type StockVariationTabConfig = {
    data: { results?: any[]; count?: number; pages?: number };
    columns?: Column[];
    isFetching: boolean;
    defaultSorted: { id: string; desc: boolean }[];
    search?: {
        searchKey: StockVariationSearchKey;
        pageKey: StockVariationPageKey;
    };
};

type Args = {
    params: StockVariationParams;
    tab: StockVariationTab;
    countryName?: string;
    vaccineType?: string;
};


export const useStockVariationTabConfig = ({
    params,
    tab,
    countryName,
    vaccineType,
}: Args): StockVariationTabConfig => {
    const { data: formA, isFetching: isFetchingFormA } = useGetFormAList(
        params,
        tab === FORM_A,
    );
    const { data: destructions, isFetching: isFetchingDestructions } =
        useGetDestructionList(params, tab === DESTRUCTION);
    const { data: incidents, isFetching: isFetchingIncidents } =
        useGetIncidentList(params, tab === INCIDENT);
    const { data: earmarked, isFetching: isFetchingEarmarked } =
        useGetEarmarkedList(params, tab === EARMARKED);

    const formAColumns = useFormATableColumns(countryName, vaccineType);
    const destructionsColumns = useDestructionTableColumns(
        countryName,
        vaccineType,
    );
    const incidentsColumns = useIncidentTableColumns(countryName, vaccineType);
    const earmarkedColumns = useEarmarkedTableColumns(countryName, vaccineType);

    const tabConfigs: Record<StockVariationTab, StockVariationTabConfig> =
        useMemo(
            () => ({
                [FORM_A]: {
                    data: formA,
                    columns: formAColumns,
                    isFetching: isFetchingFormA,
                    defaultSorted: [
                        { id: 'form_a_reception_date', desc: true },
                    ],
                    search: {
                        searchKey: 'formaSearch',
                        pageKey: 'formaPage',
                    },
                },
                [DESTRUCTION]: {
                    data: destructions,
                    columns: destructionsColumns,
                    isFetching: isFetchingDestructions,
                    defaultSorted: [
                        {
                            id: 'rrt_destruction_report_reception_date',
                            desc: true,
                        },
                    ],
                    search: {
                        searchKey: 'destructionSearch',
                        pageKey: 'destructionPage',
                    },
                },
                [INCIDENT]: {
                    data: incidents,
                    columns: incidentsColumns,
                    isFetching: isFetchingIncidents,
                    defaultSorted: [
                        { id: 'incident_report_received_by_rrt', desc: true },
                    ],
                    search: {
                        searchKey: 'incidentSearch',
                        pageKey: 'incidentPage',
                    },
                },
                // Earmarked is the only tab without a search box
                [EARMARKED]: {
                    data: earmarked,
                    columns: earmarkedColumns,
                    isFetching: isFetchingEarmarked,
                    defaultSorted: [{ id: 'created_at', desc: true }],
                },
            }),
            [
                destructions,
                destructionsColumns,
                earmarked,
                earmarkedColumns,
                formA,
                formAColumns,
                incidents,
                incidentsColumns,
                isFetchingDestructions,
                isFetchingEarmarked,
                isFetchingFormA,
                isFetchingIncidents,
            ],
        );

    return tabConfigs[tab];
};
