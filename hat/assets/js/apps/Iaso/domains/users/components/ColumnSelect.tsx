import React, { ComponentProps } from 'react';
import { ColumnsSelectDrawer } from 'Iaso/components/tables/ColumnSelectDrawer';

type Props = Omit<
    ComponentProps<typeof ColumnsSelectDrawer>,
    'disabled' | 'minColumns'
>;

export const ColumnSelect = ({
    options,
    setOptions,
    handleApplyOptions,
    ...props
}: Props) => {
    return (
        <ColumnsSelectDrawer
            options={options}
            setOptions={setOptions}
            minColumns={2}
            handleApplyOptions={handleApplyOptions}
            disabled={false}
            {...props}
        />
    );
};
