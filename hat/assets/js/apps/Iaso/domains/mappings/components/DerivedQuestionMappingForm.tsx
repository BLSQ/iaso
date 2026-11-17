import React, { FunctionComponent } from 'react';
import ObjectDumper from './ObjectDumper';
import { MappingCard } from './QuestionPanel/MappingCard';

type Aggregation = { id: string } & Record<string, unknown>;

type Props = {
    question: Record<string, any>;
    mappingVersion: {
        derivate_settings?: { aggregations?: Aggregation[] } | null;
    };
};

const DerivedQuestionMappingForm: FunctionComponent<Props> = ({
    question,
    mappingVersion,
}) => (
    <MappingCard title="Aggregation">
        {(mappingVersion.derivate_settings?.aggregations ?? [])
            .filter(agg => agg.id === question.name)
            .map(agg => (
                <ObjectDumper key={agg.id} object={agg} />
            ))}
    </MappingCard>
);

export default DerivedQuestionMappingForm;
