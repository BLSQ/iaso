import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import { Chip, Box, Typography } from '@material-ui/core';

import { Select, useSafeIntl } from 'bluesquare-components';

import { getChipColors } from '../../../constants/chipColors';

import { useGetInstances } from '../hooks/useGetInstances';

import MESSAGES from '../messages';

export const FormsFilterComponent = ({ setFormsSelected, formsSelected }) => {
    const { formatMessage } = useSafeIntl();
    const currentOrgUnit = useSelector(state => state.orgUnits.current);
    const { data, isLoading } = useGetInstances({
        orgUnitId: currentOrgUnit?.id,
    });

    const forms = useMemo(() => {
        const newForms = [];
        if (data?.instances) {
            data.instances.forEach(i => {
                const exisitingFormIndex = newForms.findIndex(
                    f => f.id === i.form_id,
                );
                if (exisitingFormIndex) {
                    newForms.push({
                        id: i.form_id,
                        name: i.form_name,
                        color: getChipColors(newForms.length, true),
                        instances: [i],
                    });
                } else {
                    newForms[exisitingFormIndex].instances.push(i);
                }
            });
        }
        return newForms;
    }, [data]);

    return (
        <Box m={4}>
            <Box mb={2}>
                <Typography variant="body2">
                    {formatMessage(MESSAGES.hasInstances)}:
                </Typography>
            </Box>
            <Select
                keyValue="forms"
                label={formatMessage(MESSAGES.forms)}
                disabled={forms.length === 0}
                loading={isLoading}
                clearable
                multi
                value={formsSelected}
                getOptionLabel={option => option && option.name}
                getOptionSelected={(option, val) => {
                    return val && option.id === val.id;
                }}
                options={forms}
                returnFullObject
                onChange={newValue => {
                    setFormsSelected(newValue || []);
                }}
                renderTags={(tagValue, getTagProps) =>
                    tagValue
                        .filter(option => option)
                        .map((option, index) => (
                            <Chip
                                style={{
                                    backgroundColor: option.color,
                                    color: 'white',
                                }}
                                label={option.name}
                                {...getTagProps({ index })}
                            />
                        ))
                }
            />
        </Box>
    );
};

FormsFilterComponent.defaultProps = {
    setFormsSelected: () => null,
};

FormsFilterComponent.propTypes = {
    formsSelected: PropTypes.array.isRequired,
    setFormsSelected: PropTypes.func,
};

export default FormsFilterComponent;
