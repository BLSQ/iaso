import { Box, Button, Container } from '@mui/material';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import React, { useMemo } from 'react';
import TopBar from '../../../components/nav/TopBarComponent';

import { baseUrls } from '../../../constants/urls';
import { useApiErrorValidation } from '../../../libs/validation';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useDataSourceVersions } from '../../dataSources/requests';
import { MultiSelect } from '../../pages/components/MultiSelect';
import { SingleSelect } from '../../pages/components/SingleSelect';
import TextInput from '../../pages/components/TextInput';
import { useGetGroupDropdown } from '../hooks/requests/useGetGroups';
import {
    useGetGroupSet,
    useOptionGroupSet,
    useSaveGroupSet,
} from './hooks/requests';
import { useGroupSetSchema } from './hooks/validations';
import MESSAGES from './messages';

const baseUrl = baseUrls.groupSetDetail;

const makeVersionsDropDown = sourceVersions => {
    if (sourceVersions === undefined) {
        return [];
    }

    const existingVersions =
        sourceVersions
            .map(sourceVersion => {
                return {
                    label: `${
                        sourceVersion.data_source_name
                    } - ${sourceVersion.number.toString()}`,
                    value: sourceVersion.id,
                };
            })
            .sort((a, b) => parseInt(a.number, 10) > parseInt(b.number, 10)) ??
        [];
    return existingVersions;
};

const GroupSet = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrl);

    const { data: groupSet, isFetching } = useGetGroupSet(params.groupSetId);
    const { data: groupSetMetaData, isLoading: isFetchingMetaData } =
        useOptionGroupSet();
    const { data: allSourceVersions } = useDataSourceVersions();

    const sourceVersionsDropDown = useMemo(
        () => makeVersionsDropDown(allSourceVersions),
        [allSourceVersions],
    );

    const goBack = useGoBack(baseUrls.groupSets);
    const { mutateAsync: saveOrCreate, isSuccess: mutationIsSuccess } =
        useSaveGroupSet();
    const { apiErrors, payload } = useApiErrorValidation({
        mutationFn: saveOrCreate,
    });
    const schema = useGroupSetSchema(apiErrors, payload);

    const isCreate = groupSet && groupSet?.id === undefined;
    const formik = useFormik({
        initialValues: {
            id: groupSet?.id,
            name: groupSet?.name,
            source_ref: groupSet?.source_ref,
            source_version_id: groupSet?.source_version?.id,
            group_ids: groupSet?.groups ? groupSet.groups.map(g => g.id) : [],
            group_belonging: params.groupSetId
                ? groupSet?.group_belonging
                : 'SINGLE',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: async values => {
            saveOrCreate(values);
        },
    });

    const { data: groups, isFetching: isFetchingGroups } = useGetGroupDropdown({
        sourceVersionId: formik.values.source_version_id,
    });

    const isFormChanged = !isEqual(formik.values, formik.initialValues);
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;
    const userHasReadAndWritePerm = true;
    const isLoading = isFetching || isFetchingGroups || isFetchingMetaData;
    if (mutationIsSuccess && isCreate) {
        goBack();
    }
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={
                    formatMessage(MESSAGES.groupSet) +
                    (groupSet && groupSet.name ? ` - ${groupSet.name}` : '')
                }
                displayBackButton
                goBack={() => goBack()}
            />

            <FormikProvider value={formik}>
                <Container maxWidth="sm" sx={{ mt: theme => theme.spacing(4) }}>
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.name)}
                            name="name"
                            component={TextInput}
                            required
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>

                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.sourceVersion)}
                            name="source_version_id"
                            component={SingleSelect}
                            options={sourceVersionsDropDown}
                            required
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>

                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.groups)}
                            name="group_ids"
                            component={MultiSelect}
                            options={groups}
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>

                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.source_ref)}
                            name="source_ref"
                            component={TextInput}
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>

                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.group_belonging)}
                            name="group_belonging"
                            component={SingleSelect}
                            options={groupSetMetaData?.groupBelonging || []}
                            required
                            loading={isFetchingMetaData}
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            type="submit"
                            disabled={!allowConfirm}
                            variant="contained"
                            onClick={(
                                event: React.MouseEvent<HTMLButtonElement>,
                            ) => {
                                event.preventDefault();
                                formik.handleSubmit();
                            }}
                        >
                            {formatMessage(
                                isCreate
                                    ? MESSAGES.createButton
                                    : MESSAGES.saveButton,
                            )}
                        </Button>
                    </Box>
                </Container>
            </FormikProvider>
        </>
    );
};

export default GroupSet;
