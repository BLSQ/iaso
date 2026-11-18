import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { PiiRestrictedBanner } from 'Iaso/components/PiiRestrictedBanner';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../constants/urls';
import { BeneficiaryFilters } from './components/BeneficiaryFilters';
import { Exports } from './components/Exports';
import { TableList, DEFAULT_PAGE_SIZE } from './components/TableList';
import MESSAGES from './messages';
import { useGetBeneficiaries } from './requests';
import { Params, Filters } from './types';

const baseUrl = baseUrls.wfpBeneficiaries;

const styles = { root: { padding: 4 } };

export const Beneficiaries: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as Params;
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetBeneficiaries({
        pageSize: `${DEFAULT_PAGE_SIZE}`,
        ...params,
    });
    // The exports use the filters of the list, as searched (not as being edited)
    const searched: Filters = useMemo(
        () => ({
            entity_type: params.entity_type,
            programme: params.programme,
            org_unit_group: params.org_unit_group,
            facility: params.facility,
            q: params.q,
            visit_date_after: params.visit_date_after,
            visit_date_before: params.visit_date_before,
        }),
        [
            params.entity_type,
            params.programme,
            params.org_unit_group,
            params.facility,
            params.q,
            params.visit_date_after,
            params.visit_date_before,
        ],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.beneficiaryExport)}
                displayBackButton={false}
            />
            <MainWrapper sx={styles.root}>
                <PiiRestrictedBanner sx={{ mb: 2 }} />
                <BeneficiaryFilters params={params} />
                <Exports filters={searched} disabled={isFetching} />
                <TableList data={data} loading={isFetching} params={params} />
            </MainWrapper>
        </>
    );
};
