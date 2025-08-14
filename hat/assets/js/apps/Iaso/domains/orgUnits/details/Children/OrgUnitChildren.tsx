import React, { FunctionComponent, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import DownloadButtonsComponent from '../../../../components/DownloadButtonsComponent';
import { OU_CHILDREN_PREFIX } from '../../../../constants/urls';
import { GroupDropdownOption } from '../../configuration/types';
import { useGetOrgUnitChildren } from '../../hooks/requests/useGetOrgUnitChildren';
import MESSAGES from '../../messages';
import { OrgUnitChildrenFilters } from './OrgUnitChildrenFilters';
import { OrgUnitChildrenTable } from './OrgUnitChildrenTable';
import { useOrgUnitChildrenQueryString } from './useOrgUnitChildrenQueryString';

const apiUrl = '/api/orgunits';

type Props = {
    params: any;
    baseUrl: string;
    groups?: GroupDropdownOption[];
};

export const OrgUnitChildren: FunctionComponent<Props> = ({
    params,
    baseUrl,
    groups,
}) => {
    const { formatMessage } = useSafeIntl();
    // Add deafult value "all" for validation status
    const paramsWithDefaultValue = useMemo(() => {
        const copy = { ...params };
        if (params[`${OU_CHILDREN_PREFIX}Validation_status`] === undefined) {
            copy[`${OU_CHILDREN_PREFIX}Validation_status`] = 'all';
        }
        return copy;
    }, [params]);
    // Generate the queryString here so it can be used for the download urls
    const queryString = useOrgUnitChildrenQueryString(paramsWithDefaultValue);
    const { data, isFetching: loading } = useGetOrgUnitChildren(queryString);
    const csvUrl = `${apiUrl}/?${queryString}&csv=true`;
    const xlsxUrl = `${apiUrl}/?${queryString}&xlsx=true`;
    const gpkgUrl = `${apiUrl}/?${queryString}&gpkg=true`;

    return (
        <>
            <OrgUnitChildrenFilters
                baseUrl={baseUrl}
                params={paramsWithDefaultValue}
                groups={groups}
            />
            {Boolean(data?.orgunits?.length) && (
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
                    <Button
                        variant="outlined"
                        color="primary"
                        target="_blank"
                        sx={{ ml: theme => theme.spacing(1) }}
                        href={`/dashboard/${baseUrls.orgUnitDetails}/orgUnitId/0/parentOrgUnitId/${params.orgUnitId}`}
                    >
                        {formatMessage(MESSAGES.addChild)}
                    </Button>
                </Box>
            )}
            <OrgUnitChildrenTable
                baseUrl={baseUrl}
                params={paramsWithDefaultValue}
                paramsPrefix={OU_CHILDREN_PREFIX}
                data={data}
                loading={loading}
            />
        </>
    );
};
