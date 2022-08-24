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
            border: `1px solid`,
        },
        allButTopBorder: {
            // @ts-ignore
            border: `1px solid`,
            borderTop: 'none',
        },
        allButBottomBorder: {
            // @ts-ignore
            border: `1px solid`,
            borderBottom: 'none',
        },
        allButLeftBorder: {
            // @ts-ignore
            border: `1px solid`,
            borderLeft: 'none',
        },
        BottomAndRightBorders: {
            // @ts-ignore
            border: `1px solid`,
            borderLeft: 'none',
            borderTop: 'none',
        },
        onlyRightBorder: { borderRight: '1px solid' },
        onlyBottomBorder: { borderBottom: '1px solid' },
        titleRow: { fontWeight: 'bold' },
        bottomRightRadius: { borderBottomRightRadius: 5 },
        bottomLeftRadius: { borderBottomLeftRadius: 5 },
        topLeftRadius: { borderTopLeftRadius: 5 },
        topRightRadius: { borderTopRightRadius: 5 },
        // @ts-ignore
        grayBorder: { borderColor: theme.palette.mediumGray.main },
        // @ts-ignore
        lightGrayBorder: { borderColor: theme.palette.ligthGray.border },
    };
});

type Props = {
    beneficiary?: Beneficiary;
    paperLayout?: boolean;
};

export const BeneficiaryBaseInfo: FunctionComponent<Props> = ({
    beneficiary,
    paperLayout = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const borderColor = paperLayout
        ? classes.lightGrayBorder
        : classes.grayBorder;
    const topLeftStyle = paperLayout
        ? `${classes.BottomAndRightBorders} ${borderColor} ${classes.titleRow}`
        : `${classes.allBorders} ${classes.titleRow}  ${borderColor} ${classes.topLeftRadius}`;
    const topRightStyle = paperLayout
        ? `${classes.onlyBottomBorder} ${borderColor}`
        : `${classes.allButLeftBorder}  ${borderColor} ${classes.topRightRadius}`;
    const middleLeftStyle = paperLayout
        ? `${classes.BottomAndRightBorders} ${borderColor} ${classes.titleRow}`
        : `${classes.allButTopBorder} ${classes.titleRow} ${borderColor}`;
    const middleRightStyle = paperLayout
        ? `${classes.onlyBottomBorder} ${borderColor}`
        : `${classes.BottomAndRightBorders} ${borderColor}`;
    const bottomLeftStyle = paperLayout
        ? `${classes.onlyRightBorder} ${borderColor} ${classes.titleRow}`
        : `${classes.allButTopBorder} ${classes.titleRow}  ${borderColor} ${classes.bottomLeftRadius}`;
    const bottomRightStyle = paperLayout
        ? ''
        : `${classes.BottomAndRightBorders}  ${borderColor} ${classes.bottomRightRadius}`;
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
                    className={bottomLeftStyle}
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
                    className={bottomRightStyle}
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
