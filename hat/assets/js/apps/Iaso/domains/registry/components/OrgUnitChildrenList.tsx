import React, { FunctionComponent } from 'react';
import { Table } from 'bluesquare-components';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { RegistryDetailParams } from '../types';
import { useGetOrgUnitsListColumns } from '../config';
import { OrgUnitListChildren } from '../hooks/useGetOrgUnit';

type Props = {
    params: RegistryDetailParams;
    orgUnitChildren?: OrgUnitListChildren;
    isFetchingChildren: boolean;
};
export const defaultSorted = [{ id: 'name', desc: true }];
const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '& .MuiTableContainer-root': {
            maxHeight: 444, // to fit with map height
            overflow: 'auto',
            // @ts-ignore
            borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        },
        '& .pagination-count': {
            position: 'absolute',
            top: -50,
            right: theme.spacing(2),
        },
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        '& .MuiTablePagination-toolbar': {
            paddingLeft: 2,
        },
        '& .MuiTableCell-sizeSmall:last-child': {
            padding: '3px 0',
        },
    },
}));

export const OrgUnitChildrenList: FunctionComponent<Props> = ({
    params,
    orgUnitChildren,
    isFetchingChildren,
}) => {
    const dispatch = useDispatch();

    const classes: Record<string, string> = useStyles();
    const columns = useGetOrgUnitsListColumns();
    return (
        <Box className={classes.root}>
            <Table
                marginTop={false}
                marginBottom={false}
                data={orgUnitChildren?.orgunits || []}
                pages={orgUnitChildren?.pages || 0}
                defaultSorted={defaultSorted}
                paramsPrefix="orgUnitList"
                columns={columns}
                count={orgUnitChildren?.count || 0}
                baseUrl={baseUrls.registryDetail}
                params={params}
                extraProps={{ loading: isFetchingChildren }}
                elevation={0}
                onTableParamsChange={p => {
                    dispatch(redirectToReplace(baseUrls.registryDetail, p));
                }}
            />
        </Box>
    );
};
