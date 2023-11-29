import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from './messages';
import { NotificationsFilters } from './Filters/NotificationsFilters';
import { useStyles } from '../../styles/theme';
import { NotificationsParams } from './types';
import { NotificationsTable } from './Table/NotificationsTable';

type Props = { router: Router };

export const Notifications: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const newParams: NotificationsParams = {
        ...params,
        limit: params.limit || '20',
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
