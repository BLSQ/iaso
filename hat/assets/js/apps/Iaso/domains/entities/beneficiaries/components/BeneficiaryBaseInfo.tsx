/* eslint-disable react/require-default-props */
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { getAge } from '../../../../hooks/useGetAge';
import { Beneficiary } from '../types/beneficiary';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
    },
}));

type Props = {
    beneficiary?: Beneficiary;
};

export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.name)}
                        </TableCell>
                        <TableCell>
                            {beneficiary?.attributes?.file_content?.name ??
                                '--'}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.age)}
                        </TableCell>
                        <TableCell>
                            {getAge({
                                age: beneficiary?.attributes?.file_content?.age,
                                ageType:
                                    (beneficiary?.attributes?.file_content
                                        ?.age_type as '0' | '1') ?? '0',
                                birthDate:
                                    beneficiary?.attributes?.file_content
                                        ?.birth_date,
                            }) ?? '--'}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.gender)}
                        </TableCell>
                        <TableCell>
                            {beneficiary?.attributes?.file_content.gender ??
                                formatMessage(MESSAGES.unknown)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.uuid)}
                        </TableCell>
                        <TableCell>{beneficiary?.uuid ?? '--'}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
};
