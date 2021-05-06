import { Select } from './Select';
import {
    useGetAllParentsOrgUnits,
    useGetOrgUnits,
} from '../../hooks/useGetOrgUnits';
import { useState, useEffect } from 'react';
import { useGetAuthenticatedUser } from '../../hooks/useGetAuthenticatedUser';
import { sendRequest } from '../../utils/networking';

export const OrgUnitsSelect = props => {
    const { level, source, addLevel, value } = props;
    const { data = {} } = useGetOrgUnits(level, source);
    const { orgUnits = [] } = data;

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
                addLevel({
                    parent_id: level,
                    org_unit_id: event.target.value,
                });
            }}
            value={value ?? 0}
        />
    );
};

const fetchAllParents = async initialOrgUnit => {
    if (initialOrgUnit === 0) {
        return [0];
    }

    let parent = initialOrgUnit;
    const initialState = [];
    while (parent !== 0) {
        const result = await sendRequest('GET', '/api/orgunits/' + parent);
        parent = result.parent_id ?? 0;
        initialState.unshift(parent);
    }

    return initialState;
};

export const OrgUnitsLevels = ({ field = {}, form, ...props }) => {
    const { data = {} } = useGetAuthenticatedUser();
    const source = data?.account?.default_version?.data_source?.id;
    const initialOrgUnit = form?.initialValues?.initial_org_unit ?? 0;

    const { data: initialState } = useGetAllParentsOrgUnits(initialOrgUnit);

    const [levels, setLevel] = useState([0]);

    useEffect(() => {
        setLevel(initialState ?? [0]);
    }, [initialState]);

    const { name } = field;
    const { setFieldValue } = form;

    useEffect(() => {
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
                addLevel={addLevel}
                value={levels[index + 1]}
            />
        );
    });
};

export default OrgUnitsSelect;
