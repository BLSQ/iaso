import React, { FunctionComponent, useState } from 'react';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { PaginatedResponse } from 'Iaso/domains/app/types';
import { baseUrls } from '../../../constants/urls';
import { useColumns } from '../config';
import MESSAGES from './../messages';
import { Params, Beneficiary } from './../types';
import { BeneficiaryDialog } from './details/BeneficiaryDialog';
import { JourneysDetails } from './journeys/JourneysDetails';

export const DEFAULT_PAGE_SIZE = 20;
const defaultSorted = [{ id: 'last_visit_date', desc: true }];

type Props = {
    data?: PaginatedResponse<Beneficiary>;
    loading: boolean;
    params: Params;
};

export const TableList: FunctionComponent<Props> = ({
    data,
    loading,
    params,
}) => {
    const [dataEntityId, setDataEntityId] = useState<number | undefined>();
    const columns = useColumns(params.accountId, setDataEntityId);
    return (
        <>
            <TableWithDeepLink
                baseUrl={baseUrls.wfpBeneficiaries}
                data={data?.results ?? []}
                pages={data?.pages ?? 1}
                count={data?.count ?? 0}
                defaultSorted={defaultSorted}
                columns={columns}
                params={params}
                noDataMessage={MESSAGES.noBeneficiaries}
                extraProps={{
                    loading,
                    defaultPageSize: DEFAULT_PAGE_SIZE,
                    SubComponent: JourneysDetails,
                }}
            />
            <BeneficiaryDialog
                entityId={dataEntityId}
                onClose={() => setDataEntityId(undefined)}
            />
        </>
    );
};
