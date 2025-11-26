import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Select, renderTags, useSafeIntl } from 'bluesquare-components';
import { ExtendedDataSource, fetchAssociatedOrgUnits } from '../requests';
import { getSourcesWithoutCurrentSource } from '../utils';
import MESSAGES from '../../forms/messages';
import { OrgUnit } from '../types/orgUnit';

type Props = {
    sourcesSelected: ExtendedDataSource[];
    setSourcesSelected: React.Dispatch<
        React.SetStateAction<ExtendedDataSource[]>
    >;
    currentSources: any[];
    currentOrgUnit: OrgUnit;
    loadingSelectedSources?: boolean;
};

const SourcesFilterComponent: FunctionComponent<Props> = ({
    sourcesSelected,
    setSourcesSelected,
    currentSources,
    currentOrgUnit,
    loadingSelectedSources = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const [isLoading, setIsLoading] = useState(loadingSelectedSources);
    useEffect(() => {
        setIsLoading(loadingSelectedSources);
    }, [loadingSelectedSources]);
    if (!currentOrgUnit) return null;
    const sources = getSourcesWithoutCurrentSource(
        currentSources,
        currentOrgUnit.source_id,
    );
    const handleChange = async newSources => {
        if (!newSources) {
            setSourcesSelected([]);
        } else {
            const fullSources = [...newSources];
            setIsLoading(true);
            for (let i = 0; i < newSources.length; i += 1) {
                const ss = newSources[i];
                if (!ss.orgUnits) {
                    // eslint-disable-next-line no-await-in-loop
                    const detail = await fetchAssociatedOrgUnits(
                        ss,
                        currentOrgUnit,
                    );
                    fullSources[i] = detail;
                }
            }
            setIsLoading(false);
            setSourcesSelected(fullSources || []);
        }
    };
    return (
        <Box m={4}>
            <Box mb={2}>
                <Typography variant="body2">
                    {formatMessage(MESSAGES.sourcesHelperText)}:
                </Typography>
            </Box>
            <Select
                keyValue="sources"
                label={formatMessage(MESSAGES.sources)}
                disabled={sources.length === 0}
                loading={isLoading}
                clearable
                multi
                value={sourcesSelected}
                getOptionLabel={option => option?.name}
                getOptionSelected={(option, val) => {
                    return val && option.id === val.id;
                }}
                options={sources}
                returnFullObject
                onChange={handleChange}
                renderTags={renderTags(o => o.name)}
            />
        </Box>
    );
};

export default SourcesFilterComponent;
