import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History } from '@mui/icons-material';
import { Grid, Box, LinearProgress, Typography, useTheme } from '@mui/material';

import {
    commonStyles,
    ExternalLink,
    LoadingSpinner,
    useRedirectToReplace,
    useSafeIntl,
    useGoBack,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { SxStyles } from '../../types/general';
import DerivedQuestionMappingForm from './components/DerivedQuestionMappingForm';
import GeneraMappingInfo from './components/GeneraMappingInfo';
import { MappingImportActions } from './components/ImportMappings/MappingImportActions';
import QuestionInfos from './components/QuestionInfos';
import QuestionMappingForm from './components/QuestionMappingForm';
import { QuestionTree } from './components/QuestionTree/QuestionTree';
import Descriptor from './descriptor';
import {
    useApplyPartialUpdate,
    useApplyUpdate,
    useGetMappingVersionDetail,
} from './hooks';
import { getMappableQuestions } from './importMappings';
import MESSAGES from './messages';
import {
    buildQuestionTree,
    countByStatus,
    getFirstUnmappedNode,
    getMappingProgress,
    getQuestionStatus,
} from './questionTree';
import { ORG_UNIT_IASO_FIELD, VALUE_FROM_FORM } from './utils';

const baseUrl = baseUrls.mappingDetail;

// grey canvas of the redesign, so the white cards stand out
const PAGE_BACKGROUND = '#edf1f4';

const styles: SxStyles = {
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        mb: 2,
    },
    progress: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: '1 1 auto',
    },
    progressBar: {
        width: 220,
        height: 5,
        borderRadius: 1,
    },
    linkWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5em',
    },
};

const iasoFieldOptions = formatMessage => [
    { value: VALUE_FROM_FORM, label: formatMessage(MESSAGES.useValueFromForm) },
    {
        value: ORG_UNIT_IASO_FIELD,
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

const MappingDetails = () => {
    const redirectToReplace = useRedirectToReplace();
    const theme = useTheme();
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

    const mappableQuestions = useMemo(
        () => getMappableQuestions(currentFormVersion?.descriptor),
        [currentFormVersion],
    );

    const questionTree = useMemo(
        () =>
            buildQuestionTree(
                currentFormVersion?.descriptor,
                currentMappingVersion?.question_mappings ?? {},
            ),
        [currentFormVersion, currentMappingVersion],
    );
    const statusCounts = useMemo(
        () => countByStatus(questionTree),
        [questionTree],
    );
    const progress = getMappingProgress(statusCounts);
    const firstUnmappedQuestion = useMemo(
        () => getFirstUnmappedNode(questionTree)?.question,
        [questionTree],
    );

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

    const onClearSelection = useCallback(() => {
        redirectToReplace(baseUrls.mappingDetail, {
            mappingVersionId: params.mappingVersionId,
        });
        setCurrentQuestion(undefined);
    }, [redirectToReplace, params.mappingVersionId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            // Escape also closes dialogs and clears inputs
            if (
                event.key !== 'Escape' ||
                !currentQuestion ||
                target.closest('input, textarea, [role="dialog"]')
            ) {
                return;
            }
            onClearSelection();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestion, onClearSelection]);

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
        <Box component="section" sx={commonStyles(theme).relativeContainer}>
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
                <Box
                    sx={{
                        ...commonStyles(theme).containerFullHeightNoTabPadded,
                        backgroundColor: PAGE_BACKGROUND,
                    }}
                >
                    <Box sx={styles.actions}>
                        <Box sx={styles.progress}>
                            <Typography variant="body2" color="textSecondary">
                                {formatMessage(MESSAGES.mappedProgress, {
                                    mapped: progress.mapped,
                                    total: progress.total,
                                })}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={progress.percent}
                                sx={styles.progressBar}
                            />
                        </Box>
                        <ExternalLink
                            url={`/${baseUrls.apiLogs}/?objectId=${currentMappingVersion.id}&contentType=iaso.mappingversion&fields=field_diffs`}
                        >
                            <Typography sx={styles.linkWithIcon}>
                                <History />
                                {formatMessage(MESSAGES.changeLog)}
                            </Typography>
                        </ExternalLink>
                        {currentFormVersion && isDataElementMappable && (
                            <MappingImportActions
                                mappingVersion={currentMappingVersion}
                                questions={mappableQuestions}
                            />
                        )}
                    </Box>
                    <Grid container spacing={4}>
                        {currentFormVersion && currentMappingVersion && (
                            <Grid item xs={12} md={5} lg={4}>
                                <QuestionTree
                                    nodes={questionTree}
                                    selectedKey={
                                        currentQuestion
                                            ? Descriptor.getKey(currentQuestion)
                                            : undefined
                                    }
                                    onSelect={onQuestionSelected}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} md={7} lg={8}>
                            {currentQuestion == null &&
                                currentMappingVersion && (
                                    <GeneraMappingInfo
                                        applyUpdate={applyUpdate}
                                        currentMappingVersion={
                                            currentMappingVersion
                                        }
                                        statusCounts={statusCounts}
                                        onNextUnmapped={
                                            firstUnmappedQuestion
                                                ? () =>
                                                      onQuestionSelected(
                                                          firstUnmappedQuestion,
                                                      )
                                                : undefined
                                        }
                                    />
                                )}
                            {currentQuestion && (
                                <>
                                    <QuestionInfos
                                        question={currentQuestion}
                                        status={getQuestionStatus(
                                            currentMappingVersion
                                                .question_mappings[
                                                Descriptor.getKey(
                                                    currentQuestion,
                                                )
                                            ],
                                        )}
                                        groupLabel={Descriptor.getHumanLabel(
                                            indexedQuestions[
                                                currentQuestion.parentName
                                            ],
                                        )}
                                        onClose={onClearSelection}
                                    />
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
        </Box>
    );
};

export default MappingDetails;
