import { Box } from '@mui/material';
import { MENU_HEIGHT_WITHOUT_TABS, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { baseUrls } from '../../../constants/urls';
import { useColumns } from './hooks/useColumns';
import {
    tableDefaults,
    useGetVaccineReporting,
} from './hooks/useGetVaccineReporting';
import MESSAGES from './messages';

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
    },
};

// Campaigns status filter should be on another ticket with better specs
// What about the colors, what does green says ?
// Which dates should we take (start date, end date, creation date, upload date)
// What about the rounds (count type or count number)
// Which campaigns are displayed ? All ? Or only the ones with a VRF ?

export const VaccineRepository: FunctionComponent = () => {
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const currentBaseUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;
    const params = useParamsObject(currentBaseUrl);
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetVaccineReporting();
    const columns = useColumns();

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
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: tableDefaults.order, desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={currentBaseUrl}
                    countOnTop
                    params={params}
                    extraProps={{
                        loading: isFetching,
                        defaultPageSize: tableDefaults.limit,
                    }}
                />
            </Box>
        </>
    );
};
