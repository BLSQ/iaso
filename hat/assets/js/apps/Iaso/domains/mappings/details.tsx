import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Grid, Box } from '@mui/material';

import {
    commonStyles,
    LoadingSpinner,
    useRedirectToReplace,
    useSafeIntl,
    useGoBack,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import RecursiveTreeView from './components/RecursiveTreeView';
import QuestionInfos from './components/QuestionInfos';
import QuestionMappingForm from './components/QuestionMappingForm';
import DerivedQuestionMappingForm from './components/DerivedQuestionMappingForm';
import { baseUrls } from '../../constants/urls.ts';
import GeneraMappingInfo from './components/GeneraMappingInfo';
import Descriptor from './descriptor';
import MESSAGES from './messages';

import { useParamsObject } from '../../routing/hooks/useParamsObject';
import {
    useApplyPartialUpdate,
    useApplyUpdate,
    useGetMappingVersionDetail,
} from './hooks';

const baseUrl = baseUrls.mappingDetail;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    icon: {
        width: 30,
        height: 'auto',
        display: 'block',
        cursor: 'pointer',
    },
}));

const iasoFieldOptions = formatMessage => [
    { value: undefined, label: formatMessage(MESSAGES.useValueFromForm) },
    {
        value: 'instance.org_unit.source_ref',
        label: formatMessage(MESSAGES.instanceOrgUnit),
    },
];

const fieldTypeOptions = formatMessage => [
    { value: 'dataElement', label: formatMessage(MESSAGES.programDataElement) },
    {
        value: 'trackedEntityAttribute',
        label: formatMessage(MESSAGES.trackedEntityAttribute),
    },
];

const MappingDetails = props => {
    const redirectToReplace = useRedirectToReplace();
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrl);
    const currentMappingVersionQuery = useGetMappingVersionDetail(
        params.mappingVersionId,
    );

    const currentMappingVersion =
        currentMappingVersionQuery?.data?.mappingVersion;

    const currentFormVersion = currentMappingVersionQuery?.data?.formVersion;

    const fetching = currentMappingVersionQuery.isFetching;

    const indexedQuestions = currentFormVersion
        ? Descriptor.indexQuestions(currentFormVersion.descriptor)
        : {};

    const [currentQuestion, setCurrentQuestion] = useState(
        indexedQuestions[params.questionName],
    );

    if (
        currentFormVersion &&
        params.questionName &&
        currentQuestion == undefined
    ) {
        setCurrentQuestion(indexedQuestions[params.questionName]);
    }
    const backParams = {};
    if (currentFormVersion?.form_id) {
        backParams.formId = currentFormVersion.form_id;
    }

    const goBack = useGoBack(baseUrls.mappings);

    const applyUpdate = useApplyUpdate();
    const applyPartialUpdate = useApplyPartialUpdate();

    const onQuestionSelected = node => {
        if (node && node.type === 'select all that apply') {
            return;
        }
        setCurrentQuestion(node);
        redirectToReplace(baseUrls.mappingDetail, {
            mappingVersionId: currentMappingVersion.id,
            questionName: Descriptor.getKey(node),
        });
    };

    const onConfirmedQuestionMapping = questionMapping => {
        applyPartialUpdate.mutate({
            mappingVersionId: currentMappingVersion.id,
            questionName: Descriptor.getKey(currentQuestion),
            mapping: questionMapping,
        });
    };

    const onUnmapQuestionMapping = () => {
        applyPartialUpdate.mutate({
            mappingVersionId: currentMappingVersion.id,
            questionName: Descriptor.getKey(currentQuestion),
            mapping: {
                action: 'unmap',
            },
        });
    };

    const onNeverMapQuestionMapping = () => {
        applyPartialUpdate.mutate({
            mappingVersionId: currentMappingVersion.id,
            questionName: Descriptor.getKey(currentQuestion),
            mapping: {
                type: 'neverMapped',
            },
        });
    };
    const isDataElementMappable =
        currentMappingVersion &&
        currentMappingVersion.mapping.mapping_type !== 'DERIVED';

    return (
        <section className={classes.relativeContainer}>
            <TopBar
                title={
                    currentMappingVersion
                        ? formatMessage(MESSAGES.mapping, {
                              name: currentMappingVersion.form_version.form
                                  .name,
                              id: currentMappingVersion.form_version.version_id,
                              type: currentMappingVersion.mapping.mapping_type,
                          })
                        : formatMessage(MESSAGES.loading)
                }
                displayBackButton
                goBack={() => {
                    goBack(backParams);
                }}
            />
            {fetching && <LoadingSpinner />}

            {currentMappingVersion && (
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid container spacing={4}>
                        {currentFormVersion && currentMappingVersion && (
                            <Grid item xs={4} md={3}>
                                <RecursiveTreeView
                                    formVersion={currentFormVersion}
                                    mappingVersion={currentMappingVersion}
                                    // TODO confirm this prop can safely be deleted
                                    // currentQuestion={currentQuestion}
                                    onQuestionSelected={onQuestionSelected}
                                />
                            </Grid>
                        )}
                        <Grid item xs={8} md={9}>
                            {currentQuestion == null &&
                                currentMappingVersion && (
                                    <GeneraMappingInfo
                                        applyUpdate={applyUpdate}
                                        currentMappingVersion={
                                            currentMappingVersion
                                        }
                                    />
                                )}
                            {currentQuestion && (
                                <>
                                    <QuestionInfos question={currentQuestion} />
                                    <br />
                                    {isDataElementMappable && (
                                        <QuestionMappingForm
                                            key={currentQuestion.name}
                                            mapping={currentMappingVersion}
                                            question={currentQuestion}
                                            mappingVersion={
                                                currentMappingVersion
                                            }
                                            indexedQuestions={indexedQuestions}
                                            onConfirmedQuestionMapping={
                                                onConfirmedQuestionMapping
                                            }
                                            onUnmapQuestionMapping={
                                                onUnmapQuestionMapping
                                            }
                                            onNeverMapQuestionMapping={
                                                onNeverMapQuestionMapping
                                            }
                                            fieldOptions={iasoFieldOptions(
                                                formatMessage,
                                            )}
                                            fieldTypeOptions={fieldTypeOptions(
                                                formatMessage,
                                            )}
                                        />
                                    )}
                                    {!isDataElementMappable && (
                                        <DerivedQuestionMappingForm
                                            key={currentQuestion.name}
                                            // TODO confirm this can be safely removed
                                            // mapping={currentMappingVersion}
                                            question={currentQuestion}
                                            mappingVersion={
                                                currentMappingVersion
                                            }
                                        />
                                    )}
                                </>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}
        </section>
    );
};

export default MappingDetails;
