import { Box, Typography } from '@mui/material';
import {
    Column,
    MENU_HEIGHT_WITHOUT_TABS,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { baseUrls } from '../../../constants/urls';
import {
    tableDefaults,
    useGetVaccineReporting,
} from './hooks/useGetVaccineReporting';
import { useVaccineRepositoryColumns } from './hooks/useVaccineRepositoryColumns';
import MESSAGES from './messages';
import { VaccineRepositoryParams } from './types';
import { VaccineRepositoryFilters } from './VaccineRepositoryFilters';
import { OffLineLangSwitch } from '../../../../../../../hat/assets/js/apps/Iaso/domains/home/components/LangSwitch';

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

const styles: SxStyles = {
    container: {
        width: '100%',
        padding: {
            xs: 2,
            md: 4,
        },
        margin: 0,
        overflow: 'auto',
        backgroundColor: 'white',
        // '& td': { padding: 0 },
    },
};
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

// Campaigns status filter should be on another ticket with better specs
// What about the colors, what does green says ?
// Which dates should we take (start date, end date, creation date, upload date)
// What about the rounds (count type or count number)
// Which campaigns are displayed ? All ? Or only the ones with a VRF ?

export const VaccineRepository: FunctionComponent = () => {
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const redirectUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;
    const params = useParamsObject(
        redirectUrl,
    ) as unknown as VaccineRepositoryParams;
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetVaccineReporting(params);
    const columns = useVaccineRepositoryColumns();

    return (
        <>
            {!isEmbedded && (
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton={false}
                />
            )}
            <Box
                sx={styles.container}
                height={
                    isEmbedded
                        ? '100vh'
                        : `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`
                }
            >
                {isEmbedded && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                            {formatMessage(MESSAGES.title)}
                        </Typography>
                        <Box sx={{ display: 'flex' }} mt={1}>
                            <OffLineLangSwitch />
                        </Box>
                    </Box>
                )}
                <VaccineRepositoryFilters
                    params={params}
                    redirectUrl={redirectUrl}
                />
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
            </Box>
        </>
    );
};
