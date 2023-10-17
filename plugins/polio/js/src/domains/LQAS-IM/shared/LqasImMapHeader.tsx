import React, { FunctionComponent } from 'react';
import { Box, makeStyles, Divider, Grid, Typography } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import MESSAGES from '../../../constants/messages';
import { LqasImDates } from './LqasImDates';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';

export type LqasImRefDate = {
    date: string;
    isDefault: boolean;
};

type Props = {
    round: number;
    startDate: LqasImRefDate;
    endDate: LqasImRefDate;
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundSelect: (round: number) => void;
};

const styles = theme => ({
    placeHolderContainer: {
        marginTop: theme.spacing(2),
        textAlign: 'center',
    },
    lqasImMapHeaderPlaceholder: {
        // padding: theme.spacing(2),
        fontWeight: 'bold',
    },
    // setting marginRight to prevent Divider from breaking the grid, marginLeft to prevent misalignment
    verticalDivider: { marginRight: -1, marginLeft: -1 },
    // This is to align the divider.There's a 2px misalignment for some reason
    dividerOffset: {
        marginRight: '2px',
    },
    // The padding is compensate when there's no round and keep the general height of the component
    paddingY: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },
});
// @ts-ignore
const useStyles = makeStyles(styles);
export const LqasImMapHeader: FunctionComponent<Props> = ({
    round,
    startDate,
    endDate,
    options,
    onRoundSelect,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <Grid container direction="row">
                <Grid container item xs={6} direction="row">
                    <Grid item xs={12}>
                        <Box ml={2} mr={2} mb={2}>
                            {options.length > 0 && (
                                <InputComponent
                                    type="select"
                                    keyValue="lqasImHeader"
                                    options={options.map(o => ({
                                        ...o,
                                        value: `${o.value}`,
                                    }))}
                                    value={round ? `${round}` : ''}
                                    onChange={(_keyValue, value) =>
                                        onRoundSelect(parseInt(value, 10))
                                    }
                                    labelString={formatMessage(MESSAGES.round)}
                                    clearable={false}
                                />
                            )}
                            {options.length <= 0 && (
                                <Box className={classes.placeHolderContainer}>
                                    <Typography
                                        className={
                                            classes.lqasImMapHeaderPlaceholder
                                        }
                                    >
                                        {formatMessage(MESSAGES.noRoundFound)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <Divider
                    orientation="vertical"
                    className={classes.verticalDivider}
                    flexItem
                />

                <Grid
                    container
                    item
                    direction="row"
                    xs={3}
                    alignItems="center"
                    className={classNames(
                        classes.dividerOffset,
                        classes.paddingY,
                    )}
                >
                    <LqasImDates type="start" date={startDate} />
                </Grid>
                <Divider
                    orientation="vertical"
                    className={classes.verticalDivider}
                    flexItem
                />
                <Grid
                    container
                    item
                    direction="row"
                    xs={3}
                    alignItems="center"
                    className={classes.paddingY}
                >
                    <LqasImDates type="end" date={endDate} />
                </Grid>
            </Grid>
        </Box>
    );
};
