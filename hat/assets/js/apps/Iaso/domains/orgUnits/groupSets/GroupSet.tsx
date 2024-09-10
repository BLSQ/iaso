import React, { useMemo } from 'react';
import TopBar from '../../../components/nav/TopBarComponent';
import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { useGetGroupSet } from './hooks/requests';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { useGetGroupDropdown } from '../../orgUnits/hooks/requests/useGetGroups';
import InputComponent from '../../../components/forms/InputComponent';
import { Grid } from '@mui/material';
import { useDataSourceVersions } from '../../dataSources/requests';

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

    const isLoading = isFetching || isFetchingGroups;
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={
                    formatMessage(MESSAGES.groupSet) +
                    (groupSet ? ' - ' + groupSet.name : '')
                }
                displayBackButton={true}
                goBack={() => goBack()}
            />
            <div style={{ margin: '20px' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <InputComponent
                            keyValue="name"
                            value={groupSet?.name}
                            type="text"
                            label={MESSAGES.name}
                            loading={isLoading}
                            blockForbiddenChars
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <InputComponent
                            keyValue="sourceVersion"
                            value={groupSet?.source_version?.id}
                            type="select"
                            options={sourceVersionsDropDown}
                            label={MESSAGES.sourceVersion}
                            loading={areSourceVersionsLoading}
                            blockForbiddenChars
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <InputComponent
                            keyValue="groupIds"
                            type="select"
                            disabled={isFetchingGroups}
                            value={
                                groupSet?.groups
                                    ? groupSet.groups.map(g => g.id)
                                    : []
                            }
                            label={MESSAGES.groups}
                            options={groups}
                            loading={isFetchingGroups}
                            multi
                        />
                    </Grid>
                </Grid>
            </div>
        </>
    );
};

export default GroupSet;
