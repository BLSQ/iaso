import React, { FunctionComponent, useState } from 'react';
import { Box, Divider, Grid, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../../../styles/theme';
import MESSAGES from '../../../constants/messages';
import { DateInput } from '../../../components/Inputs';
import { ShipmentsForm } from './ShipmentsForm';
import { ReportingDelays } from './ReportingDelays';
import { RoundVaccinesForm } from './RoundVaccinesForm';
import { DestructionsForm } from './DestructionsForm';
import { FormAForm } from './FormAForm';
import { Campaign, Round } from '../../../constants/types';

type Props = any;

export const vaccineManagementFormFields = (rounds: Round[]): string[] => {
    return rounds
        .map((_round: Round, index: number) => {
            return [
                `rounds[${index}].reporting_delays_hc_to_district`,
                `rounds[${index}].reporting_delays_region_to_national`,
                `rounds[${index}].reporting_delays_district_to_region`,
                `rounds[${index}].date_signed_vrf_received`,
                `rounds[${index}].forma_reception`,
                `rounds[${index}].forma_date`,
                `rounds[${index}].forma_missing_vials`,
                `rounds[${index}].forma_usable_vials`,
                `rounds[${index}].forma_comment`,
                `rounds[${index}].shipments`,
                `rounds[${index}].destructions`,
                `rounds[${index}].vaccines`,
            ];
        })
        .flat();
};

const useCustomStyles = makeStyles(theme => ({
    marginTop: { width: '100%', marginTop: theme.spacing(1) },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

export const VaccineManagementForm: FunctionComponent<Props> = () => {
    const classes: Record<string, string> = useStyles();
    const customClasses = useCustomStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext<Campaign>();

    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const handleRoundTabChange = (_, newValue) => {
        setCurrentIndex(newValue);
    };
    const accessor = `rounds[${currentIndex}]`;

    return (
        <>
            {rounds.length > 0 && (
                <Grid container justifyContent="flex-start">
                    <Grid item>
                        <Box mb={2}>
                            <Tabs
                                value={currentIndex}
                                className={classes.subTabs}
                                textColor="primary"
                                onChange={handleRoundTabChange}
                            >
                                {rounds.map((round, index) => (
                                    <Tab
                                        key={`${round.number}-${round.id}`}
                                        className={classes.subTab}
                                        label={
                                            <span>
                                                {formatMessage(MESSAGES.round)}{' '}
                                                {round.number}
                                            </span>
                                        }
                                        value={index}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                    </Grid>
                </Grid>
            )}
            <Grid key={currentIndex} container spacing={2}>
                {/* First row: vaccine */}
                <Grid item xs={12}>
                    <Box mt={1} mb={1}>
                        <Typography variant="button">
                            {formatMessage(MESSAGES.vaccines)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid
                    container
                    direction="row"
                    item
                    xs={12}
                    spacing={2}
                    justifyContent="center"
                >
                    <Grid container item lg={6} md={12}>
                        <RoundVaccinesForm
                            roundIndex={currentIndex}
                            round={rounds[currentIndex]}
                        />
                    </Grid>
                    <Grid item lg={3} md={6}>
                        <Box mb={1}>
                            <ReportingDelays accessor={accessor} />
                        </Box>
                    </Grid>
                    <Grid item lg={3} md={6}>
                        <Field
                            label={formatMessage(MESSAGES.dateSignedVrf)}
                            fullWidth
                            name={`${accessor}.date_signed_vrf_received`}
                            component={DateInput}
                        />
                    </Grid>
                </Grid>
                {/* second row: shipments */}
                <Divider style={{ width: '100%' }} />
                <Grid item xs={12}>
                    <Box mt={1} mb={1}>
                        <Typography variant="button">
                            {formatMessage(MESSAGES.shipments)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid container item xs={12}>
                    <ShipmentsForm
                        accessor={accessor}
                        round={rounds[currentIndex]}
                        roundIndex={currentIndex}
                    />
                </Grid>
                {/* third row: Form A */}
                <Divider style={{ width: '100%' }} />
                <Grid item xs={12}>
                    <Box mt={1} mb={1}>
                        <Typography variant="button">
                            {formatMessage(MESSAGES.formA)}
                        </Typography>
                    </Box>
                </Grid>
                <FormAForm accessor={accessor} roundIndex={currentIndex} />

                {/* fourth row: destruction */}
                <Divider className={customClasses.marginTop} />
                <Grid item xs={12}>
                    <Box mt={1} mb={1}>
                        <Typography variant="button">
                            {formatMessage(MESSAGES.destruction)}
                        </Typography>
                    </Box>
                </Grid>
                <DestructionsForm
                    accessor={accessor}
                    round={rounds[currentIndex]}
                    roundIndex={currentIndex}
                />
            </Grid>
        </>
    );
};
