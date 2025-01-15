import { Column, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TableWithDeepLink } from '../../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { getPrefixedParams } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/common';
import { baseUrls } from '../../../../constants/urls';
import { VaccineRepositoryParams } from '../types';
import { Filters } from './Filters';
import {
    tableDefaults,
    useGetVaccineRepositoryReports,
} from './hooks/useGetVaccineRepositoryReports';
import { useVaccineRepositoryReportsColumns } from './hooks/useVaccineRepositoryReportsColumns';
import ColorLegend from '../components/ColorLegend';
import { MESSAGES as REPOSITORY_MESSAGES } from '../messages';
import { NO_PDF_COLOR, WITH_PDF_COLOR } from '../constants';

type Props = {
    params: VaccineRepositoryParams;
};

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

const NOPADDING_CELLS_IDS = ['incident_report_data', 'destruction_report_data'];

const getCellProps = cell => {
    const { id } = cell.column as Column;
    return {
        style: {
            padding: NOPADDING_CELLS_IDS.includes(id as string) ? 0 : undefined,
            verticalAlign: 'top',
        },
    };
};
export const Reports: FunctionComponent<Props> = ({ params }) => {
    const reportParams = useMemo(
        () => getPrefixedParams('report', params),
        [params],
    );
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const redirectUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;

    const { data, isFetching } = useGetVaccineRepositoryReports(reportParams);
    const columns = useVaccineRepositoryReportsColumns(reportParams);

    const { formatMessage } = useSafeIntl();
    const legendItems = [
        {
            label: formatMessage(REPOSITORY_MESSAGES.noPdf),
            color: NO_PDF_COLOR,
        },
        {
            label: formatMessage(REPOSITORY_MESSAGES.withPdf),
            color: WITH_PDF_COLOR,
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
                paramsPrefix="report"
                params={params}
                cellProps={getCellProps}
                extraProps={{
                    loading: isFetching,
                    defaultPageSize: tableDefaults.limit,
                    columns,
                }}
            />
        </>
    );
};
