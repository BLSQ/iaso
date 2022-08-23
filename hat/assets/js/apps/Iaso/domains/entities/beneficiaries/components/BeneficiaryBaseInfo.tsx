/* eslint-disable react/require-default-props */
import { Box, Grid, makeStyles } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { getAge } from '../../../../hooks/useGetAge';
import { Beneficiary } from '../types/beneficiary';

const useStyles = makeStyles(theme => {
    return {
        allBorders: {
            // @ts-ignore
            border: `1px solid ${theme.palette.mediumGray.main}`,
        },
        allButTopBorder: {
            // @ts-ignore
            border: `1px solid ${theme.palette.mediumGray.main}`,
            borderTop: 'none',
        },
        allButBottomBorder: {
            // @ts-ignore
            border: `1px solid ${theme.palette.mediumGray.main}`,
            borderBottom: 'none',
        },
        allButLeftBorder: {
            // @ts-ignore
            border: `1px solid ${theme.palette.mediumGray.main}`,
            borderLeft: 'none',
        },
        BottomAndRightBorders: {
            // @ts-ignore
            border: `1px solid ${theme.palette.mediumGray.main}`,
            borderLeft: 'none',
            borderTop: 'none',
        },
        titleRow: { fontWeight: 'bold' },
        bottomRightRadius: { borderBottomRightRadius: 5 },
        bottomLeftRadius: { borderBottomLeftRadius: 5 },
        topLeftRadius: { borderTopLeftRadius: 5 },
        topRightRadius: { borderTopRightRadius: 5 },
    };
});

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
            <Grid container item xs={12}>
                <Grid
                    container
                    item
                    xs={6}
                    className={`${classes.allBorders} ${classes.titleRow} ${classes.topLeftRadius}`}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {formatMessage(MESSAGES.name)}
                    </Box>
                </Grid>
                <Grid
                    item
                    container
                    xs={6}
                    className={`${classes.allButLeftBorder} ${classes.topRightRadius}`}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {beneficiary?.attributes?.file_content?.name ?? '--'}
                    </Box>
                </Grid>
            </Grid>
            <Grid container item xs={12}>
                <Grid
                    item
                    container
                    xs={6}
                    className={`${classes.allButTopBorder} ${classes.titleRow}`}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {formatMessage(MESSAGES.age)}
                    </Box>
                </Grid>
                <Grid
                    item
                    container
                    xs={6}
                    className={classes.BottomAndRightBorders}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {getAge({
                            age: beneficiary?.attributes?.file_content?.age,
                            ageType:
                                (beneficiary?.attributes?.file_content
                                    ?.age_type as '0' | '1') ?? '0',
                            birthDate:
                                beneficiary?.attributes?.file_content
                                    ?.birth_date,
                        }) ?? '--'}
                    </Box>
                </Grid>
            </Grid>
            <Grid container item xs={12}>
                <Grid
                    item
                    container
                    xs={6}
                    className={`${classes.allButTopBorder} ${classes.titleRow} ${classes.bottomLeftRadius}`}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {formatMessage(MESSAGES.gender)}
                    </Box>
                </Grid>
                <Grid
                    item
                    container
                    xs={6}
                    className={`${classes.BottomAndRightBorders} ${classes.bottomRightRadius}`}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {beneficiary?.attributes?.file_content.gender ??
                            formatMessage(MESSAGES.unknown)}
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
