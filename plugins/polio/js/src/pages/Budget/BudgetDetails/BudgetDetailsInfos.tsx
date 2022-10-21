import {
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import WidgetPaperComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../../constants/messages';

type Props = {
    status: string;
    nextSteps: string[];
};
const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
    noBottom: { borderBottom: 0 },
}));

export const BudgetDetailsInfos: FunctionComponent<Props> = ({
    status = '--',
    nextSteps = [],
}) => {
    const { formatMessage } = useSafeIntl();
    // filtering out repeat steps
    const [firstStep, ...steps] = useMemo(
        () => nextSteps.filter(step => !step.includes('repeat')),
        [nextSteps],
    );
    const classes = useStyles();
    return (
        <WidgetPaperComponent title={formatMessage(MESSAGES.budgetStatus)}>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell className={classes.leftCell}>
                            {formatMessage(MESSAGES.status)}
                        </TableCell>
                        <TableCell>{status}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell
                            className={classnames(
                                classes.leftCell,
                                classes.noBottom,
                            )}
                        >
                            {formatMessage(MESSAGES.nextSteps)}
                        </TableCell>
                        <TableCell>{firstStep}</TableCell>
                    </TableRow>
                    {steps?.length > 0 &&
                        steps.map(step => (
                            <TableRow key={step}>
                                <TableCell
                                    className={classnames(
                                        classes.leftCell,
                                        classes.noBottom,
                                    )}
                                />
                                <TableCell>{step}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </WidgetPaperComponent>
    );
};
