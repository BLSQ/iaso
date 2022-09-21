import React, { FunctionComponent, useState } from 'react';
import { Divider, Grid, Tab, Tabs, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput } from '../components/Inputs';
import { ShipmentsForm } from './ShipmentsForm';
// import { VaccineName, VaccineNames } from '../constants/virus';
import { ReportingDelays } from './ReportingDelays';
import { RoundVaccineForms } from './RoundVaccineForms';

type Props = any;

// const defaultWastageRatio = (vaccine: VaccineName) => {
//     switch (vaccine) {
//         case VaccineNames.bOPV:
//             return '1.18';
//         case VaccineNames.mOPV2:
//             return '1.15';
//         case VaccineNames.nOPV2:
//             return '1.33';
//         default:
//             return '';
//     }
// };

// export enum SelectedVaccineIndex{
//     "mOPV2"=0,
//     "nOPV2"=1,
//     "bOPV"=2,
// }

export const VaccineManangementForm: FunctionComponent<Props> = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
        // setFieldValue,
    } = useFormikContext<any>(); // TODO add campaign typing

    const [currentRoundNumber, setCurrentRoundNumber] = useState(
        rounds.length > 0 ? rounds[0].number : undefined,
    );
    const roundIndex = rounds.findIndex(r => r.number === currentRoundNumber);

    // const selectedRound = useMemo(()=>{
    //     return rounds.find(round=> round.number === currentRoundNumber)
    // },[rounds, currentRoundNumber])

    // const [selectedVaccine, setSelectedVaccine] = useState<Optional<VaccineNames>>(vaccineTabs[0]);

    const handleRoundTabChange = (_, newValue) => {
        setCurrentRoundNumber(newValue);
    };

    const accessor = `rounds[${roundIndex}]`;

    return (
        <>
            {rounds.length > 0 && (
                <Grid container justifyContent="flex-start">
                    <Grid item>
                        <Tabs
                            value={currentRoundNumber}
                            className={classes.subTabs}
                            textColor="primary"
                            onChange={handleRoundTabChange}
                        >
                            {rounds.map(round => (
                                <Tab
                                    key={round.number}
                                    className={classes.subTab}
                                    label={
                                        <span>
                                            {formatMessage(MESSAGES.round)}{' '}
                                            {round.number}
                                        </span>
                                    }
                                    value={round.number}
                                />
                            ))}
                        </Tabs>
                    </Grid>
                </Grid>
            )}
            <Grid container spacing={2}>
                <Divider style={{ width: '100%' }} />
                {/* First row: vaccine */}
                <Grid item xs={12}>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.vaccine)}
                    </Typography>
                </Grid>
                <Grid
                    container
                    direction="row"
                    item
                    xs={12}
                    spacing={2}
                    justifyContent="center"
                >
                    <Grid container item xs={6}>
                        <RoundVaccineForms
                            roundIndex={roundIndex}
                            round={rounds[roundIndex]}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <ReportingDelays accessor={accessor} />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.dateSignedVrf)}
                            fullWidth
                            name={`${accessor}.date_signed_vrf`}
                            component={DateInput}
                        />
                    </Grid>
                </Grid>
                {/* second row: shipments */}
                <Divider style={{ width: '100%' }} />
                <Grid item xs={12}>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.shipments)}
                    </Typography>
                </Grid>
                <Grid container item xs={12}>
                    <ShipmentsForm
                        roundIndex={roundIndex}
                        accessor={accessor}
                        round={rounds[roundIndex]}
                    />
                </Grid>
                {/* third row: Form A */}
                <Divider style={{ width: '100%' }} />
                <Grid item xs={12}>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.formA)}
                    </Typography>
                </Grid>
                <Grid container direction="row" item xs={12} spacing={2}>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAReception)}
                            name={`${accessor}.forma_reception`}
                            component={DateInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAUnusableVials)}
                            name={`${accessor}.forma_unusable_vials`}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAMissingVials)}
                            name={`${accessor}.forma_missing_vials`}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAUsableVials)}
                            name={`${accessor}.forma_usable_vials`}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
                {/* fourth row: destruction */}
                <Divider style={{ width: '100%' }} />
                <Grid item xs={12}>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.destruction)}
                    </Typography>
                </Grid>
                <Grid container direction="row" spacing={2} item xs={12}>
                    {/* Not sure yet if this should not be a map */}
                    <Grid item xs={6}>
                        <Field
                            label={formatMessage(MESSAGES.destructionDate)}
                            // fullWidth
                            name={`${accessor}.date_destruction`}
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Field
                            label={formatMessage(MESSAGES.vialsDestroyed)}
                            name={`${accessor}.vials_destroyed`}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
