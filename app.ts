/// <reference path='source/fTelnet.ts' />

// TODO List:
// Add ability to hide virtual keyboard
// Add ability to show virtual keyboard (if hidden)
// RIP fonts need to be optimized
// Resize window in RIP mode changed font size, and it shouldn't do that

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
