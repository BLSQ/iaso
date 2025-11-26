import React, { FunctionComponent } from 'react';
import ObjectDumper from './ObjectDumper';

type Props = {
    question: Record<string, any>;
    mappingVersion: Record<string, any>;
};

const DerivedQuestionMappingForm: FunctionComponent<Props> = ({
    question,
    mappingVersion,
}) => (
    <>
        <h2>Aggregation</h2>
        {mappingVersion.derivate_settings.aggregations
            .filter(agg => agg.id === question.name)
            .map(agg => (
                <ObjectDumper key={agg.id} object={agg} />
            ))}
    </>
);

export default DerivedQuestionMappingForm;
