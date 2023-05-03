import React, { FunctionComponent } from 'react';
import { Table } from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import { useDispatch } from 'react-redux';

import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { RegistryDetailParams } from '../types';

import { useGetOrgUnitsListChildren } from '../hooks/useGetOrgUnit';
import { useGetOrgUnitsListColumns } from '../config';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    params: RegistryDetailParams;
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
    orgUnit,
    subOrgUnitTypes,
    params,
}) => {
    const dispatch = useDispatch();
    const { data, isFetching } = useGetOrgUnitsListChildren(
        `${orgUnit.id}`,
        subOrgUnitTypes,
        params,
    );

    const classes: Record<string, string> = useStyles();
    const columns = useGetOrgUnitsListColumns();
    return (
        <Box className={classes.root}>
            <Table
                marginTop={false}
                marginBottom={false}
                data={data?.orgunits || []}
                pages={data?.pages || 0}
                defaultSorted={defaultSorted}
                paramsPrefix="orgUnitList"
                columns={columns}
                count={data?.count || 0}
                baseUrl={baseUrls.registryDetail}
                params={params}
                extraProps={{ loading: isFetching }}
                elevation={0}
                onTableParamsChange={p => {
                    dispatch(redirectToReplace(baseUrls.registryDetail, p));
                }}
            />
        </Box>
    );
};
