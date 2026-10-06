import React, { FunctionComponent } from 'react';
import {
    Box,
    Checkbox,
    FormControlLabel,
    LinearProgress,
    Paper,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { TileJSON } from './orgUnitTiles';

export type CutTiles = { kept: number; count: number };

/** An org unit type of the results, in the legend */
export type LegendType = {
    /** `typeKey` of its id */
    key: number;
    name: string | null;
    color: string;
    located_count: number;
    hidden: boolean;
};

export type SearchResults = {
    /** position of the search on the page, for its label */
    index: number;
    color: string;
    tileJSON?: TileJSON;
    isLoading: boolean;
    unsupported: string[];
    cut?: CutTiles;
    /** drawn by org unit type: its types */
    legend?: LegendType[];
};

type Props = {
    results: SearchResults[];
    onToggleType: (key: number) => void;
};

/**
 * What the map can't show by itself: how many results each search has and how many are on the map (instead of
 * the leaflet map's location limit), the outliers left out of the view, the filters the map can't apply and the
 * tiles cut for having too many features - and for a search drawn by type, the legend of its types, each one
 * shown or hidden by its checkbox.
 */
export const SearchResultsPanel: FunctionComponent<Props> = ({
    results,
    onToggleType,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper
            elevation={2}
            sx={{
                position: 'absolute',
                top: 8,
                // left of the basemap switch (`TilesSwitchControl`, top right), and under it: its open menu
                // covers the panel rather than hiding behind it
                right: 44,
                zIndex: 499,
                p: 1.5,
                width: 280,
                maxHeight: 'calc(100% - 60px)',
                overflowY: 'auto',
            }}
        >
            {results.map(result => (
                <Box key={result.index} mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: result.color,
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="subtitle2">
                            {formatMessage(MESSAGES.mapLibreSearch, {
                                index: String(result.index + 1),
                            })}
                        </Typography>
                    </Box>
                    {result.isLoading && <LinearProgress />}
                    {result.tileJSON && (
                        <Typography variant="body2">
                            {formatMessage(MESSAGES.mapLibreResultsCount, {
                                count: result.tileJSON.count.toLocaleString(),
                                located:
                                    result.tileJSON.located_count.toLocaleString(),
                            })}
                        </Typography>
                    )}
                    {result.legend?.map(type => {
                        const name =
                            type.name ?? formatMessage(MESSAGES.mapLibreNoType);
                        return (
                            <FormControlLabel
                                key={type.key}
                                sx={{ display: 'flex', mx: 0 }}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={!type.hidden}
                                        onChange={() => onToggleType(type.key)}
                                        sx={{
                                            p: 0.25,
                                            mr: 0.5,
                                            color: type.color,
                                            '&.Mui-checked': {
                                                color: type.color,
                                            },
                                        }}
                                    />
                                }
                                componentsProps={{
                                    typography: { sx: { flexGrow: 1 } },
                                }}
                                label={
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                    >
                                        <Typography
                                            variant="body2"
                                            color={
                                                type.hidden
                                                    ? 'text.disabled'
                                                    : undefined
                                            }
                                        >
                                            {name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            ml={1}
                                        >
                                            {type.located_count.toLocaleString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        );
                    })}
                    {result.tileJSON?.outside_fit_bounds ? (
                        <Typography variant="caption" component="div">
                            {formatMessage(MESSAGES.mapLibreOutliers, {
                                count: result.tileJSON.outside_fit_bounds.toLocaleString(),
                            })}
                        </Typography>
                    ) : null}
                    {result.unsupported.length > 0 && (
                        <Typography
                            variant="caption"
                            component="div"
                            color="warning.main"
                        >
                            {formatMessage(MESSAGES.mapLibreUnsupported, {
                                keys: result.unsupported.join(', '),
                            })}
                        </Typography>
                    )}
                    {result.cut && (
                        <Typography
                            variant="caption"
                            component="div"
                            color="warning.main"
                        >
                            {formatMessage(MESSAGES.mapLibreCutTiles, {
                                kept: result.cut.kept.toLocaleString(),
                                count: result.cut.count.toLocaleString(),
                            })}
                        </Typography>
                    )}
                </Box>
            ))}
        </Paper>
    );
};
