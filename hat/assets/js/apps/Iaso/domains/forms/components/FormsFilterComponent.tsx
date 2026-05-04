import React, { useMemo, useCallback, FunctionComponent } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
    Select,
    useSafeIntl,
    renderTags,
    IconButton,
} from 'bluesquare-components';
import L from 'leaflet';
import { useGetColors, getColor } from 'Iaso/hooks/useGetColors';
import { Instance } from '../../instances/types/instance';
import { useGetInstances } from '../hooks/useGetInstances';
import MESSAGES from '../messages';
import { Form } from '../types/forms';

type instance = {
    id: number;
    form_id: Instance['form_id'];
    form_name: Instance['form_name'];
    latitude?: Instance['latitude'];
    longitude?: Instance['longitude'];
};

type newForms = {
    id: Form['id'];
    name: Form['name'];
    color: string;
    instances: instance[];
};

type Props = {
    formsSelected: newForms[];
    setFormsSelected: React.Dispatch<React.SetStateAction<any>>;
    currentOrgUnit: Record<string, any>;
    map: Record<string, any>;
};

export const FormsFilterComponent: FunctionComponent<Props> = ({
    setFormsSelected,
    formsSelected,
    currentOrgUnit,
    map,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useGetInstances({
        orgUnitId: currentOrgUnit?.id,
    });

    const { data: colors } = useGetColors(true);
    const forms = useMemo(() => {
        const newForms: newForms[] = [];
        if (data?.instances) {
            const uniqueFormIds = new Set(
                data.instances.map((i: instance) => i.form_id),
            );

            data.instances.forEach((i: instance) => {
                if (uniqueFormIds.has(i.form_id)) {
                    const exisitingFormIndex = newForms.findIndex(
                        f => f.id === i.form_id,
                    );
                    if (exisitingFormIndex === -1) {
                        newForms.push({
                            id: i.form_id,
                            name: i.form_name,
                            color: getColor(newForms.length, colors),
                            instances: [i],
                        });
                    } else {
                        newForms[exisitingFormIndex].instances.push(i);
                    }
                }
            });
        }
        return newForms;
    }, [data, colors]);

    const computedBounds = useMemo(() => {
        const latLngs = formsSelected
            .flatMap((form: newForms) => form.instances || [])
            .filter((i: instance) => i.latitude && i.longitude)
            .map((i: instance) =>
                L.latLng(i.latitude as number, i.longitude as number),
            );
        if (latLngs.length === 0) return undefined;
        const bounds = L.latLngBounds(latLngs);
        return bounds.isValid() ? bounds : undefined;
    }, [formsSelected]);

    const canFitToBounds = computedBounds && map && map.current;
    const triggerFitBounds = useCallback(() => {
        if (canFitToBounds) {
            map.current.fitBounds(computedBounds, {
                padding: [10, 10],
                maxZoom: 18,
            });
        }
    }, [canFitToBounds, computedBounds, map]);

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
                        getOptionLabel={(option: newForms) =>
                            option && option.name
                        }
                        getOptionSelected={(
                            option: newForms,
                            val: newForms,
                        ) => {
                            return val && option.id === val.id;
                        }}
                        options={forms}
                        returnFullObject
                        onChange={newValue => {
                            setFormsSelected(newValue || []);
                        }}
                        renderTags={renderTags((o: newForms) => o.name)}
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
