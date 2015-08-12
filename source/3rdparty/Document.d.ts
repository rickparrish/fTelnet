interface Document {
    //Make TypeScript 1.5.4 happy exitFullscreen: () => void;
    mozCancelFullScreen: () => void;
    //Make TypeScript 1.5.4 happy webkitExitFullscreen: () => void;
    //Make TypeScript 1.5.4 happy fullscreenElement: () => void;
    mozFullScreenElement: () => void;
    //Make TypeScript 1.5.4 happy webkitFullscreenElement: () => void;
    msExitFullscreen: () => void;
    msFullscreenElement: () => void;
    msRequestFullscreen: () => void;
} 