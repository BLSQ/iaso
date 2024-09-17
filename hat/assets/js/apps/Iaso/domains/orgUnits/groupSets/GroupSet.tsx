import React, { useMemo } from 'react';
import TopBar from '../../../components/nav/TopBarComponent';
import { isEqual } from 'lodash';

import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import {
    useGetGroupSet,
    useOptionGroupSet,
    useSaveGroupSet,
} from './hooks/requests';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useGetGroupDropdown } from '../../orgUnits/hooks/requests/useGetGroups';
import { useDataSourceVersions } from '../../dataSources/requests';
import { useGroupSetSchema } from './hooks/validations';
import { Field, FormikProvider, useFormik } from 'formik';
import TextInput from '../../pages/components/TextInput';
import { SingleSelect } from '../../pages/components/SingleSelect';
import { MultiSelect } from '../../pages/components/MultiSelect';
import { Box, Button } from '@mui/material';
import { useApiErrorValidation } from '../../../libs/validation';

const baseUrl = baseUrls.groupSetDetail;

const makeVersionsDropDown = sourceVersions => {
    if (sourceVersions == undefined) {
        return [];
    }

    const existingVersions =
        sourceVersions
            .map(sourceVersion => {
                return {
                    label:
                        sourceVersion.data_source_name +
                        ' - ' +
                        sourceVersion.number.toString(),
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
    const { data: allSourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const sourceVersionsDropDown = useMemo(
        () => makeVersionsDropDown(allSourceVersions),
        [allSourceVersions, formatMessage],
    );

    const { data: groups, isFetching: isFetchingGroups } = useGetGroupDropdown({
        sourceVersionId: groupSet?.source_version?.id,
    });

    const goBack = useGoBack(baseUrls.groupSets);
    const { mutate: saveOrCreate, isSuccess: mutationIsSuccess } =
        useSaveGroupSet();
    const {
        apiErrors,
        payload,
        mutation: confirm,
    } = useApiErrorValidation({
        mutationFn: saveOrCreate,
    });
    const schema = useGroupSetSchema(apiErrors, payload);

    const formik = useFormik({
        initialValues: {
            id: groupSet?.id,
            name: groupSet?.name,
            source_ref: groupSet?.source_ref,
            source_version_id: groupSet?.source_version?.id,
            group_ids: groupSet?.groups ? groupSet.groups.map(g => g.id) : [],
            group_belonging: groupSet?.group_belonging || 'SINGLE',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: async values => {
            confirm(values);
        },
    });

    const isFormChanged = !isEqual(formik.values, formik.initialValues);
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;
    const userHasReadAndWritePerm = true;
    const isLoading = isFetching || isFetchingGroups || isFetchingMetaData;
    if (mutationIsSuccess) {
        goBack();
    }
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={
                    formatMessage(MESSAGES.groupSet) +
                    (groupSet && groupSet.name ? ' - ' + groupSet.name : '')
                }
                displayBackButton={true}
                goBack={() => goBack()}
            />

            <FormikProvider value={formik}>
                <div style={{ margin: '20px' }}>
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
                            options={groupSetMetaData?.groupBelonging}
                            required
                            disabled={!userHasReadAndWritePerm}
                        />
                    </Box>
                    <Button
                        type="submit"
                        enabled={allowConfirm}
                        onClick={formik.handleSubmit}
                    >
                        {groupSet?.id == undefined ? 'Create' : 'Save'}
                    </Button>
                </div>
            </FormikProvider>
        </>
    );
};

export default GroupSet;
