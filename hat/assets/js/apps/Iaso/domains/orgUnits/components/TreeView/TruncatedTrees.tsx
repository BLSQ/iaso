import React, { FunctionComponent, ReactNode, useCallback } from 'react';

import { Box } from '@mui/material';
import { TruncatedTreeview } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { OrgUnit } from '../../types/orgUnit';

type TreeData = Map<string, any>;

type Props = {
    treesData: TreeData;
    disabled: boolean;
    label: (orgUnit: OrgUnit) => ReactNode;
    placeholderStyle: string;
    formattedPlaceholder: string;
};

export const TruncatedTrees: FunctionComponent<Props> = ({
    treesData,
    disabled,
    label,
    placeholderStyle,
    formattedPlaceholder,
}) => {
    const redirect = useCallback(
        (id: string) => {
            if (!disabled) {
                window.open(
                    `/dashboard/${baseUrls.orgUnitDetails}/orgUnitId/${id}`,
                    '_blank',
                );
            }
        },
        [disabled],
    );
    if (treesData.size === 0) {
        return (
            <div role="button" tabIndex={0} className={placeholderStyle}>
                {formattedPlaceholder}
            </div>
        );
    }

    const treeviews = Array.from(treesData, ([key, value]) => (
        <TruncatedTreeview
            selectedItems={value}
            key={`TruncatedTree${key}`}
            label={label}
            disabled={disabled}
            redirect={redirect}
        />
    ));

    return (
        <Box
            sx={{
                alignItems: 'center',
                fontSize: '16px',
                flex: '1',
                marginLeft: '10px',
            }}
        >
            {treeviews}
        </Box>
    );
};
