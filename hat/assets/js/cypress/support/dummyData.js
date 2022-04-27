export const makePaginatedResponse = ({
    hasPrevious = false,
    hasNext = false,
    count = 0,
    page = 1,
    pages = 1,
    limit = 10,
    dataKey,
    data = [],
}) => {
    return {
        hasPrevious,
        hasNext,
        count,
        page,
        pages,
        limit,
        [dataKey]: data,
    };
};

export const pageOneTemplate = {
    hasPrevious: false,
    hasNext: true,
    page: 1,
    pages: 2,
    limit: 10,
    count: 15,
};
export const pageTwoTemplate = {
    hasPrevious: true,
    hasNext: false,
    page: 2,
    pages: 2,
    limit: 10,
    count: 15,
};

const CREATED_AT = '2021-10-08T16:22:44.098525Z';
const UPDATED_AT = '2021-10-09T17:15:37.098551Z';

export const makeSourceVersion = ({
    versionId,
    versionNumber,
    dataSourceId,
    dataSourceName,
    description = '',
    createdAt = CREATED_AT,
    updatedAt = UPDATED_AT,
    isDefault = false,
    orgUnitsCount = 100,
}) => {
    return {
        id: versionId,
        number: versionNumber,
        data_source: dataSourceId,
        data_source_name: dataSourceName,
        created_at: createdAt,
        updated_at: updatedAt,
        org_units_count: orgUnitsCount,
        is_default: isDefault,
        description,
    };
};

export const makeSourceVersionsList = ({
    dataSourceId,
    dataSourceName,
    amount,
    versionReferenceId,
    defaultVersionIndex,
}) => {
    const versions = [];
    if (amount) {
        for (let i = 0; i <= amount; i += 1) {
            const version = makeSourceVersion({
                dataSourceId,
                dataSourceName,
                versionId: versionReferenceId + i + 1,
                versionNumber: i,
            });
            if (defaultVersionIndex === i) {
                version.is_default = true;
            }
            versions.push(version);
        }
    }
    return { versions };
};

export const makeSourceVersionsFromSeed = datasourceSeed => {
    const versions = [];
    const totalVersionsAmount = datasourceSeed.reduce(
        (total = 0, current) => current?.versions ?? 0 + total,
    );
    let currentVersion = totalVersionsAmount;
    datasourceSeed.forEach((seed, index) => {
        const versionsForSeed = makeSourceVersionsList({
            dataSourceId: seed.id,
            dataSourceName: seed.name,
            amount: index % 2 > 0 ? seed.versions : seed.versions + 1,
            defaultVersionIndex: seed.defaultVersion,
            versionReferenceId: currentVersion - totalVersionsAmount,
        });
        currentVersion += seed.versions + 1;
        versions.push(versionsForSeed.versions);
    });
    return { versions: versions.flat() };
};
export const defaultProject = {
    id: 1,
    name: 'Test Project',
    app_id: 'test.bluesquarehub.iaso',
};
export const makeDataSource = ({
    dataSourceId,
    dataSourceName,
    versions,
    description = '',
    projects = [defaultProject],
    createdAt = CREATED_AT,
    updatedAt = UPDATED_AT,
    url = null,
    defaultVersion = null,
    credentials = null,
}) => {
    return {
        id: dataSourceId,
        name: dataSourceName,
        description,
        url,
        created_at: createdAt,
        updated_at: updatedAt,
        projects,
        versions,
        default_version: defaultVersion,
        credentials,
    };
};

export const makeDataSourcesFromSeed = (datasourceSeed = [], versions) => {
    let actualVersions = versions;
    if (!versions) {
        actualVersions = makeSourceVersionsFromSeed(datasourceSeed);
    }
    const sources = datasourceSeed.map(seed => {
        const sourceVersionsForSeed = actualVersions.filter(
            sourceversion => sourceversion.data_source === seed.id,
        );
        return makeDataSource({
            dataSourceId: seed.id,
            dataSourceName: seed.name,
            versions: sourceVersionsForSeed,
            defaultVersion: sourceVersionsForSeed.filter(
                sourceVersion => seed.defaultVersion === sourceVersion.number,
            )[0],
        });
    });

    return { sources };
};

export const makeProject = ({ id, name }) => {
    return {
        id,
        name,
        app_id: 'test.bluesquarehub.iaso',
    };
};

export const makeProjects = (amount, rootName = 'Project') => {
    const projects = [];
    for (let i = 0; i <= amount; i += 1) {
        const project = makeProject({ id: i, name: `${rootName}${i}` });
        projects.push(project);
    }
    return { projects };
};

export const makeCredentials = ({ id, name = '', login = '', url = '' }) => {
    return {
        id,
        name,
        login,
        url,
        is_valid: login && url && name,
    };
};
export const makeFormVersion = ({
    id,
    versionNumber,
    formId,
    formName,
    mapped = false,
    xlsFile = null,
    file = 'https://iaso-staging.bluesquare.org',
    createdAt = 1576051064.185821,
    updatedAt = 1576051064.185861,
    startPeriod = null,
    endPeriod = null,
    mappingVersions = [],
}) => {
    return {
        id,
        version_id: versionNumber,
        form_id: formId,
        form_name: formName,
        full_name: `${formName} - V${versionNumber}`,
        mapped,
        xls_file: xlsFile,
        file,
        created_at: createdAt,
        updated_at: updatedAt,
        start_period: startPeriod,
        end_period: endPeriod,
        mapping_versions: mappingVersions,
    };
};

export const makeFormVersions = ({ formName, formId, amount }) => {
    // eslint-disable-next-line camelcase
    const formVersions = [];
    for (let i = 0; i < amount; i += 1) {
        const version = makeFormVersion({
            id: i + 1,
            versionNumber: `${i + 1}`,
            formName,
            formId,
        });
        formVersions.push(version);
    }
    return { formVersions };
};
