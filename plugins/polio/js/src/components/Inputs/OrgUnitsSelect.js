import { Select } from './Select';
import { useGetOrgUnits } from '../../hooks/useGetOrgUnits';
import { useState } from 'react';
import { Field } from 'formik';

export const OrgUnitsSelect = props => {
    const { level, addLevel } = props;
    const { data = {} } = useGetOrgUnits(level);
    const { orgUnits = [] } = data;

    return (
        <Select
            {...props}
            options={orgUnits.map(orgUnit => ({
                value: orgUnit.id,
                label: orgUnit.name,
            }))}
            onChange={event => addLevel(event.target.value)}
        />
    );
};

export const OrgUnitsLevels = props => {
    const [levels, setLevel] = useState([0]);
    const addLevel = level => {
        setLevel(oldLevels => [...oldLevels, level]);
    };

    return levels.map(level => {
        return <OrgUnitsSelect {...props} level={level} addLevel={addLevel} />;
    });
};

export default OrgUnitsSelect;
