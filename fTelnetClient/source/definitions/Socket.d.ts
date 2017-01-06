declare class Socket {
    public open(host: string, port: number, onSuccess?: () => void, onError?: (message: string) => void): void;
    public write(data: Uint8Array, onSuccess?: () => void, onError?: (message: string) => void): void;
    public shutdownWrite(onSuccess?: () => void, onError?: (message: string) => void): void;
    public close(onSuccess?: () => void, onError?: (message: string) => void): void;
    public onData: (data: Uint8Array) => void;
    public onClose: (hasError: boolean) => void;
    public onError: (message: string) => void;
    public state: Socket.State;
}

declare module Socket {
    enum State {
        CLOSED,
        OPENING,
        OPENED,
        CLOSING
    }
}