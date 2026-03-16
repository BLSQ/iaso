import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    SortableTable,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../messages';
import { Filters } from './Filters';
import { useSortableTableState } from './useSortableTableState';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

export const WorkflowConfiguration: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.instanceValidation);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    // const { items, handleSortChange } = useSortableTableState();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.configureInstancesValidation)}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                Workflow config
            </Box>
            {/* <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Filters params={params} />
                <SortableTable
                    items={items}
                    // @ts-ignore
                    onChange={handleSortChange}
                    columns={followUpsColumns as ColumnWithAccessor[]}
                />
            </Box> */}
        </>
    );
};
