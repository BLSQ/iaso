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
            onChange={event => {
                addLevel({
                    parent_id: level,
                    org_unit_id: event.target.value,
                });
            }}
        />
    );
};

export const OrgUnitsLevels = props => {
    const [levels, setLevel] = useState([0]);

    const addLevel = ({ parent_id = 0, org_unit_id }) => {
        setLevel(oldLevels => {
            const index = oldLevels.indexOf(parent_id);
            return [...oldLevels.slice(0, index + 1), org_unit_id];
        });
    };

    return levels.map(level => {
        return (
            <OrgUnitsSelect
                key={level}
                {...props}
                level={level}
                addLevel={addLevel}
            />
        );
    });
};

export default OrgUnitsSelect;
