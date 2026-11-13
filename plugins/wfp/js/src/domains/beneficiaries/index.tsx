import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../constants/urls';
import { useGetBeneficiaries } from './requests';
import { TableList, DEFAULT_PAGE_SIZE } from './components/TableList';
import { Exports } from './components/Exports';
import { BeneficiaryFilters } from './components/BeneficiaryFilters';
import MESSAGES from './messages';
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
            q: params.q,
        }),
        [params.entity_type, params.programme, params.org_unit_group, params.q],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.entities)}
                displayBackButton={false}
            />
            <MainWrapper sx={styles.root}>
                <BeneficiaryFilters params={params} />
                <Exports filters={searched} disabled={isFetching} />
                <TableList data={data} loading={isFetching} params={params} />
            </MainWrapper>
        </>
    );
};
