import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@material-ui/core';
import { Select } from './Select';
import {
    useGetAllParentsOrgUnits,
    useGetOrgUnits,
} from '../../hooks/useGetOrgUnits';
import { useGetAuthenticatedUser } from '../../hooks/useGetAuthenticatedUser';

export const OrgUnitsSelect = props => {
    const { level, source, onChange, value } = props;
    const { data = {}, isLoading } = useGetOrgUnits(level, source);
    const { orgUnits = [] } = data;

    if (isLoading) {
        return (
            <div>
                <CircularProgress />
            </div>
        );
    }

    if (orgUnits.length === 0) {
        return null;
    }

    return (
        <Select
            {...props}
            options={orgUnits.map(orgUnit => ({
                value: orgUnit.id,
                label: orgUnit.name,
            }))}
            onChange={event => {
                onChange({
                    parent_id: level,
                    org_unit_id: event.target.value,
                });
            }}
            value={value ?? ''}
        />
    );
};

export const OrgUnitsLevels = ({ field = {}, form, ...props }) => {
    const { data = {} } = useGetAuthenticatedUser();
    const source = data?.account?.default_version?.data_source?.id;
    const startOrgUnit = data?.org_units?.[0]?.id ?? null;
    const initialOrgUnit =
        form?.initialValues?.initial_org_unit ?? startOrgUnit;

    const { data: initialState } = useGetAllParentsOrgUnits(initialOrgUnit);
    const [levels, setLevel] = useState([null]);

    useEffect(() => {
        setLevel(initialState ?? [null]);
    }, [initialState]);

    const { name } = field;
    const { setFieldValue } = form;

    useEffect(() => {
        if (!levels[levels.length - 1]) {
            return;
        }

        setFieldValue(name, levels[levels.length - 1]);
    }, [levels, name, setFieldValue]);

    const addLevel = ({ parent_id = 0, org_unit_id }) => {
        setLevel(oldLevels => {
            const index = oldLevels.indexOf(parent_id);
            return [...oldLevels.slice(0, index + 1), org_unit_id];
        });
    };

    return levels.map((level, index) => {
        return (
            <OrgUnitsSelect
                {...props}
                key={level}
                source={source}
                label={`Level ${index + 1}`}
                level={level}
                onChange={addLevel}
                value={levels[index + 1]}
            />
        );
    });
};

export default OrgUnitsSelect;
