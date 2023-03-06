import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import classNames from 'classnames';
import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { useArrayState } from '../../../hooks/useArrayState';
import { useObjectState } from '../../../hooks/useObjectState';
import { redirectTo } from '../../../routing/actions';
import { useDuplicationDetailsColumns } from './hooks/useDuplicationDetailsColumns';
import { useGetDuplicateDetails } from './hooks/useGetDuplicates';

type Props = {
    params: { accountId?: string; entities: string };
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        diffCell: {
            '& td:has(.diff)': {
                backgroundColor: '#FFEB99',
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
            },
        },
        droppedCell: {
            '& td:has(.dropped)': {
                backgroundColor: theme.palette.error.background,
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                color: 'rgba(0,0,0,0.6)',
            },
        },
        selectedCell: {
            '& td:has(.selected)': {
                backgroundColor: theme.palette.success.background,
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                fontWeight: 'bold',
            },
        },
    };
});

export const DuplicateDetails: FunctionComponent<Props> = ({ params }) => {
    const [tableState, setTableState] = useArrayState([]);
    const [query, setQuery] = useObjectState();
    console.log('query', query);
    const classes: Record<string, string> = useStyles();
    // TODO params as array, since comma is modified
    const { data: entities, isFetching } = useGetDuplicateDetails({
        params,
    });
    const dispatch = useDispatch();
    const columns = useDuplicationDetailsColumns({
        state: tableState,
        setState: setTableState,
        setQuery,
    });
    useEffect(() => {
        if (tableState.length === 0 && entities) {
            setTableState({ index: 'all', value: entities });
        }
    }, [entities, setTableState, tableState.length]);
    return (
        <Box
            className={classNames(
                classes.diffCell,
                classes.droppedCell,
                classes.selectedCell,
                classes.containerFullHeightNoTabPadded,
            )}
        >
            <TableWithDeepLink
                showPagination={false}
                baseUrl={baseUrls.entityDuplicateDetails}
                columns={columns}
                marginTop={false}
                data={tableState}
                // defaultSorted={}
                params={params}
                extraProps={{ loading: isFetching }}
                onTableParamsChange={p =>
                    dispatch(redirectTo(baseUrls.entityDuplicateDetails, p))
                }
            />
        </Box>
    );
};
