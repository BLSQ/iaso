import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';

import {
    InfoHeader,
    NumberInput,
    formatThousand,
    useSafeIntl,
} from 'bluesquare-components';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../messages';
import { BudgetDetail, Round } from '../types';

type DataForBudget = {
    cost: number;
    population: number;
    calculateRound: boolean;
    costRoundPerChild: string;
};

const getRoundData = (round: Round): DataForBudget => {
    const cost = parseFloat(round.cost);
    const population = round.target_population ?? 0;
    const calculateRound = cost > 0 && population > 0;
    return {
        cost,
        population,
        calculateRound: cost > 0 && population > 0,
        costRoundPerChild: calculateRound
            ? (cost / population).toFixed(2)
            : '0',
    };
};

const styles: SxStyles = {
    table: {
        marginLeft: theme => theme.spacing(1),
    },
    header: {
        fontWeight: 'bold',
        '&>div': {
            justifyContent: 'flex-start',
        },
    },
    headerCost: {
        fontWeight: 'bold',
        width: 150,
    },
    costInput: {
        '& input': {
            padding: theme => theme.spacing(0.5),
        },
    },
    total: {
        fontWeight: 'bold',
    },
    totalTitle: {
        fontWeight: 'bold',
        textAlign: 'right',
    },
    noRounds: {
        textAlign: 'center',
    },
};

const currency = '$';
const placeholder = '--';

export const BudgetProcessCostPerChild: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds },
        setFieldValue,
    } = useFormikContext<BudgetDetail>();
    const handleCostChange = useCallback(
        (index: number, newValue: number) => {
            const updatedRounds = rounds ? [...rounds] : [];
            updatedRounds[index] = {
                ...updatedRounds[index],
                cost: `${newValue}`,
            };
            setFieldValue('rounds', updatedRounds);
        },
        [setFieldValue, rounds],
    );
    const totalCostPerChild: string = useMemo(() => {
        let totalCost = 0;
        let totalPopulation = 0;
        if (!rounds) return placeholder;
        rounds.forEach(r => {
            const roundData = getRoundData(r);
            totalCost += roundData.calculateRound ? roundData.cost : 0;
            totalPopulation += roundData.calculateRound
                ? roundData.population
                : 0;
        });
        return totalPopulation
            ? `${currency}${(totalCost / totalPopulation).toFixed(2)}`
            : placeholder;
    }, [rounds]);
    return (
        <Table size="small" sx={styles.table}>
            <TableHead>
                <TableRow>
                    <TableCell sx={styles.header}>
                        {formatMessage(MESSAGES.roundNumber)}
                    </TableCell>
                    <TableCell sx={styles.headerCost}>
                        {formatMessage(MESSAGES.cost)}
                    </TableCell>
                    <TableCell sx={styles.header}>
                        <InfoHeader
                            message={formatMessage(
                                MESSAGES.targetPopulationMessage,
                            )}
                        >
                            {formatMessage(MESSAGES.targetPopulation)}
                        </InfoHeader>
                    </TableCell>
                    <TableCell sx={styles.header}>
                        {formatMessage(MESSAGES.costPerChild)}
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {(!rounds || rounds?.length) === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} sx={styles.noRounds}>
                            {formatMessage(MESSAGES.noRounds)}
                        </TableCell>
                    </TableRow>
                )}
                {rounds?.map((round, i) => {
                    const roundData = getRoundData(round);
                    return (
                        <TableRow key={round.number}>
                            <TableCell>{round.number}</TableCell>
                            <TableCell sx={styles.costInput}>
                                <Field
                                    component={NumberInput}
                                    name={`rounds[${i}].cost`}
                                    value={rounds[i].cost}
                                    onChange={newValue =>
                                        handleCostChange(i, newValue)
                                    }
                                    prefix={currency}
                                />
                            </TableCell>
                            <TableCell>
                                {round.target_population
                                    ? formatThousand(round.target_population)
                                    : placeholder}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {roundData.calculateRound
                                        ? `${currency}${roundData.costRoundPerChild}`
                                        : ` ${placeholder}`}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    );
                })}
                <TableRow>
                    <TableCell colSpan={2} />
                    <TableCell sx={styles.totalTitle}>
                        {formatMessage(MESSAGES.costPerChildTotal)}:
                    </TableCell>
                    <TableCell sx={styles.total}>{totalCostPerChild}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};
