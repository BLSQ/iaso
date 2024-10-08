import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { Dispatch, FunctionComponent, SetStateAction } from 'react';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { OrgUnit } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { baseUrls } from '../../../constants/urls';
import { OrgUnitListChildren, RegistryParams } from '../../../types';
import { HEIGHT, useGetOrgUnitsListColumns } from '../config';

type Props = {
    params: RegistryParams;
    orgUnitChildren?: OrgUnitListChildren;
    isFetchingChildren: boolean;
    setSelectedChildren: Dispatch<SetStateAction<OrgUnit | undefined>>;
    selectedChildrenId: string | undefined;
};
export const defaultSorted = [{ id: 'name', desc: true }];
const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '& .MuiTableContainer-root': {
            maxHeight: `calc(${HEIGHT} - 120px)`, // to fit with map height
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
    setSelectedChildren,
    selectedChildrenId,
}) => {
    const classes: Record<string, string> = useStyles();
    const columns = useGetOrgUnitsListColumns(
        setSelectedChildren,
        selectedChildrenId,
    );
    return (
        <Box className={classes.root}>
            <TableWithDeepLink
                marginTop={false}
                marginBottom={false}
                data={orgUnitChildren?.orgunits || []}
                pages={orgUnitChildren?.pages || 0}
                defaultSorted={defaultSorted}
                paramsPrefix="orgUnitList"
                columns={columns}
                count={orgUnitChildren?.count || 0}
                baseUrl={baseUrls.registry}
                params={params}
                extraProps={{
                    loading: isFetchingChildren,
                    selectedChildrenId,
                    params,
                }}
                elevation={0}
            />
        </Box>
    );
};
