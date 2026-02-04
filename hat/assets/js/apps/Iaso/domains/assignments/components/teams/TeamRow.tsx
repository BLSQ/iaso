import React, { FunctionComponent } from 'react';
import { TableCell, TableRow, Checkbox, useTheme } from '@mui/material';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';

type Props = {
    isActive: boolean;
    setSelectedRow: () => void;
    currentColor: string;
    displayName: string;
    count: number;
    onColorChange: (color: string) => void;
};

export const TeamRow: FunctionComponent<Props> = ({
    isActive,
    setSelectedRow,
    currentColor,
    displayName,
    count,
    onColorChange,
}) => {
    const theme = useTheme();
    return (
        <TableRow
            sx={{
                backgroundColor: isActive
                    ? theme.palette.grey[200]
                    : 'transparent',
            }}
        >
            <TableCell
                sx={{
                    width: 50,
                    textAlign: 'center',
                }}
            >
                <Checkbox
                    checked={isActive}
                    onChange={() => setSelectedRow()}
                />
            </TableCell>
            <TableCell
                sx={{
                    width: 50,
                    textAlign: 'center',
                }}
            >
                <ColorPicker
                    currentColor={currentColor}
                    displayLabel={false}
                    onChangeColor={color => {
                        onColorChange(color);
                    }}
                />
            </TableCell>
            <TableCell>{displayName}</TableCell>
            <TableCell
                sx={{
                    textAlign: 'center',
                }}
            >
                {count}
            </TableCell>
        </TableRow>
    );
};
