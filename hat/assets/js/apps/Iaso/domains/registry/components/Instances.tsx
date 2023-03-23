import React, { FunctionComponent, useState } from 'react';
import { Box, Tabs, Tab, Grid } from '@material-ui/core';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import InputComponent from '../../../components/forms/InputComponent';

import { redirectToReplace } from '../../../routing/actions';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes, OrgunitType } from '../../orgUnits/types/orgunitTypes';
import { Form } from '../../forms/types/forms';
import { RegistryDetailParams } from '../types';

import { useGetForms } from '../hooks/useGetForms';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

type Props = {
    orgUnit?: OrgUnit;
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypes;
    childrenOrgUnits: OrgUnit[];
    params: RegistryDetailParams;
};

// Select a form
// fetch instances with org unit of org unit type selected using this form

export const Instances: FunctionComponent<Props> = ({
    orgUnit,
    isLoading,
    subOrgUnitTypes,
    childrenOrgUnits,
    params,
}) => {
    const { formId } = params;
    const [currentType, setCurrentType] = useState<OrgunitType | undefined>();

    const dispatch = useDispatch();

    const { data: formsList, isFetching: isFetchingForms } = useGetForms();

    const handleFilterChange = (key: string, value: number | string) => {
        dispatch(
            redirectToReplace(baseUrls.registryDetail, {
                ...params,
                [key]: value,
            }),
        );
    };

    useSkipEffectOnMount(() => {
        if (subOrgUnitTypes?.length > 0 && !currentType) {
            setCurrentType(subOrgUnitTypes[0]);
        }
    }, [subOrgUnitTypes]);
    return (
        <Box>
            {currentType && !isLoading && (
                <>
                    <Tabs
                        value={currentType}
                        onChange={(_, newtab) => setCurrentType(newtab)}
                    >
                        {subOrgUnitTypes.map(subType => (
                            <Tab
                                value={subType}
                                label={subType.name}
                                key={subType.id}
                            />
                        ))}
                    </Tabs>
                    <Box mt={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <InputComponent
                                    required
                                    keyValue="formId"
                                    clearable={false}
                                    onChange={handleFilterChange}
                                    disabled={isFetchingForms}
                                    loading={isFetchingForms}
                                    value={formId}
                                    type="select"
                                    options={
                                        formsList?.map(t => ({
                                            label: t.name,
                                            value: t.id,
                                        })) || []
                                    }
                                    label={MESSAGES.form}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </>
            )}
        </Box>
    );
};
