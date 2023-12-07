import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';

import { useStyles } from '../../styles/theme';

import MESSAGES from './messages';
import { NotificationsFilters } from './Filters/NotificationsFilters';
import { NotificationsParams } from './types';
import { NotificationsTable } from './Table/NotificationsTable';
import { getNotificationsDropdownsContent } from './hooks/api';

type Props = { router: Router };

export const Notifications: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { data: dropdownContent, isFetching: isFetchingdropdownContent } =
        getNotificationsDropdownsContent();
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
            {isFetchingdropdownContent && <LoadingSpinner />}
            {!isFetchingdropdownContent && (
                <>
                    <TopBar
                        title={formatMessage(MESSAGES.notificationsTitle)}
                        displayBackButton={false}
                    />
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <NotificationsFilters
                            params={paramsNew}
                            dropdownContent={dropdownContent}
                        />
                        <NotificationsTable
                            params={paramsNew}
                            dropdownContent={dropdownContent}
                        />
                    </Box>
                </>
            )}
        </>
    );
};
