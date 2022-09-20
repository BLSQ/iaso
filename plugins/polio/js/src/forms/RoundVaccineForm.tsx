import React, { FunctionComponent, useEffect, useState } from 'react';
import { Divider, Grid, Tab, Tabs, Typography } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, Select, TextInput } from '../components/Inputs';
import { ShipmentsForm } from './ShipmentsForm';
import { VaccineName, VaccineNames, vaccineNames } from '../constants/virus';
import { DropdownOptions } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { ReportingDelays } from './ReportingDelays';

type Props = {};

const defaultWastageRatio = (vaccine: VaccineName) => {
    switch (vaccine) {
        case VaccineNames.bOPV:
            return '1.18';
        case VaccineNames.mOPV2:
            return '1.15';
        case VaccineNames.nOPV2:
            return '1.33';
        default:
            return '';
    }
};

const dosesOptions: DropdownOptions<5 | 10 | 20 | 50>[] = [
    {
        label: '5',
        value: 5,
    },
    {
        label: '10',
        value: 10,
    },
    {
        label: '20',
        value: 20,
    },
    {
        label: '50',
        value: 50,
    },
];

export enum SelectedVaccineIndex{
    "mOPV2"=0,
    "nOPV2"=1,
    "bOPV"=2,
}

export const RoundVaccineForm: FunctionComponent<Props> = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext<any>(); // TODO add campaign typing

    const [currentRoundNumber, setCurrentRoundNumber] = useState(
        rounds.length > 0 ? rounds[0].number : undefined,
    );
    const roundIndex = rounds.findIndex(r => r.number === currentRoundNumber);
    const [selectedVaccine, setSelectedVaccine] = useState<VaccineNames>(
        VaccineNames.mOPV2,
    ); 
    const selectedVaccineIndex = SelectedVaccineIndex[selectedVaccine];

    const handleRoundTabChange = (_, newValue) => {
        setCurrentRoundNumber(newValue);
    };
    const handleVaccineTabChange = (_, newValue) => {
        setSelectedVaccine(newValue);
        setFieldValue(`rounds[${roundIndex}].vaccines[${SelectedVaccineIndex[newValue]}].name`,newValue);
    };
    const accessor= `rounds[${roundIndex}].vaccines[${selectedVaccineIndex}]`
    // Set the vaccine name to the default name to prevent sending bad request
    useEffect(()=>{
        setFieldValue(`rounds[${roundIndex}].vaccines[${SelectedVaccineIndex[selectedVaccine]}].name`,selectedVaccine);
    },[])

    return (
        <>
            {rounds.length > 0 && (
                <Grid container justifyContent="flex-start">
                    <Grid item>
                        <Tabs
                            value={selectedVaccine}
                            className={classes.subTabs}
                            textColor="primary"
                            onChange={handleVaccineTabChange}
                            orientation="vertical"
                        >
                            {vaccineNames.map(vaccine => (
                                <Tab
                                    key={vaccine}
                                    className={classes.subTab}
                                    label={<span>{vaccine}</span>}
                                    value={vaccine}
                                />
                            ))}
                        </Tabs>
                    </Grid>
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
            {/* TODO adapt names to vary with selected tab */}
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
                    {/* <Field
                        label={formatMessage(MESSAGES.vaccine)}
                        name="vaccine" // TODO get correct path
                        className={classes.input}
                        options={[]} // TODO get options
                        component={Select}
                    /> */}

                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.dosesPerVial)}
                            name={`${accessor}.doses_per_vial`} // TODO get correct path
                            className={classes.input}
                            options={dosesOptions} // TODO get options
                            component={Select}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.wastageRatio)}
                            name={`${accessor}.wastage_ratio`} // TODO get correct path
                            component={TextInput} // TODO make NumberInput
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        < ReportingDelays accessor={accessor}/>
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.dateSignedVrf)}
                            fullWidth
                            name={`${accessor}.date_signed_vrf`} // TODO get correct path
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
                        // roundIndex={roundIndex}
                        accessor={accessor}
                        round={rounds[roundIndex]}
                        selectedVaccineIndex={selectedVaccineIndex}
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
                            name={`${accessor}.forma_reception`} // TODO get correct path
                            component={DateInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAUnusableVials)}
                            name={`${accessor}.forma_unusable_vials`} // TODO get correct path
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAMissingVials)}
                            name={`${accessor}.forma_missing_vials`} // TODO get correct path
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Field
                            label={formatMessage(MESSAGES.formAUsableVials)}
                            name={`${accessor}.forma_usable_vials`} // TODO get correct path
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
                            // label={formatMessage(MESSAGES.dateSignedVrf)}// TODO uncomment when translated
                            label={formatMessage(MESSAGES.destructionDate)}
                            // fullWidth
                            name={`${accessor}.date_destruction`} // TODO get correct path
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Field
                            label={formatMessage(MESSAGES.vialsDestroyed)}
                            // label={formatMessage(MESSAGES.wastageRatio)}// TODO uncomment when translated
                            name={`${accessor}.vials_destroyed`} // TODO get correct path
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
