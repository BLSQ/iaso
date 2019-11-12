const imgExtensions = ['jpg', 'JPG', 'png'];
const videoExtensions = ['mp4'];
const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];

export const getFileName = (path) => {
    const fullName = path.split('/').slice(-1)[0].split('.');
    return ({
        name: fullName[0],
        extension: fullName[1],
    });
};


export const sortFilesType = (files) => {
    const filesList = {
        images: [],
        videos: [],
        documents: [],
        others: [],
    };
    files.forEach((f) => {
        const fileName = getFileName(f.path);
        const fullFile = {
            ...f,
            ...fileName,
        };
        if (imgExtensions.indexOf(fileName.extension) !== -1) {
            filesList.images.push(fullFile);
        } else if (videoExtensions.indexOf(fileName.extension) !== -1) {
            filesList.videos.push(fullFile);
        } else if (documentExtensions.indexOf(fileName.extension) !== -1) {
            filesList.documents.push(fullFile);
        } else {
            filesList.others.push(fullFile);
        }
    });
    return (filesList);
};
