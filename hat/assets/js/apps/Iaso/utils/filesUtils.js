const imgExtensions = ['jpg', 'jpeg', 'JPG', 'png'];
const videoExtensions = ['mp4'];
const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];

export const getFileName = path => {
    let tempPath = path;
    if (tempPath.includes('?')) {
        [tempPath] = tempPath.split('?').slice(0);
    }
    let fullFileName = '';
    const fullFileNameArray = tempPath.split('/').slice(-1);
    if (fullFileNameArray && fullFileNameArray.length > 0) {
        [fullFileName] = fullFileNameArray;
    }
    const extensionsArray = fullFileName.match(/\.[0-9a-z]+$/i);
    let extension = '';
    if (extensionsArray) {
        [extension] = extensionsArray;
    }
    const name = fullFileName.replace(extension, '');
    return {
        name,
        extension: extension.replace('.', ''),
    };
};

export const sortFilesType = files => {
    const filesList = {
        images: [],
        videos: [],
        documents: [],
        others: [],
    };
    files.forEach(f => {
        const fileName = getFileName(f.path);
        const fullFile = {
            ...f,
            ...fileName
        };
        if (imgExtensions.indexOf(fileName.extension) !== -1) {
            filesList.images.push({...fullFile, checked: false});
        } else if (videoExtensions.indexOf(fileName.extension) !== -1) {
            filesList.videos.push(fullFile);
        } else if (documentExtensions.indexOf(fileName.extension) !== -1) {
            filesList.documents.push(fullFile);
        } else {
            filesList.others.push(fullFile);
        }
    });
    return filesList;
};
