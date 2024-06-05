import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { OrgUnitChildrenFilters } from './OrgUnitChildrenFilters';
import { OU_CHILDREN_PREFIX } from '../../../../constants/urls';
import { OrgUnitChildrenTable } from './OrgUnitChildrenTable';
import { GroupWithDataSource } from '../../types/orgUnit';
import { useGetOrgUnitChildren } from '../../hooks/requests/useGetOrgUnitChildren';
import DownloadButtonsComponent from '../../../../components/DownloadButtonsComponent';
import { useOrgUnitChildrenQueryString } from './useOrgUnitChildrenQueryString';

const apiUrl = '/api/orgunits';

type Props = {
    params: any;
    baseUrl: string;
    groups?: GroupWithDataSource[];
};

export const OrgUnitChildren: FunctionComponent<Props> = ({
    params,
    baseUrl,
    groups,
}) => {
    // Generate the queryString here so it can be used for the download urls
    const queryString = useOrgUnitChildrenQueryString(params);
    const { data, isFetching: loading } = useGetOrgUnitChildren(queryString);
    const csvUrl = `${apiUrl}/?${queryString}&csv=true`;
    const xlsxUrl = `${apiUrl}/?${queryString}&xlsx=true`;
    const gpkgUrl = `${apiUrl}/?${queryString}&gpkg=true`;
    return (
        <>
            <OrgUnitChildrenFilters
                baseUrl={baseUrl}
                params={params}
                groups={groups}
            />
            {data?.orgunits?.length && (
                <Box
                    mt={2}
                    display="inline-flex"
                    justifyContent="flex-end"
                    style={{ width: '100%' }}
                >
                    <DownloadButtonsComponent
                        csvUrl={csvUrl}
                        xlsxUrl={xlsxUrl}
                        gpkgUrl={gpkgUrl}
                        disabled={loading}
                    />
                </Box>
            )}
            <OrgUnitChildrenTable
                baseUrl={baseUrl}
                params={params}
                paramsPrefix={OU_CHILDREN_PREFIX}
                data={data}
                loading={loading}
            />
        </>
    );
};
