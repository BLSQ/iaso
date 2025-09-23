import React, { FunctionComponent, useState } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import PageError from 'Iaso/components/errors/PageError';
import { DjangoError } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';

import { useColumns } from './config';
import { useGetPipelines } from './hooks/useGetPipelines';
import { MESSAGES } from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.pipelineList;
export const PipelineList: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [error, setError] = useState<DjangoError | null>(null);
    const { data, isFetching } = useGetPipelines(setError);
    const defaultSorted = [{ id: 'id', desc: true }];

    const columns = useColumns();

    return (
        <>
            {error && (
                <Box>
                    <PageError
                        errorCode={`${error.status}`}
                        displayMenuButton
                        customMessage={error.details.error}
                    />
                </Box>
            )}
            {!error && (
                <>
                    <TopBar
                        title={formatMessage(MESSAGES.pipelines)}
                        displayBackButton={false}
                    />
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        {/* @ts-ignore */}
                        <TableWithDeepLink
                            baseUrl={baseUrl}
                            data={data ?? []}
                            pages={1}
                            showPagination={false}
                            defaultSorted={defaultSorted}
                            columns={columns}
                            count={data?.length ?? 0}
                            params={{}}
                            extraProps={{ loading: isFetching }}
                        />
                    </Box>
                </>
            )}
        </>
    );
};
