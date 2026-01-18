import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import {
    Bar,
    BarChart,
    CartesianGrid,
    // Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useGetColors, getColor } from 'Iaso/hooks/useGetColors';

type Data = {
    index: string;
    name: string;
    [key: string]: string | number | null;
}[];

type Field = {
    name: string;
    type: string;
    freq?: string;
};

type Schema = {
    fields: Field[];
    pandas_version: string;
    primaryKey: string[];
};

type Props = {
    data: {
        data: Data;
        schema: Schema;
    };
    isLoading: boolean;
};
export const InstancesPerFormGraph: FunctionComponent<Props> = ({
    data,
    isLoading,
}) => {
    const { data: colors } = useGetColors(true);
    return (
        <>
            <Typography variant="h5">
                <FormattedMessage
                    id="iaso.form.stats.submissionsPerMonthTitle"
                    defaultMessage="New submissions per month"
                />
            </Typography>
            {isLoading && <LoadingSpinner fixed={false} />}
            {data && (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                        width={500}
                        height={300}
                        data={data.data}
                        margin={{
                            top: 20,
                            right: 0,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        {data.data?.length > 0 && <XAxis dataKey="name" />}
                        <YAxis />
                        <Tooltip />
                        {/* <Legend /> */}
                        {data.schema.fields
                            .filter(f => f.type === 'number')
                            .map((f, i) => (
                                <Bar
                                    key={f.name}
                                    dataKey={f.name}
                                    stackId="a"
                                    fill={getColor(i, colors)}
                                />
                            ))}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </>
    );
};
