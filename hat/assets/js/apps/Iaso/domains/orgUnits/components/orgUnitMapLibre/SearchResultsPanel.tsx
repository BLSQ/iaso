import React, { FunctionComponent } from 'react';
import {
    Box,
    Button,
    FormControlLabel,
    LinearProgress,
    Paper,
    Switch,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { TileJSON } from './orgUnitTiles';

export type CutTiles = { kept: number; count: number };

export type SearchResults = {
    /** position of the search on the page, for its label */
    index: number;
    color: string;
    tileJSON?: TileJSON;
    isLoading: boolean;
    unsupported: string[];
    cut?: CutTiles;
};

type Props = {
    results: SearchResults[];
    clusters: boolean;
    onClustersChange: (clusters: boolean) => void;
    /** fitted to `bounds` rather than `fit_bounds` */
    showsAll: boolean;
    onShowAllChange: (showAll: boolean) => void;
};

/**
 * What the map can't show by itself: how many results each search has and how many are on the map (instead of
 * the leaflet map's location limit), the outliers left out of the view, the filters the map can't apply and the
 * tiles cut for having too many features.
 */
export const SearchResultsPanel: FunctionComponent<Props> = ({
    results,
    clusters,
    onClustersChange,
    showsAll,
    onShowAllChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const outliers = results.reduce(
        (total, { tileJSON }) => total + (tileJSON?.outside_fit_bounds ?? 0),
        0,
    );
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
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
            >
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={clusters}
                            onChange={event =>
                                onClustersChange(event.target.checked)
                            }
                        />
                    }
                    label={
                        <Typography variant="body2">
                            {formatMessage(MESSAGES.mapLibreClusters)}
                        </Typography>
                    }
                />
                {(outliers > 0 || showsAll) && (
                    <Button
                        size="small"
                        onClick={() => onShowAllChange(!showsAll)}
                    >
                        {formatMessage(
                            showsAll
                                ? MESSAGES.mapLibreFitResults
                                : MESSAGES.mapLibreShowAll,
                        )}
                    </Button>
                )}
            </Box>
        </Paper>
    );
};
