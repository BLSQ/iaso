import { Select } from './Select';
import { useGetOrgUnits } from '../../hooks/useGetOrgUnits';
import { useState } from 'react';
import { Field } from 'formik';

export const OrgUnitsSelect = props => {
    const { level, addLevel } = props;
    const { data = {} } = useGetOrgUnits(level.parent);
    const { orgUnits = [] } = data;

    console.log(orgUnits);

    return (
        <Select
            {...props}
            options={orgUnits.map(orgUnit => ({
                value: orgUnit.id,
                label: orgUnit.name,
            }))}
            onChange={event => {
                const nextIndex = level.index + 1;

                addLevel({ index: nextIndex, parent: event.target.value });
            }}
        />
    );
};

export const OrgUnitsLevels = props => {
    const [levels, setLevel] = useState([{ index: 0, parent: 0 }]);
    const addLevel = value => {
        setLevel(oldLevels => {
            return [
                ...oldLevels.filter(level => level.index < value.index),
                value,
            ];
        });
    };

    return levels.map(level => {
        return (
            <OrgUnitsSelect
                key={level.index}
                {...props}
                level={level}
                addLevel={addLevel}
            />
        );
    });
};

export default OrgUnitsSelect;
