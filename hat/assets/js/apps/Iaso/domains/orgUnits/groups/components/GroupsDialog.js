import React, { useState, useEffect } from 'react';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { userHasPermission } from '../../../users/utils';
import { useCurrentUser } from '../../../../utils/usersUtils.ts';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';

const initialGroup = currentGroup => {
    return {
        id: { value: get(currentGroup, 'id', null), errors: [] },
        name: { value: get(currentGroup, 'name', ''), errors: [] },
        source_ref: {
            value: get(currentGroup, 'source_ref', ''),
            errors: [],
        },
        block_of_countries: {
            value: get(currentGroup, 'block_of_countries'),
            errors: [],
        },
    };
};

const GroupDialog = ({
    titleMessage,
    initialData,
    renderTrigger,
    saveGroup,
}) => {
    const [group, setGroup] = useState(initialGroup(null));

    const setFieldValue = (fieldName, fieldValue) => {
        setGroup({
            ...group,
            [fieldName]: {
                value: fieldValue,
                errors: [],
            },
        });
    };

    const setFieldErrors = (fieldName, fieldError) => {
        setGroup({
            ...group,
            [fieldName]: {
                value: group[fieldName].value,
                errors: [fieldError],
            },
        });
    };

    const onConfirm = closeDialog => {
        const currentGroup = {
            id: initialData?.id,
            name: group.name.value,
            source_ref: group.source_ref.value,
            block_of_countries: group.block_of_countries.value,
        };

        saveGroup(currentGroup)
            .then(() => {
                closeDialog();
                setGroup(initialGroup(null));
            })
            .catch(error => {
                if (error.status === 400) {
                    Object.keys(error.details).forEach(errorKey => {
                        setFieldErrors(errorKey, error.details[errorKey]);
                    });
                }
            });
    };

    useEffect(() => {
        setGroup(initialGroup(initialData));
    }, [initialData]);

    const allowConfirm = group && group.name && group.name.value !== '';

    const onClosed = () => {
        setGroup(initialGroup(initialData));
    };
    const currentUser = useCurrentUser();
    return (
        <ConfirmCancelDialogComponent
            allowConfirm={allowConfirm}
            dataTestId="groups-dialog"
            titleMessage={titleMessage}
            onConfirm={closeDialog => onConfirm(closeDialog)}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            onClosed={() => onClosed()}
            renderTrigger={renderTrigger}
            maxWidth="sm"
        >
            <Grid container spacing={4} justifyContent="flex-start">
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={group.name.value}
                        errors={group.name.errors}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
                    <InputComponent
                        keyValue="source_ref"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={group.source_ref.value}
                        errors={group.source_ref.errors}
                        type="text"
                        label={MESSAGES.sourceRef}
                    />
                    {userHasPermission(
                        ['iaso_polio', 'iaso_polio_config'],
                        currentUser,
                    ) && (
                        <InputComponent
                            keyValue="block_of_countries"
                            value={group.block_of_countries.value}
                            onChange={(key, value) => setFieldValue(key, value)}
                            type="checkbox"
                            errors={group.block_of_countries.errors}
                            label={MESSAGES.blockOfCountries}
                        />
                    )}
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

GroupDialog.defaultProps = {
    initialData: null,
};

GroupDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    saveGroup: PropTypes.func.isRequired,
};
export default GroupDialog;
