class EventDispatcher {
    // eslint-disable-next-line no-unused-vars
    private listeners: { [key: string]: ((data: any) => void)[] };

    constructor() {
        this.listeners = {};
    }

    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(
                listener => listener !== callback,
            );
        }
    }

    dispatch(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

export const dispatcher = new EventDispatcher();
