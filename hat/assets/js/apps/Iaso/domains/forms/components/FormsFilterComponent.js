import React, { useMemo } from 'react';

import PropTypes from 'prop-types';

import { Box, Typography } from '@material-ui/core';

import { Select, useSafeIntl, renderTags } from 'bluesquare-components';

import { getChipColors } from '../../../constants/chipColors';

import { useGetInstances } from '../hooks/useGetInstances';

import MESSAGES from '../messages';

export const FormsFilterComponent = ({
    setFormsSelected,
    formsSelected,
    currentOrgUnit,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useGetInstances({
        orgUnitId: currentOrgUnit?.id,
    });

    const forms = useMemo(() => {
        const newForms = [];
        if (data?.instances) {
            const uniqueFormIds = new Set(data.instances.map(i => i.form_id));

            data.instances.forEach(i => {
                if (uniqueFormIds.has(i.form_id)) {
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
                    uniqueFormIds.delete(i.form_id);
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
                label={formatMessage(MESSAGES.title)}
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
                renderTags={renderTags(o => o.name)}
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
    currentOrgUnit: PropTypes.object.isRequired,
};

export default FormsFilterComponent;
