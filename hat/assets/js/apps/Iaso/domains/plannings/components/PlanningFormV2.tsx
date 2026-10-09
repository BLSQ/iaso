import React, { FC } from 'react';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { Card, Stack, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FormikProvider } from 'formik';
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { ToggleButtonGroupInput } from 'Iaso/components/forms/ToggleButtonGroupInput';
import { useGetProjectsDropDown } from 'Iaso/domains/projects/hooks/requests/useGetProjectsDropDown';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { useGetPublishingStatusOptions } from '../constants';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';
import { planningPanelStyles } from './styles';

export const PlanningFormV2: FC = () => {
    const { formik } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();
    const publishingStatusOptions = useGetPublishingStatusOptions();

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        validateField,
    } = formik;

    // converting undefined to null for the API
    const onChangeDate = (keyValue: string, value: any) => {
        setFieldTouched(keyValue, true);
        if (value === undefined) {
            setFieldValue(keyValue, null);
        } else {
            setFieldValue(keyValue, value);
        }
    };

    const onChange = (keyValue: string, value: any) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
        // Reset validation from server to not block the user.
        // If this is not called, even changing a field won't mark the form as valid.
        validateField(keyValue);
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    return (
        <Card variant="outlined" sx={planningPanelStyles.card}>
            <Stack gap={1} direction="row" alignItems="center" py={2}>
                <EditNoteIcon color="primary" />
                <Typography fontWeight="bold">Planning details</Typography>
            </Stack>
            <FormikProvider value={formik}>
                <InputComponent
                    keyValue="name"
                    onChange={onChange}
                    value={values.name}
                    errors={getErrors('name')}
                    type="text"
                    label={MESSAGES.name}
                    required
                    withMarginTop={false}
                />
                <InputComponent
                    keyValue="description"
                    onChange={onChange}
                    value={values.description}
                    errors={getErrors('description')}
                    type="textarea"
                    label={MESSAGES.description}
                />

                <DatesRange
                    onChangeDate={onChangeDate}
                    dateFrom={values.startDate}
                    dateTo={values.endDate}
                    labelFrom={MESSAGES.startDatefrom}
                    labelTo={MESSAGES.endDateUntil}
                    keyDateFrom="startDate"
                    keyDateTo="endDate"
                    errors={[getErrors('startDate'), getErrors('endDate')]}
                    blockInvalidDates={false}
                />
                <InputComponent
                    type="select"
                    keyValue="project"
                    onChange={onChange}
                    value={isFetchingProjects ? undefined : values.project}
                    errors={getErrors('project')}
                    label={MESSAGES.project}
                    required
                    options={projectsDropdown || []}
                    loading={isFetchingProjects}
                />
                <ToggleButtonGroupInput
                    keyValue="publishingStatus"
                    onChange={onChange}
                    value={values.publishingStatus}
                    errors={getErrors('publishingStatus')}
                    label={formatMessage(MESSAGES.publishingStatus)}
                    options={publishingStatusOptions}
                    required
                />
            </FormikProvider>
        </Card>
    );
};
