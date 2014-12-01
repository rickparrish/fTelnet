/// <reference path='source/fTelnet.ts' />

// TODO List:
// Automate closure compiler
// Add notes about IE9 support to docs
// Add callback for when data comes in
// Add method for writing data to remote server
// Add ability to hide top buttons (individually or as a whole)
// Add ability to hide virtual keyboard
// Add ability to show virtual keyboard (if hidden)

// Testing results:

// IE11: 
//   All worked well

// IE10 (using IE11 developer tools): 
//   All worked well

// IE9 (using IE11 developer tools): 
//   Download failed (CRC error)
//   Upload failed (fTelentUpload.files is undefined, need to use fTelentUpload.value)

// Firefox 33.1:
//   All worked well

// Chrome 39.0.2171.71 m
//   Infrequent status updates during download
//   Upload worked well

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
