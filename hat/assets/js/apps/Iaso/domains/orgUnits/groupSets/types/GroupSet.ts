import { Group } from './Group';
import { SourceVersion } from './SourceVersion';

export type GroupSet = {
    id: string;
    name: string;
    source_ref: string;
    source_version: SourceVersion;
    groups: Group[];
};
