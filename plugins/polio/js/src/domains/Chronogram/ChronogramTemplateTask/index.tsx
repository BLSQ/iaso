import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { useGoBack, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useStyles } from '../../../styles/theme';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from './messages';
import { ChronogramTemplateTaskParams } from './types';
import { ChronogramTemplateTaskTable } from './Table/ChronogramTemplateTaskTable';

export const ChronogramTemplateTask: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.chronogramTemplateTask,
    ) as ChronogramTemplateTaskParams;

    const paramsNew: ChronogramTemplateTaskParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(baseUrls.chronogram);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.chronogramTemplateTaskTitle)}
                displayBackButton={true}
                goBack={() => goBack()}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ChronogramTemplateTaskTable params={paramsNew} />
            </Box>
        </>
    );
};
