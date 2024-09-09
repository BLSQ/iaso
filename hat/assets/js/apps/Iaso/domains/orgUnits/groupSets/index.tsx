import React from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    Table,
    AddButton,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';
import {Filters} from './components/Filters';
import { useGroupSetsTableColumns } from './config';
import MESSAGES from './messages';
import { useGetGroupSets } from './hooks/requests';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const baseUrl = baseUrls.groupSets;
const GroupSets = () => {
    const params = useParamsObject(baseUrl);
    const redirectTo = useRedirectTo();
    const classes = useStyles();
    const tableColumns = useGroupSetsTableColumns();
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetGroupSets(params);

    const isLoading = isFetching;
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.groupSets)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />

                {tableColumns && (
                    <Table
                        data={data?.group_sets ?? []}
                        pages={data?.pages ?? 1}
                        defaultSorted={[{ id: 'name', desc: false }]}
                        columns={tableColumns}
                        count={data?.count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={(_, newParams) =>
                            redirectTo(baseUrl, newParams)
                        }
                        marginTop={false}
                    />
                )}
            </Box>
        </>
    );
};

export default GroupSets;
