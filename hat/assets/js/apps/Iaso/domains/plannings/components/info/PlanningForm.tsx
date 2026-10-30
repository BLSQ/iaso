import React, { FC } from 'react';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { Card, Stack, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { FormikProvider } from 'formik';
import DatesRange from 'Iaso/components/filters/DatesRange';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { ToggleButtonGroupInput } from 'Iaso/components/forms/ToggleButtonGroupInput';
import { useGetProjectsDropDown } from 'Iaso/domains/projects/hooks/requests/useGetProjectsDropDown';
import { SxStyles } from 'Iaso/types/general';
import { useGetPublishingStatusOptions } from '../../constants';
import { usePlanningContext } from '../../contexts/PlanningContext';
import { usePlanningFieldHandlers } from '../../hooks/usePlanningFieldHandlers';
import MESSAGES from '../../messages';
import { planningPanelStyles } from '../shared/styles';

const styles = {
    card: {
        ...planningPanelStyles.card,
        position: 'relative',
    },
} satisfies SxStyles;

export const PlanningForm: FC = () => {
    const { formik, isLoadingPlanning, isReadOnly } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();
    const publishingStatusOptions = useGetPublishingStatusOptions();

    const { values, setFieldValue, setFieldTouched } = formik;
    const { onChange, getErrors } = usePlanningFieldHandlers(formik);

    // converting undefined to null for the API
    const onChangeDate = (keyValue: string, value: any) => {
        setFieldTouched(keyValue, true);
        if (value === undefined) {
            setFieldValue(keyValue, null);
        } else {
            setFieldValue(keyValue, value);
        }
    };

    return (
        <Card variant="outlined" sx={styles.card}>
            {isLoadingPlanning && <LoadingSpinner absolute fixed={false} />}
            <Stack gap={1} direction="row" alignItems="center" py={2}>
                <EditNoteIcon color="primary" />
                <Typography fontWeight="bold">
                    {formatMessage(MESSAGES.planningDetails)}
                </Typography>
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
                    disabled={isReadOnly}
                />
                <InputComponent
                    keyValue="description"
                    onChange={onChange}
                    value={values.description}
                    errors={getErrors('description')}
                    type="textarea"
                    label={MESSAGES.description}
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
                />
                <ToggleButtonGroupInput
                    keyValue="publishingStatus"
                    onChange={onChange}
                    value={values.publishingStatus}
                    errors={getErrors('publishingStatus')}
                    label={formatMessage(MESSAGES.publishingStatus)}
                    options={publishingStatusOptions}
                    required
                    disabled={isReadOnly}
                />
            </FormikProvider>
        </Card>
    );
};
