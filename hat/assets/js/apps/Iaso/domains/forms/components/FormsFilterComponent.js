/* eslint-disable react/function-component-definition */
import React, { useMemo } from 'react';

import { Box, Typography, Grid } from '@mui/material';

import {
    Select,
    useSafeIntl,
    renderTags,
    IconButton,
} from 'bluesquare-components';
import L from 'leaflet';
import PropTypes from 'prop-types';

import { getChipColors } from '../../../constants/chipColors';

import { useGetInstances } from '../hooks/useGetInstances';

import MESSAGES from '../messages';

export const FormsFilterComponent = ({
    setFormsSelected,
    formsSelected,
    currentOrgUnit,
    map,
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
                }
            });
        }
        return newForms;
    }, [data]);

    const computedBounds = useMemo(() => {
        const latLngs = formsSelected
            .flatMap(form => form.instances || [])
            .filter(i => i.latitude && i.longitude)
            .map(i => L.latLng(i.latitude, i.longitude));
        if (latLngs.length === 0) return undefined;
        const bounds = L.latLngBounds(latLngs);
        return bounds.isValid() ? bounds : undefined;
    }, [formsSelected]);

    const canFitToBounds = computedBounds && map && map.current;
    const triggerFitBounds = () => {
        if (canFitToBounds) {
            map.current.fitBounds(computedBounds, {
                padding: [10, 10],
                maxZoom: 18,
            });
        }
    };

    return (
        <Box m={4}>
            <Box mb={2}>
                <Typography variant="body2">
                    {formatMessage(MESSAGES.hasInstances)}:
                </Typography>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={10}>
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
                </Grid>
                <Grid
                    item
                    xs={2}
                    display="flex"
                    justifyContent="flex-start"
                    alignItems="center"
                >
                    <IconButton
                        onClick={triggerFitBounds}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.fitToFormsBounds}
                        disabled={!canFitToBounds}
                    />
                </Grid>
            </Grid>
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
    map: PropTypes.object.isRequired,
};

export default FormsFilterComponent;
