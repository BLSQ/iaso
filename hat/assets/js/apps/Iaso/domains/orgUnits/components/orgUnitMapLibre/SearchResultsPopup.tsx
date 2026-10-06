import React, { FunctionComponent } from 'react';
import { Box, CircularProgress, Divider, Typography } from '@mui/material';
import { OrgUnit } from '../../types/orgUnit';
import { LinkToOrgUnit } from '../LinkToOrgUnit';
import { useOrgUnitsV3 } from './useOrgUnitsV3';

/** Only what the popup shows: the tiles carry no properties, the popup asks for them */
const POPUP_FIELDS = [
    'id',
    'name',
    'validation_status',
    'source_ref',
    'org_unit_type',
    'parent',
];
const NAME_FIELDS = ['id', 'name'];

type Props = {
    /** the org units under the click: several when their points overlap */
    ids: number[];
};

/** Details of the clicked org units, fetched from `/api/v3/orgunits/` on demand */
export const SearchResultsPopup: FunctionComponent<Props> = ({ ids }) => {
    const { data, isLoading } = useOrgUnitsV3(ids, POPUP_FIELDS);
    if (isLoading || !data) {
        return <CircularProgress size={20} />;
    }
    return (
        <Box sx={{ maxHeight: 260, overflowY: 'auto', minWidth: 180 }}>
            {ids.map((id, index) => {
                const orgUnit = data[id];
                if (!orgUnit) {
                    return null;
                }
                return (
                    <Box key={id}>
                        {index > 0 && <Divider sx={{ my: 0.5 }} />}
                        <Typography variant="body2" fontWeight="bold">
                            <LinkToOrgUnit
                                orgUnit={orgUnit as unknown as OrgUnit}
                            />
                        </Typography>
                        <Typography variant="caption" component="div">
                            {[
                                orgUnit.org_unit_type?.name,
                                orgUnit.parent?.name,
                                orgUnit.validation_status,
                                orgUnit.source_ref,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

/** The name of the hovered org unit, fetched on demand (and kept by react-query) */
export const HoveredOrgUnitName: FunctionComponent<{ id: number }> = ({
    id,
}) => {
    const { data } = useOrgUnitsV3([id], NAME_FIELDS);
    return <>{data?.[id]?.name ?? '…'}</>;
};
