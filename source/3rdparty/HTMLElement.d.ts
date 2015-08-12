interface HTMLElement {
    mozRequestFullScreen: () => void;
    msExitFullscreen: () => void;
    msFullscreenElement: () => void;
    msRequestFullscreen: () => void;
    requestFullscreen: () => void;
    //Make TypeScript 1.5.4 happy webkitRequestFullscreen: (arg: any) => void;
    webkitRequestFullscreen: () => void;
}
