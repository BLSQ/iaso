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
        BottomAndRightBorders: {
            // @ts-ignore
            border: `1px solid`,
            borderLeft: 'none',
            borderTop: 'none',
        },
        onlyRightBorder: { borderRight: '1px solid' },
        onlyBottomBorder: { borderBottom: '1px solid' },
        titleRow: { fontWeight: 'bold' },
        // @ts-ignore
        lightGrayBorder: { borderColor: theme.palette.ligthGray.border },
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
    const borderColor = classes.lightGrayBorder;
    const topLeftStyle = `${classes.BottomAndRightBorders} ${borderColor} ${classes.titleRow}`;
    const topRightStyle = `${classes.onlyBottomBorder} ${borderColor}`;
    const middleLeftStyle = `${classes.BottomAndRightBorders} ${borderColor} ${classes.titleRow}`;
    const middleRightStyle = `${classes.onlyBottomBorder} ${borderColor}`;
    const bottomLeftStyle = `${classes.onlyRightBorder} ${borderColor} ${classes.titleRow}`;
    const bottomRightStyle = '';
    return (
        <>
            <Grid container item xs={12}>
                <Grid
                    container
                    item
                    xs={6}
                    className={topLeftStyle}
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
                    className={topRightStyle}
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
                    className={middleLeftStyle}
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
                    className={middleRightStyle}
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
                    className={middleLeftStyle}
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
                    className={middleRightStyle}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {beneficiary?.attributes?.file_content.gender ??
                            formatMessage(MESSAGES.unknown)}
                    </Box>
                </Grid>
            </Grid>
            <Grid container item xs={12}>
                <Grid
                    item
                    container
                    xs={6}
                    className={bottomLeftStyle}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1}>
                        {formatMessage(MESSAGES.uuid)}
                    </Box>
                </Grid>
                <Grid
                    item
                    container
                    xs={6}
                    className={bottomRightStyle}
                    justifyContent="center"
                >
                    <Box mt={1} mb={1} style={{ textAlign: 'center' }}>
                        {beneficiary?.uuid ?? '--'}
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
