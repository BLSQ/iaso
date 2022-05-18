export const waitFor = (delay: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, delay));

export const mockGET =
    (response: Record<string, any>, delay = 500) =>
    (url: string): any => {
        console.log('getting', url);
        waitFor(delay);
        console.log('got', url);
        return response;
    };

export const mockPOST =
    (response: Record<string, any>, delay = 500) =>
    (url, data, fileData = {}): any => {
        console.log('posting', url);
        waitFor(delay);
        console.log('posted', url, data, fileData);
        return response;
    };
