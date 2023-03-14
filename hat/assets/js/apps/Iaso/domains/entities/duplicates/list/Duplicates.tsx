import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { Box, makeStyles } from '@material-ui/core';
import { PaginationParams } from '../../../../types/general';
import MESSAGES from '../messages';
import TopBar from '../../../../components/nav/TopBarComponent';
import {
    DuplicatesGETParams,
    useGetDuplicates,
} from '../hooks/api/useGetDuplicates';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { redirectTo } from '../../../../routing/actions';
import { baseUrls } from '../../../../constants/urls';
import { DuplicatesFilters } from './DuplicatesFilters';
import { starsStyleForTable } from '../../../../components/stars/StarsComponent';
import { useDuplicationTableColumns } from './useDuplicationTableColumns';
import { DuplicatesList } from '../types';

type Params = PaginationParams & DuplicatesGETParams;

type Props = {
    params: Params;
};
const baseUrl = baseUrls.entityDuplicates;

const defaultSorted = [{ id: 'similarity_star', desc: true }];

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        ...starsStyleForTable,
    };
});

export const Duplicates: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data, isFetching } = useGetDuplicates({ params });
    const dispatch = useDispatch();
    const columns = useDuplicationTableColumns();
    const { results, pages, count } = (data as DuplicatesList) ?? {
        results: [],
        pages: 1,
        count: 0,
    };

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.duplicates)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <DuplicatesFilters params={params} />
                <Box className={classes.table}>
                    <TableWithDeepLink
                        marginTop={false}
                        data={results}
                        pages={pages}
                        defaultSorted={defaultSorted}
                        columns={columns}
                        count={count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        extraProps={{ loading: isFetching }}
                        onTableParamsChange={p =>
                            dispatch(redirectTo(baseUrl, p))
                        }
                    />
                </Box>
            </Box>
        </>
    );
};
