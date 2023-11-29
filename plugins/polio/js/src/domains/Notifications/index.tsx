import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@material-ui/core';

import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';

import { useStyles } from '../../styles/theme';

import MESSAGES from './messages';
import { NotificationsFilters } from './Filters/NotificationsFilters';
import { NotificationsParams } from './types';
import { NotificationsTable } from './Table/NotificationsTable';

type Props = { router: Router };

export const Notifications: FunctionComponent<Props> = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const newParams: NotificationsParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.notificationsTitle)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <NotificationsFilters params={newParams} />
                <NotificationsTable params={newParams} />
            </Box>
        </>
    );
};
