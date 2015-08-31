/// <reference path='source/fTelnet.ts' />

// TODO List:
// Implemented copy/paste support, future improvements:
//  - Do like putty and inverse selected region so it's easy to see what you're copying
// Make scrollback size configurable
// Update docs/embed wizard to allow use of NO_RIP and NO_RIP_OR_XFER branches (they're much smaller .js files)
// RIP fonts need to be optimized
// Resize window in RIP mode changed font size, and it shouldn't do that
// Add option to play <audio> when connect is clicked (maybe also when connected and disconnected?)
//Unhandled ESC sequence: Enable auto wrap
//ftelnet.min.js:105 Unknown ESC sequence: PB(?1049) IB() FB(h)
//ftelnet.min.js:124 Unknown ESC sequence: PB(1, 24) IB() FB(r)
//ftelnet.min.js:112 Unknown ESC sequence: PB(4) IB() FB(l)
//ftelnet.min.js:105 Unknown ESC sequence: PB(34) IB() FB(h)
//3ftelnet.min.js:105 Unknown ESC sequence: PB(?1) IB() FB(h)
//ftelnet.min.js:112 Unknown ESC sequence: PB(?1049) IB() FB(l)
//ftelnet.min.js:112 Unknown ESC sequence: PB(?1) IB() FB(l)
//nano uses ascii 15 (shift in) -- might need an option to say "don't print these control characters" and then let the sysop list the characters to ignore
//                                 or maybe just a "don't print control characters" option, which will ignore all of them
// atob-btoa keeps reverting to unicode or something...BOM keeps getting inserted when compiling for some reason

// Testing results:

// IE11: 
//   All worked well

// IE10 (using IE11 developer tools): 
//   All worked well

// IE9 (using IE11 developer tools): 
//   Download failed (CRC error)
//   Upload failed (fTelentUpload.files is undefined, need to use fTelentUpload.value)

// IE8 (using IE11 developer tools):
//   Canvas not supported

// Firefox 33.1:
//   All worked well

// Firefox 4.0:
//   Had to enable websockets via about:config
//   Able to connect directly to bbs.ftelnet.ca
//   Unable to connect via proxy (likely a FleckProxy issue since connecting directly worked)

// Firefox 6.0:
//   Download failed (DataView is not defined)
//   Upload failed (reader.readAsArrayBuffer is not a function)

// Chrome 39.0.2171.71 m
//   Infrequent status updates during download
//   Upload worked well

// Chrome 4.0:
//   Couldn't find old installs for Chrome

// Blackberry Playbook (OS 2.1.0.1917):
//   Infrequent status updates during download
//   Saving barfs on var FileBlob: Blob = new Blob(...);
//   Upload worked well

// HP TouchPad (webOS 3.0.5):
//   No status updates during download
//   Saving barfs on var Buffer: ArrayBuffer = new ArrayBuffer(ByteString.length);
//   Upload doesn't show file selection

// Nokia Lumia 520 (WP8.1):

// iPod Touch 4G (iOS 6.1.6):
//   Download tried opening the file in a new window and failed
//   Upload worked well
