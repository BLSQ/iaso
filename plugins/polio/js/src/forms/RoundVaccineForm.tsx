import React, { FunctionComponent, useState } from 'react';
import { Grid, Tab, Tabs } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, Select, TextInput } from '../components/Inputs';
import { ShipmentsForm } from './ShipmentsForm';

type Props = {};

export const RoundVaccineForm: FunctionComponent<Props> = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
    } = useFormikContext();

    const [currentRoundNumber, setCurrentRoundNumber] = useState(
        rounds.length > 0 ? rounds[0].number : undefined,
    );
    const roundIndex = rounds.findIndex(r => r.number === currentRoundNumber);

    const handleTabChange = (_, newValue) => {
        setCurrentRoundNumber(newValue);
    };

    return (
        <>
            {rounds.length > 0 && (
                <Tabs
                    value={currentRoundNumber}
                    className={classes.subTabs}
                    textColor="primary"
                    onChange={handleTabChange}
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
            )}
            <Grid container spacing={2}>
                {/* First row: vaccine */}
                <Grid xs={12}>
                    <Field
                        label={formatMessage(MESSAGES.vaccine)}
                        name="vaccine" // TODO get correct path
                        className={classes.input}
                        options={[]} // TODO get options
                        component={Select}
                    />
                    <Field
                        label={formatMessage(MESSAGES.dosesPerVial)}
                        name="doses_per_vial" // TODO get correct path
                        className={classes.input}
                        options={[]} // TODO get options
                        component={Select}
                    />
                    <Field
                        label={formatMessage(MESSAGES.wastageRatio)}
                        name="wastage_ratio" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                    <div>Table with editable fields</div>
                    <Field
                        label={formatMessage(MESSAGES.dateSignedVrf)}
                        fullWidth
                        name="date_signed_vrf" // TODO get correct path
                        component={DateInput}
                    />
                </Grid>
                {/* second row: shipments */}
                <Grid xs={12}>
                    <ShipmentsForm
                        roundIndex={roundIndex}
                        round={rounds[roundIndex]}
                    />
                </Grid>
                {/* third row: Form A */}
                <Grid xs={12}>
                    <Field
                        label={formatMessage(MESSAGES.wastageRatio)}
                        name="forma_reception" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.formAUnusableVials)}
                        name="forma_unusable_vials" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.formAMissingVials)}
                        name="forma_missing_vials" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label={formatMessage(MESSAGES.formAUsableVials)}
                        name="forma_usable_vials" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
                {/* fourth row: destruction */}
                <Grid xs={12}>
                    {/* Not sure yet if this should not be a map */}
                    <Field
                        // label={formatMessage(MESSAGES.dateSignedVrf)}// TODO uncomment when translated
                        label={formatMessage(MESSAGES.destructionDate)}
                        // fullWidth
                        name="date_destruction" // TODO get correct path
                        component={DateInput}
                    />
                    <Field
                        label={formatMessage(MESSAGES.vialsDestroyed)}
                        // label={formatMessage(MESSAGES.wastageRatio)}// TODO uncomment when translated
                        name="vials_destroyed" // TODO get correct path
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
            </Grid>
        </>
    );
};
