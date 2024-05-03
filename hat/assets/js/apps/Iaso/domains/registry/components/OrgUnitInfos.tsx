/* eslint-disable react/require-default-props */
import { Table, TableBody, TableRow, TableCell, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import CircularProgress from '@mui/material/CircularProgress';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import MESSAGES from '../messages';

import { useGetOrgUnitType } from '../hooks/useGetOrgUnitType';
import { baseUrls } from '../../../constants/urls';
import { LinkButton } from '../../../components/nav/LinkButton';

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
                </TableBody>
            </Table>
            <Box p={2} display="flex" justifyContent="flex-end">
                <LinkButton
                    to={`/${baseUrls.registryDetail}/accountId/${accountId}/orgUnitId/${orgUnit.id}`}
                    data-test="see-registry-button"
                >
                    {formatMessage(MESSAGES.seeRegistry)}
                </LinkButton>
            </Box>
        </>
    );
};
