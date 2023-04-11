/* eslint-disable react/require-default-props */
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Box,
    Button,
} from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import CircularProgress from '@material-ui/core/CircularProgress';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import MESSAGES from '../messages';

import { useGetOrgUnitType } from '../hooks/useGetOrgUnitType';
import { baseUrls } from '../../../constants/urls';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
        width: 150,
    },
}));

type Props = {
    orgUnit: OrgUnit;
    accountId: string;
};
export const OrgUnitInfos: FunctionComponent<Props> = ({
    orgUnit,
    accountId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: orgUnitType, isFetching } = useGetOrgUnitType(
        orgUnit.org_unit_type_id,
    );
    return (
        <>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.leftCell}>Id</TableCell>
                        <TableCell>{orgUnit.id}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.name)}
                        </TableCell>
                        <TableCell>{orgUnit.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.type)}
                        </TableCell>
                        <TableCell>
                            {isFetching && <CircularProgress size={15} />}
                            {!isFetching && orgUnitType?.name}
                            {!orgUnitType && orgUnit.org_unit_type_name}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.status)}
                        </TableCell>
                        <TableCell>
                            {MESSAGES[orgUnit.validation_status]
                                ? formatMessage(
                                      MESSAGES[orgUnit.validation_status],
                                  )
                                : '--'}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Box p={2} display="flex" justifyContent="flex-end">
                <Button
                    data-test="csv-export-button"
                    variant="contained"
                    color="primary"
                    href={`/dashboard/${baseUrls.registryDetail}/accountId/${accountId}/orgUnitId/${orgUnit.id}`}
                >
                    {formatMessage(MESSAGES.seeRegistry)}
                </Button>
            </Box>
        </>
    );
};
