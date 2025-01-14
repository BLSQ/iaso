import { Column, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useLocation } from 'react-router-dom';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { getNonPrefixedParams } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/common';
import { baseUrls } from '../../../../constants/urls';
import { VaccineRepositoryParams } from '../types';
import { Filters } from './Filters';
import {
    tableDefaults,
    useGetVaccineReporting,
} from './hooks/useGetVaccineReporting';
import { useVaccineRepositoryColumns } from './hooks/useVaccineRepositoryColumns';
import ColorLegend from '../components/ColorLegend';
import { MESSAGES as REPOSITORY_MESSAGES } from '../messages';
import { FORMAISLATECOLOR, NOPDFCOLOR, WITHPDFCOLOR } from '../constants';

type Props = {
    params: VaccineRepositoryParams;
};

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

const NOPADDING_CELLS_IDS = ['vrf_data', 'pre_alert_data', 'form_a_data'];

const getCellProps = cell => {
    const { id } = cell.column as Column;
    return {
        style: {
            padding: NOPADDING_CELLS_IDS.includes(id as string) ? 0 : undefined,
            verticalAlign: 'top',
        },
    };
};

export const Forms: FunctionComponent<Props> = ({ params }) => {
    const location = useLocation();
    const formsParams = getNonPrefixedParams('report', params, ['accountId']);
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const redirectUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;
    const { data, isFetching } = useGetVaccineReporting(formsParams);
    const columns = useVaccineRepositoryColumns(formsParams);
    const { formatMessage } = useSafeIntl();

    const legendItems = [
        {
            label: formatMessage(REPOSITORY_MESSAGES.noPdf),
            color: NOPDFCOLOR,
        },
        {
            label: formatMessage(REPOSITORY_MESSAGES.withPdf),
            color: WITHPDFCOLOR,
        },
        {
            label: formatMessage(REPOSITORY_MESSAGES.formAisLate),
            color: FORMAISLATECOLOR,
        },
    ];
    return (
        <>
            <Filters params={params} redirectUrl={redirectUrl} />
            <ColorLegend legendItems={legendItems} />
            <TableWithDeepLink
                marginTop={false}
                data={data?.results ?? []}
                pages={data?.pages ?? 1}
                defaultSorted={[{ id: tableDefaults.order, desc: true }]}
                columns={columns}
                count={data?.count ?? 0}
                baseUrl={redirectUrl}
                countOnTop
                params={params}
                cellProps={getCellProps}
                extraProps={{
                    loading: isFetching,
                    defaultPageSize: tableDefaults.limit,
                }}
            />
        </>
    );
};
