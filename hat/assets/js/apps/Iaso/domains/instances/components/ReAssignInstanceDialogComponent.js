import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Chip, makeStyles, Box, Typography } from '@material-ui/core';

import UpdateIcon from '@material-ui/icons/Update';
import InputComponent from '../../../components/forms/InputComponent';
import OrgUnitSearch from '../../orgUnits/components/OrgUnitSearch';
import OrgUnitTooltip from '../../orgUnits/components/OrgUnitTooltip';
import { getOrgunitMessage } from '../../orgUnits/utils';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { Period } from '../../periods/models';

import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    chipList: {
        marginTop: theme.spacing(2),
    },
    chipListTitle: {
        marginBottom: theme.spacing(1),
    },
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

const ReAssignInstanceDialogComponent = ({
    currentInstance,
    onReAssignInstance,
}) => {
    const classes = useStyles();

    const [fieldValue, setFieldValue] = React.useState({
        orgUnit: { value: currentInstance.org_unit, errors: [] },
        period: { value: currentInstance.period, errors: [] },
    });

    const handleRemoveOrgUnit = () => {
        setFieldValue({
            ...fieldValue,
            orgUnit: {
                errors: ['Org unit is required!'],
                value: undefined,
            },
        });
    };

    const onConfirm = closeDialog => {
        onReAssignInstance(currentInstance, {
            period: fieldValue.period.value,
            org_unit: fieldValue.orgUnit.value.id,
        });

        closeDialog();
    };

    let period;
    let nextPeriods;
    let previousPeriods = [];
    if (
        currentInstance.period !== undefined &&
        currentInstance.period !== null
    ) {
        period = new Period(currentInstance.period);
        nextPeriods = period.nextPeriods(2);
        previousPeriods = period.previousPeriods(3);
    }
    const isPeriodDisabled = !currentInstance.period;
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <UpdateIcon onClick={openDialog} />
            )}
            titleMessage={MESSAGES.reAssignInstance}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.reAssignInstanceAction}
            cancelMessage={MESSAGES.cancel}
            maxWidth="xs"
            allowConfirm={
                fieldValue.orgUnit.value !== undefined &&
                (Boolean(isPeriodDisabled) ||
                    (!isPeriodDisabled && Boolean(fieldValue.period.value)))
            }
        >
            <InputComponent
                disabled={
                    currentInstance.period === undefined ||
                    currentInstance.period === null
                }
                clearable={false}
                keyValue="period"
                onChange={(key, value) =>
                    setFieldValue({
                        ...fieldValue,
                        period: {
                            ...fieldValue.period,
                            value,
                        },
                    })
                }
                value={fieldValue.period.value}
                errors={fieldValue.period.errors}
                type="select"
                options={previousPeriods.concat(nextPeriods).map(p => ({
                    label: Period.getPrettyPeriod(p),
                    value: p,
                }))}
                label={MESSAGES.period}
                required
            />
            <>
                {!fieldValue.orgUnit.value && (
                    <OrgUnitSearch
                        onSelectOrgUnit={ou =>
                            setFieldValue({
                                ...fieldValue,
                                orgUnit: {
                                    ...fieldValue.orgUnit,
                                    value: ou,
                                },
                            })
                        }
                        inputLabelObject={MESSAGES.addOrgUnit}
                    />
                )}
                {fieldValue.orgUnit.value !== undefined &&
                    fieldValue.orgUnit.value && (
                        <Box className={classes.chipList}>
                            <Typography
                                variant="subtitle1"
                                className={classes.chipListTitle}
                            >
                                <FormattedMessage
                                    {...MESSAGES.selectedOrgUnit}
                                />
                                :
                            </Typography>
                            <OrgUnitTooltip
                                orgUnit={fieldValue.orgUnit.value}
                                key={fieldValue.orgUnit.value.id}
                            >
                                <Chip
                                    label={getOrgunitMessage(
                                        fieldValue.orgUnit.value,
                                    )}
                                    onDelete={() => handleRemoveOrgUnit()}
                                    className={classes.chip}
                                    color="primary"
                                />
                            </OrgUnitTooltip>
                        </Box>
                    )}
            </>
        </ConfirmCancelDialogComponent>
    );
};

ReAssignInstanceDialogComponent.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    onReAssignInstance: PropTypes.func.isRequired,
};

export default ReAssignInstanceDialogComponent;
