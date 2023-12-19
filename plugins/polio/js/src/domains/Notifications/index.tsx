import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';

import { useStyles } from '../../styles/theme';

import MESSAGES from './messages';
import { NotificationsFilters } from './Filters/NotificationsFilters';
import { NotificationsMetaData, NotificationsParams } from './types';
import { NotificationsTable } from './Table/NotificationsTable';
import { useOptionNotifications } from './hooks/api';

type Props = { router: Router };

export const Notifications: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { data: notificationsMetaData, isFetching: isFetchingMetaData } =
        useOptionNotifications();
    const { formatMessage } = useSafeIntl();
    const { params } = router;
    const paramsNew: NotificationsParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    return (
        <>
            {isFetchingMetaData && <LoadingSpinner />}
            {!isFetchingMetaData && (
                <>
                    <TopBar
                        title={formatMessage(MESSAGES.notificationsTitle)}
                        displayBackButton={false}
                    />
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <NotificationsFilters
                            params={paramsNew}
                            notificationsMetaData={
                                notificationsMetaData as NotificationsMetaData
                            }
                        />
                        <NotificationsTable
                            params={paramsNew}
                            notificationsMetaData={
                                notificationsMetaData as NotificationsMetaData
                            }
                        />
                    </Box>
                </>
            )}
        </>
    );
};
