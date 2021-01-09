/* Blob.js
 * A Blob implementation.
 * 2013-12-27
 * 
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

if (!(typeof Blob === "function" || typeof Blob === "object") || typeof URL === "undefined")
    if ((typeof Blob === "function" || typeof Blob === "object") && typeof webkitURL !== "undefined") self.URL = webkitURL;
    else var Blob = (function (view) {
        "use strict";

        var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || view.MSBlobBuilder || (function (view) {
            var
                  get_class = function (object) {
                      return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
                  }
                , FakeBlobBuilder = function BlobBuilder() {
                    this.data = [];
                }
                , FakeBlob = function Blob(data, type, encoding) {
                    this.data = data;
                    this.size = data.length;
                    this.type = type;
                    this.encoding = encoding;
                }
                , FBB_proto = FakeBlobBuilder.prototype
                , FB_proto = FakeBlob.prototype
                , FileReaderSync = view.FileReaderSync
                , FileException = function (type) {
                    this.code = this[this.name = type];
                }
                , file_ex_codes = (
                      "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
                    + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
                ).split(" ")
                , file_ex_code = file_ex_codes.length
                , real_URL = view.URL || view.webkitURL || view
                , real_create_object_URL = real_URL.createObjectURL
                , real_revoke_object_URL = real_URL.revokeObjectURL
                , URL = real_URL
                , btoa = view.btoa
                , atob = view.atob

                , ArrayBuffer = view.ArrayBuffer
                , Uint8Array = view.Uint8Array
            ;
            FakeBlob.fake = FB_proto.fake = true;
            while (file_ex_code--) {
                FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
            }
            if (!real_URL.createObjectURL) {
                URL = view.URL = {};
            }
            URL.createObjectURL = function (blob) {
                var
                      type = blob.type
                    , data_URI_header
                ;
                if (type === null) {
                    type = "application/octet-stream";
                }
                if (blob instanceof FakeBlob) {
                    data_URI_header = "data:" + type;
                    if (blob.encoding === "base64") {
                        return data_URI_header + ";base64," + blob.data;
                    } else if (blob.encoding === "URI") {
                        return data_URI_header + "," + decodeURIComponent(blob.data);
                    } if (btoa) {
                        return data_URI_header + ";base64," + btoa(blob.data);
                    } else {
                        return data_URI_header + "," + encodeURIComponent(blob.data);
                    }
                } else if (real_create_object_URL) {
                    return real_create_object_URL.call(real_URL, blob);
                }
            };
            URL.revokeObjectURL = function (object_URL) {
                if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
                    real_revoke_object_URL.call(real_URL, object_URL);
                }
            };
            FBB_proto.append = function (data/*, endings*/) {
                var bb = this.data;
                // decode data to a binary string
                if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
                    var
                          str = ""
                        , buf = new Uint8Array(data)
                        , i = 0
                        , buf_len = buf.length
                    ;
                    for (; i < buf_len; i++) {
                        str += String.fromCharCode(buf[i]);
                    }
                    bb.push(str);
                } else if (get_class(data) === "Blob" || get_class(data) === "File") {
                    if (FileReaderSync) {
                        var fr = new FileReaderSync;
                        bb.push(fr.readAsBinaryString(data));
                    } else {
                        // async FileReader won't work as BlobBuilder is sync
                        throw new FileException("NOT_READABLE_ERR");
                    }
                } else if (data instanceof FakeBlob) {
                    if (data.encoding === "base64" && atob) {
                        bb.push(atob(data.data));
                    } else if (data.encoding === "URI") {
                        bb.push(decodeURIComponent(data.data));
                    } else if (data.encoding === "raw") {
                        bb.push(data.data);
                    }
                } else {
                    if (typeof data !== "string") {
                        data += ""; // convert unsupported types to strings
                    }
                    // decode UTF-16 to binary string
                    bb.push(unescape(encodeURIComponent(data)));
                }
            };
            FBB_proto.getBlob = function (type) {
                if (!arguments.length) {
                    type = null;
                }
                return new FakeBlob(this.data.join(""), type, "raw");
            };
            FBB_proto.toString = function () {
                return "[object BlobBuilder]";
            };
            FB_proto.slice = function (start, end, type) {
                var args = arguments.length;
                if (args < 3) {
                    type = null;
                }
                return new FakeBlob(
                      this.data.slice(start, args > 1 ? end : this.data.length)
                    , type
                    , this.encoding
                );
            };
            FB_proto.toString = function () {
                return "[object Blob]";
            };
            return FakeBlobBuilder;
        }(view));

        return function Blob(blobParts, options) {
            var type = options ? (options.type || "") : "";
            var builder = new BlobBuilder();
            if (blobParts) {
                for (var i = 0, len = blobParts.length; i < len; i++) {
                    builder.append(blobParts[i]);
                }
            }
            return builder.getBlob(type);
        };
    }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));

/*! FileSaver.js
 *  A saveAs() FileSaver implementation.
 *  2014-01-24
 *
 *  By Eli Grey, http://eligrey.com
 *  License: X11/MIT
 *    See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  // IE 10+ (native saveAs)
  || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  // Everyone else
  || (function (view) {
      "use strict";
      // IE <10 is explicitly unsupported
      if (typeof navigator !== "undefined" &&
          /MSIE [1-9]\./.test(navigator.userAgent)) {
          return;
      }
      var
            doc = view.document
            // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
          , get_URL = function () {
              return view.URL || view.webkitURL || view;
          }
          , URL = view.URL || view.webkitURL || view
          , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
          , can_use_save_link = !view.externalHost && "download" in save_link
          , click = function (node) {
              var event = doc.createEvent("MouseEvents");
              event.initMouseEvent(
                  "click", true, false, view, 0, 0, 0, 0, 0
                  , false, false, false, false, 0, null
              );
              node.dispatchEvent(event);
          }
          , webkit_req_fs = view.webkitRequestFileSystem
          , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
          , throw_outside = function (ex) {
              (view.setImmediate || view.setTimeout)(function () {
                  throw ex;
              }, 0);
          }
          , force_saveable_type = "application/octet-stream"
          , fs_min_size = 0
          , deletion_queue = []
          , process_deletion_queue = function () {
              var i = deletion_queue.length;
              while (i--) {
                  var file = deletion_queue[i];
                  if (typeof file === "string") { // file is an object URL
                      URL.revokeObjectURL(file);
                  } else { // file is a File
                      file.remove();
                  }
              }
              deletion_queue.length = 0; // clear queue
          }
          , dispatch = function (filesaver, event_types, event) {
              event_types = [].concat(event_types);
              var i = event_types.length;
              while (i--) {
                  var listener = filesaver["on" + event_types[i]];
                  if (typeof listener === "function") {
                      try {
                          listener.call(filesaver, event || filesaver);
                      } catch (ex) {
                          throw_outside(ex);
                      }
                  }
              }
          }
          , FileSaver = function (blob, name) {
              // First try a.download, then web filesystem, then object URLs
              var
                    filesaver = this
                  , type = blob.type
                  , blob_changed = false
                  , object_url
                  , target_view
                  , get_object_url = function () {
                      var object_url = get_URL().createObjectURL(blob);
                      deletion_queue.push(object_url);
                      return object_url;
                  }
                  , dispatch_all = function () {
                      dispatch(filesaver, "writestart progress write writeend".split(" "));
                  }
                  // on any filesys errors revert to saving with object URLs
                  , fs_error = function () {
                      // don't create more object URLs than needed
                      if (blob_changed || !object_url) {
                          object_url = get_object_url(blob);
                      }
                      if (target_view) {
                          target_view.location.href = object_url;
                      } else {
                          window.open(object_url, "_blank");
                      }
                      filesaver.readyState = filesaver.DONE;
                      dispatch_all();
                  }
                  , abortable = function (func) {
                      return function () {
                          if (filesaver.readyState !== filesaver.DONE) {
                              return func.apply(this, arguments);
                          }
                      };
                  }
                  , create_if_not_found = { create: true, exclusive: false }
                  , slice
              ;
              filesaver.readyState = filesaver.INIT;
              if (!name) {
                  name = "download";
              }
              if (can_use_save_link) {
                  object_url = get_object_url(blob);
                  // FF for Android has a nasty garbage collection mechanism
                  // that turns all objects that are not pure javascript into 'deadObject'
                  // this means `doc` and `save_link` are unusable and need to be recreated
                  // `view` is usable though:
                  doc = view.document;
                  save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
                  save_link.href = object_url;
                  save_link.download = name;
                  var event = doc.createEvent("MouseEvents");
                  event.initMouseEvent(
                      "click", true, false, view, 0, 0, 0, 0, 0
                      , false, false, false, false, 0, null
                  );
                  save_link.dispatchEvent(event);
                  filesaver.readyState = filesaver.DONE;
                  dispatch_all();
                  return;
              }
              // Object and web filesystem URLs have a problem saving in Google Chrome when
              // viewed in a tab, so I force save with application/octet-stream
              // http://code.google.com/p/chromium/issues/detail?id=91158
              if (view.chrome && type && type !== force_saveable_type) {
                  slice = blob.slice || blob.webkitSlice;
                  blob = slice.call(blob, 0, blob.size, force_saveable_type);
                  blob_changed = true;
              }
              // Since I can't be sure that the guessed media type will trigger a download
              // in WebKit, I append .download to the filename.
              // https://bugs.webkit.org/show_bug.cgi?id=65440
              if (webkit_req_fs && name !== "download") {
                  name += ".download";
              }
              if (type === force_saveable_type || webkit_req_fs) {
                  target_view = view;
              }
              if (!req_fs) {
                  fs_error();
                  return;
              }
              fs_min_size += blob.size;
              req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
                  fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
                      var save = function () {
                          dir.getFile(name, create_if_not_found, abortable(function (file) {
                              file.createWriter(abortable(function (writer) {
                                  writer.onwriteend = function (event) {
                                      target_view.location.href = file.toURL();
                                      deletion_queue.push(file);
                                      filesaver.readyState = filesaver.DONE;
                                      dispatch(filesaver, "writeend", event);
                                  };
                                  writer.onerror = function () {
                                      var error = writer.error;
                                      if (error.code !== error.ABORT_ERR) {
                                          fs_error();
                                      }
                                  };
                                  "writestart progress write abort".split(" ").forEach(function (event) {
                                      writer["on" + event] = filesaver["on" + event];
                                  });
                                  writer.write(blob);
                                  filesaver.abort = function () {
                                      writer.abort();
                                      filesaver.readyState = filesaver.DONE;
                                  };
                                  filesaver.readyState = filesaver.WRITING;
                              }), fs_error);
                          }), fs_error);
                      };
                      dir.getFile(name, { create: false }, abortable(function (file) {
                          // delete file if it already exists
                          file.remove();
                          save();
                      }), abortable(function (ex) {
                          if (ex.code === ex.NOT_FOUND_ERR) {
                              save();
                          } else {
                              fs_error();
                          }
                      }));
                  }), fs_error);
              }), fs_error);
          }
          , FS_proto = FileSaver.prototype
          , saveAs = function (blob, name) {
              return new FileSaver(blob, name);
          }
      ;
      FS_proto.abort = function () {
          var filesaver = this;
          filesaver.readyState = filesaver.DONE;
          dispatch(filesaver, "abort");
      };
      FS_proto.readyState = FS_proto.INIT = 0;
      FS_proto.WRITING = 1;
      FS_proto.DONE = 2;

      FS_proto.error =
      FS_proto.onwritestart =
      FS_proto.onprogress =
      FS_proto.onwrite =
      FS_proto.onabort =
      FS_proto.onerror =
      FS_proto.onwriteend =
          null;

      view.addEventListener("unload", process_deletion_queue, false);
      saveAs.unload = function () {
          process_deletion_queue();
          view.removeEventListener("unload", process_deletion_queue, false);
      };
      return saveAs;
  }(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined") module.exports = saveAs;

var Benchmark = (function () {
    function Benchmark() {
        this._CumulativeElapsed = 0;
    }
    Object.defineProperty(Benchmark.prototype, "CumulativeElapsed", {
        get: function () {
            if (this._CumulativeElapsed > 0) {
                return this._CumulativeElapsed;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Benchmark.prototype, "Elapsed", {
        get: function () {
            if (this._StopTime > 0) {
                return this._StopTime - this._StartTime;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Benchmark.prototype.Reset = function () {
        this._CumulativeElapsed = 0;
    };
    Benchmark.prototype.Start = function () {
        this._StartTime = performance.now();
        this._StopTime = 0;
    };
    Benchmark.prototype.Stop = function () {
        if (this._StartTime > 0) {
            this._StopTime = performance.now();
            this._CumulativeElapsed += this.Elapsed;
        }
    };
    return Benchmark;
}());
var Benchmarks = (function () {
    function Benchmarks() {
    }
    Benchmarks.Alert = function () {
        var text = '';
        for (var i = 0; i < this._Names.length; i++) {
            text += this._Names[i] + ': ' + this._Benchmarks[this._Names[i]].CumulativeElapsed + '\n';
        }
        alert(text);
    };
    Benchmarks.Reset = function () {
        this._Benchmarks = {};
        this._Names = [];
    };
    Benchmarks.Start = function (name) {
        if (this._Benchmarks[name] === undefined) {
            this._Benchmarks[name] = new Benchmark();
            this._Names.push(name);
        }
        this._Benchmarks[name].Start();
        return this._Benchmarks[name];
    };
    Benchmarks.Stop = function (name) {
        this._Benchmarks[name].Stop();
    };
    Benchmarks.Log = function () {
        for (var i = 0; i < this._Names.length; i++) {
            var text = '';
            text += this._Names[i] + ': ' + this._Benchmarks[this._Names[i]].CumulativeElapsed;
            console.log(text);
        }
    };
    Benchmarks._Benchmarks = {};
    Benchmarks._Names = [];
    return Benchmarks;
}());
var ByteArray = (function () {
    function ByteArray() {
        this._Bytes = [];
        this._Length = 0;
        this._Position = 0;
    }
    Object.defineProperty(ByteArray.prototype, "bytesAvailable", {
        get: function () {
            return this._Length - this._Position;
        },
        enumerable: true,
        configurable: true
    });
    ByteArray.prototype.clear = function () {
        this._Bytes = [];
        this._Length = 0;
        this._Position = 0;
    };
    Object.defineProperty(ByteArray.prototype, "length", {
        get: function () {
            return this._Length;
        },
        set: function (value) {
            if (value <= 0) {
                this.clear();
            }
            else {
                if (value < this._Length) {
                    this._Bytes.splice(value, this._Length - value);
                }
                else if (value > this._Length) {
                    for (var i = this._Length + 1; i <= value; i++) {
                        this._Bytes.push(0);
                    }
                }
                this._Length = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ByteArray.prototype, "position", {
        get: function () {
            return this._Position;
        },
        set: function (value) {
            if (value <= 0) {
                value = 0;
            }
            else if (value >= this._Length) {
                value = this._Length;
            }
            this._Position = value;
        },
        enumerable: true,
        configurable: true
    });
    ByteArray.prototype.readBytes = function (bytes, offset, length) {
        if (typeof offset === 'undefined') {
            offset = 0;
        }
        if (typeof length === 'undefined') {
            length = 0;
        }
        if (this._Position + length > this._Length) {
            throw 'There is not sufficient data available to read.';
        }
        var BytesPosition = bytes.position;
        bytes.position = offset;
        for (var i = 0; i < length; i++) {
            bytes.writeByte(this._Bytes[this._Position++] & 0xFF);
        }
        bytes.position = BytesPosition;
    };
    ByteArray.prototype.readString = function (length) {
        if (typeof length === 'undefined') {
            length = this._Length;
        }
        var Result = '';
        while ((length-- > 0) && (this._Position < this._Length)) {
            Result += String.fromCharCode(this._Bytes[this._Position++]);
        }
        if (this.bytesAvailable === 0) {
            this.clear();
        }
        return Result;
    };
    ByteArray.prototype.readUnsignedByte = function () {
        if (this._Position >= this._Length) {
            throw 'There is not sufficient data available to read.';
        }
        return (this._Bytes[this._Position++] & 0xFF);
    };
    ByteArray.prototype.readUnsignedShort = function () {
        if (this._Position >= (this._Length - 1)) {
            throw 'There is not sufficient data available to read.';
        }
        return ((this._Bytes[this._Position++] & 0xFF) << 8) + (this._Bytes[this._Position++] & 0xFF);
    };
    ByteArray.prototype.toString = function () {
        var Result = '';
        for (var i = 0; i < this._Length; i++) {
            Result += String.fromCharCode(this._Bytes[i]);
        }
        return Result;
    };
    ByteArray.prototype.writeByte = function (value) {
        this._Bytes[this._Position++] = (value & 0xFF);
        if (this._Position > this._Length) {
            this._Length++;
        }
    };
    ByteArray.prototype.writeBytes = function (bytes, offset, length) {
        if (!offset) {
            offset = 0;
        }
        if (!length) {
            length = 0;
        }
        if (offset < 0) {
            offset = 0;
        }
        if (length < 0) {
            return;
        }
        else if (length === 0) {
            length = bytes.length;
        }
        if (offset >= bytes.length) {
            offset = 0;
        }
        if (length > bytes.length) {
            length = bytes.length;
        }
        if (offset + length > bytes.length) {
            length = bytes.length - offset;
        }
        var BytesPosition = bytes.position;
        bytes.position = offset;
        for (var i = 0; i < length; i++) {
            this.writeByte(bytes.readUnsignedByte());
        }
        bytes.position = BytesPosition;
    };
    ByteArray.prototype.writeShort = function (value) {
        this.writeByte((value & 0xFF00) >> 8);
        this.writeByte(value & 0x00FF);
    };
    ByteArray.prototype.writeString = function (text) {
        var Textlength = text.length;
        for (var i = 0; i < Textlength; i++) {
            this.writeByte(text.charCodeAt(i) & 0xFF);
        }
    };
    return ByteArray;
}());
var ClipboardHelper = (function () {
    function ClipboardHelper() {
    }
    ClipboardHelper.GetData = function () {
        if (document.queryCommandSupported('paste')) {
            var textArea = document.createElement('textarea');
            textArea.style.position = 'fixed';
            textArea.style.top = '0px';
            textArea.style.left = '0px';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0px';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.value = 'paste';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('paste');
            }
            catch (err) {
                textArea.value = prompt('Press CTRL-V then Enter to paste the text from your clipboard') || '';
            }
            document.body.removeChild(textArea);
            return textArea.value;
        }
        else if (window.clipboardData) {
            return window.clipboardData.getData('Text');
        }
        else {
            return prompt('Press CTRL-V then Enter to paste the text from your clipboard') || '';
        }
    };
    ClipboardHelper.SetData = function (text) {
        if (document.queryCommandSupported('copy')) {
            var textArea = document.createElement('textarea');
            textArea.style.position = 'fixed';
            textArea.style.top = '0px';
            textArea.style.left = '0px';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0px';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            }
            catch (err) {
                prompt('Press CTRL-C then Enter to copy the text to your clipboard', text);
            }
            document.body.removeChild(textArea);
        }
        else if (window.clipboardData) {
            window.clipboardData.setData('Text', text);
        }
        else {
            prompt('Press CTRL-C then Enter to copy the text to your clipboard', text);
        }
    };
    return ClipboardHelper;
}());
var DetectMobileBrowser = (function () {
    function DetectMobileBrowser() {
    }
    Object.defineProperty(DetectMobileBrowser, "IsMobile", {
        get: function () {
            if (!!window.cordova) {
                return true;
            }
            if (typeof this._IsMobile === 'undefined') {
                var a = navigator.userAgent || navigator.vendor;
                this._IsMobile = (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)));
            }
            return this._IsMobile;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DetectMobileBrowser, "SupportsModernScrollback", {
        get: function () {
            return !DetectMobileBrowser.IsMobile;
        },
        enumerable: true,
        configurable: true
    });
    return DetectMobileBrowser;
}());
var GetScrollbarWidth = (function () {
    function GetScrollbarWidth() {
    }
    Object.defineProperty(GetScrollbarWidth, "Width", {
        get: function () {
            if (typeof this._Width === 'undefined') {
                var outer = document.createElement('div');
                outer.style.visibility = 'hidden';
                outer.style.width = '100px';
                document.body.appendChild(outer);
                var widthNoScroll = outer.offsetWidth;
                outer.style.overflow = 'scroll';
                var inner = document.createElement('div');
                inner.style.width = '100%';
                outer.appendChild(inner);
                var widthWithScroll = inner.offsetWidth;
                if (outer.parentNode !== null) {
                    outer.parentNode.removeChild(outer);
                }
                this._Width = widthNoScroll - widthWithScroll;
            }
            return this._Width;
        },
        enumerable: true,
        configurable: true
    });
    return GetScrollbarWidth;
}());
var Offset;
(function (Offset) {
    'use strict';
    function getOffsetSum(elem) {
        var top = 0, left = 0;
        while (elem) {
            top = top + elem.offsetTop;
            left = left + elem.offsetLeft;
            elem = elem.offsetParent;
        }
        return { y: top, x: left };
    }
    function getOffsetRect(elem) {
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { y: Math.round(top), x: Math.round(left) };
    }
    function getOffset(elem) {
        if (elem.getBoundingClientRect) {
            return getOffsetRect(elem);
        }
        else {
            return getOffsetSum(elem);
        }
    }
    Offset.getOffset = getOffset;
})(Offset || (Offset = {}));
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.toString = function () {
        return '[' + this.x.toString(10) + ',' + this.y.toString(10) + ']';
    };
    return Point;
}());
var StringUtils = (function () {
    function StringUtils() {
    }
    StringUtils.AddCommas = function (value) {
        var Result = '';
        var Position = 1;
        for (var i = value.toString().length - 1; i >= 0; i--) {
            if ((Position > 3) && (Position % 3 === 1)) {
                Result = ',' + Result;
            }
            Result = value.toString().charAt(i) + Result;
            Position++;
        }
        return Result;
    };
    StringUtils.FormatPercent = function (value, fractionDigits) {
        return (value * 100).toFixed(fractionDigits) + '%';
    };
    StringUtils.GetUrl = function (filename) {
        var fTelnetScriptParts = document.getElementById('fTelnetScript').src.split('?');
        var fTelnetScriptUrl = fTelnetScriptParts[0];
        var fTelnetScriptPath = fTelnetScriptUrl.substring(0, fTelnetScriptUrl.lastIndexOf('/'));
        var fTelnetVersion = (fTelnetScriptParts.length === 1) ? 'v=1' : fTelnetScriptParts[1];
        return fTelnetScriptPath + '/' + filename + '?' + fTelnetVersion;
    };
    StringUtils.IPtoInteger = function (ipAddress) {
        var parts = ipAddress.split('.');
        var res = 0;
        res += (parseInt(parts[0], 10) << 24) >>> 0;
        res += (parseInt(parts[1], 10) << 16) >>> 0;
        res += (parseInt(parts[2], 10) << 8) >>> 0;
        res += parseInt(parts[3], 10) >>> 0;
        return res;
    };
    StringUtils.NewString = function (ch, length) {
        if (ch.length === 0) {
            return '';
        }
        var Result = '';
        for (var i = 0; i < length; i++) {
            Result += ch.charAt(0);
        }
        return Result;
    };
    StringUtils.PadLeft = function (text, ch, length) {
        if (ch.length === 0) {
            return text;
        }
        while (text.length < length) {
            text = ch.charAt(0) + text;
        }
        return text.substring(0, length);
    };
    StringUtils.PadRight = function (text, ch, length) {
        if (ch.length === 0) {
            return text;
        }
        while (text.length < length) {
            text += ch.charAt(0);
        }
        return text.substring(0, length);
    };
    StringUtils.Trim = function (text) {
        return this.TrimLeft(this.TrimRight(text));
    };
    StringUtils.TrimLeft = function (text) {
        return text.replace(/^\s+/g, '');
    };
    StringUtils.TrimRight = function (text) {
        return text.replace(/\s+$/g, '');
    };
    return StringUtils;
}());
var TypedEvent = (function () {
    function TypedEvent() {
        this._listeners = [];
    }
    TypedEvent.prototype.on = function (listener) {
        this._listeners.push(listener);
    };
    TypedEvent.prototype.off = function (listener) {
        if (typeof listener === 'function') {
            for (var i = 0, l = this._listeners.length; i < l; l++) {
                if (this._listeners[i] === listener) {
                    this._listeners.splice(i, 1);
                    break;
                }
            }
        }
        else {
            this._listeners = [];
        }
    };
    TypedEvent.prototype.trigger = function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        var context = {};
        var listeners = this._listeners.slice(0);
        for (var i = 0, l = listeners.length; i < l; i++) {
            listeners[i].apply(context, a || []);
        }
    };
    return TypedEvent;
}());
//# sourceMappingURL=common.js.map
var Ansi = (function () {
    function Ansi(crt) {
        this.onesc0c = new TypedEvent();
        this.onesc5n = new TypedEvent();
        this.onesc6n = new TypedEvent();
        this.onesc255n = new TypedEvent();
        this.onescQ = new TypedEvent();
        this.onripdetect = new TypedEvent();
        this.onripdisable = new TypedEvent();
        this.onripenable = new TypedEvent();
        this.ANSI_COLORS = [0, 4, 2, 6, 1, 5, 3, 7];
        this.ANSI256_COLORS = [{ 'r': 0, 'g': 0, 'b': 0 }, { 'r': 128, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 128, 'b': 0 }, { 'r': 128, 'g': 128, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 128 }, { 'r': 128, 'g': 0, 'b': 128 }, { 'r': 0, 'g': 128, 'b': 128 }, { 'r': 192, 'g': 192, 'b': 192 }, { 'r': 128, 'g': 128, 'b': 128 }, { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 255, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 255 }, { 'r': 255, 'g': 0, 'b': 255 }, { 'r': 0, 'g': 255, 'b': 255 }, { 'r': 255, 'g': 255, 'b': 255 }, { 'r': 0, 'g': 0, 'b': 0 }, { 'r': 0, 'g': 0, 'b': 95 }, { 'r': 0, 'g': 0, 'b': 135 }, { 'r': 0, 'g': 0, 'b': 175 }, { 'r': 0, 'g': 0, 'b': 215 }, { 'r': 0, 'g': 0, 'b': 255 }, { 'r': 0, 'g': 95, 'b': 0 }, { 'r': 0, 'g': 95, 'b': 95 }, { 'r': 0, 'g': 95, 'b': 135 }, { 'r': 0, 'g': 95, 'b': 175 }, { 'r': 0, 'g': 95, 'b': 215 }, { 'r': 0, 'g': 95, 'b': 255 }, { 'r': 0, 'g': 135, 'b': 0 }, { 'r': 0, 'g': 135, 'b': 95 }, { 'r': 0, 'g': 135, 'b': 135 }, { 'r': 0, 'g': 135, 'b': 175 }, { 'r': 0, 'g': 135, 'b': 215 }, { 'r': 0, 'g': 135, 'b': 255 }, { 'r': 0, 'g': 175, 'b': 0 }, { 'r': 0, 'g': 175, 'b': 95 }, { 'r': 0, 'g': 175, 'b': 135 }, { 'r': 0, 'g': 175, 'b': 175 }, { 'r': 0, 'g': 175, 'b': 215 }, { 'r': 0, 'g': 175, 'b': 255 }, { 'r': 0, 'g': 215, 'b': 0 }, { 'r': 0, 'g': 215, 'b': 95 }, { 'r': 0, 'g': 215, 'b': 135 }, { 'r': 0, 'g': 215, 'b': 175 }, { 'r': 0, 'g': 215, 'b': 215 }, { 'r': 0, 'g': 215, 'b': 255 }, { 'r': 0, 'g': 255, 'b': 0 }, { 'r': 0, 'g': 255, 'b': 95 }, { 'r': 0, 'g': 255, 'b': 135 }, { 'r': 0, 'g': 255, 'b': 175 }, { 'r': 0, 'g': 255, 'b': 215 }, { 'r': 0, 'g': 255, 'b': 255 }, { 'r': 95, 'g': 0, 'b': 0 }, { 'r': 95, 'g': 0, 'b': 95 }, { 'r': 95, 'g': 0, 'b': 135 }, { 'r': 95, 'g': 0, 'b': 175 }, { 'r': 95, 'g': 0, 'b': 215 }, { 'r': 95, 'g': 0, 'b': 255 }, { 'r': 95, 'g': 95, 'b': 0 }, { 'r': 95, 'g': 95, 'b': 95 }, { 'r': 95, 'g': 95, 'b': 135 }, { 'r': 95, 'g': 95, 'b': 175 }, { 'r': 95, 'g': 95, 'b': 215 }, { 'r': 95, 'g': 95, 'b': 255 }, { 'r': 95, 'g': 135, 'b': 0 }, { 'r': 95, 'g': 135, 'b': 95 }, { 'r': 95, 'g': 135, 'b': 135 }, { 'r': 95, 'g': 135, 'b': 175 }, { 'r': 95, 'g': 135, 'b': 215 }, { 'r': 95, 'g': 135, 'b': 255 }, { 'r': 95, 'g': 175, 'b': 0 }, { 'r': 95, 'g': 175, 'b': 95 }, { 'r': 95, 'g': 175, 'b': 135 }, { 'r': 95, 'g': 175, 'b': 175 }, { 'r': 95, 'g': 175, 'b': 215 }, { 'r': 95, 'g': 175, 'b': 255 }, { 'r': 95, 'g': 215, 'b': 0 }, { 'r': 95, 'g': 215, 'b': 95 }, { 'r': 95, 'g': 215, 'b': 135 }, { 'r': 95, 'g': 215, 'b': 175 }, { 'r': 95, 'g': 215, 'b': 215 }, { 'r': 95, 'g': 215, 'b': 255 }, { 'r': 95, 'g': 255, 'b': 0 }, { 'r': 95, 'g': 255, 'b': 95 }, { 'r': 95, 'g': 255, 'b': 135 }, { 'r': 95, 'g': 255, 'b': 175 }, { 'r': 95, 'g': 255, 'b': 215 }, { 'r': 95, 'g': 255, 'b': 255 }, { 'r': 135, 'g': 0, 'b': 0 }, { 'r': 135, 'g': 0, 'b': 95 }, { 'r': 135, 'g': 0, 'b': 135 }, { 'r': 135, 'g': 0, 'b': 175 }, { 'r': 135, 'g': 0, 'b': 215 }, { 'r': 135, 'g': 0, 'b': 255 }, { 'r': 135, 'g': 95, 'b': 0 }, { 'r': 135, 'g': 95, 'b': 95 }, { 'r': 135, 'g': 95, 'b': 135 }, { 'r': 135, 'g': 95, 'b': 175 }, { 'r': 135, 'g': 95, 'b': 215 }, { 'r': 135, 'g': 95, 'b': 255 }, { 'r': 135, 'g': 135, 'b': 0 }, { 'r': 135, 'g': 135, 'b': 95 }, { 'r': 135, 'g': 135, 'b': 135 }, { 'r': 135, 'g': 135, 'b': 175 }, { 'r': 135, 'g': 135, 'b': 215 }, { 'r': 135, 'g': 135, 'b': 255 }, { 'r': 135, 'g': 175, 'b': 0 }, { 'r': 135, 'g': 175, 'b': 95 }, { 'r': 135, 'g': 175, 'b': 135 }, { 'r': 135, 'g': 175, 'b': 175 }, { 'r': 135, 'g': 175, 'b': 215 }, { 'r': 135, 'g': 175, 'b': 255 }, { 'r': 135, 'g': 215, 'b': 0 }, { 'r': 135, 'g': 215, 'b': 95 }, { 'r': 135, 'g': 215, 'b': 135 }, { 'r': 135, 'g': 215, 'b': 175 }, { 'r': 135, 'g': 215, 'b': 215 }, { 'r': 135, 'g': 215, 'b': 255 }, { 'r': 135, 'g': 255, 'b': 0 }, { 'r': 135, 'g': 255, 'b': 95 }, { 'r': 135, 'g': 255, 'b': 135 }, { 'r': 135, 'g': 255, 'b': 175 }, { 'r': 135, 'g': 255, 'b': 215 }, { 'r': 135, 'g': 255, 'b': 255 }, { 'r': 175, 'g': 0, 'b': 0 }, { 'r': 175, 'g': 0, 'b': 95 }, { 'r': 175, 'g': 0, 'b': 135 }, { 'r': 175, 'g': 0, 'b': 175 }, { 'r': 175, 'g': 0, 'b': 215 }, { 'r': 175, 'g': 0, 'b': 255 }, { 'r': 175, 'g': 95, 'b': 0 }, { 'r': 175, 'g': 95, 'b': 95 }, { 'r': 175, 'g': 95, 'b': 135 }, { 'r': 175, 'g': 95, 'b': 175 }, { 'r': 175, 'g': 95, 'b': 215 }, { 'r': 175, 'g': 95, 'b': 255 }, { 'r': 175, 'g': 135, 'b': 0 }, { 'r': 175, 'g': 135, 'b': 95 }, { 'r': 175, 'g': 135, 'b': 135 }, { 'r': 175, 'g': 135, 'b': 175 }, { 'r': 175, 'g': 135, 'b': 215 }, { 'r': 175, 'g': 135, 'b': 255 }, { 'r': 175, 'g': 175, 'b': 0 }, { 'r': 175, 'g': 175, 'b': 95 }, { 'r': 175, 'g': 175, 'b': 135 }, { 'r': 175, 'g': 175, 'b': 175 }, { 'r': 175, 'g': 175, 'b': 215 }, { 'r': 175, 'g': 175, 'b': 255 }, { 'r': 175, 'g': 215, 'b': 0 }, { 'r': 175, 'g': 215, 'b': 95 }, { 'r': 175, 'g': 215, 'b': 135 }, { 'r': 175, 'g': 215, 'b': 175 }, { 'r': 175, 'g': 215, 'b': 215 }, { 'r': 175, 'g': 215, 'b': 255 }, { 'r': 175, 'g': 255, 'b': 0 }, { 'r': 175, 'g': 255, 'b': 95 }, { 'r': 175, 'g': 255, 'b': 135 }, { 'r': 175, 'g': 255, 'b': 175 }, { 'r': 175, 'g': 255, 'b': 215 }, { 'r': 175, 'g': 255, 'b': 255 }, { 'r': 215, 'g': 0, 'b': 0 }, { 'r': 215, 'g': 0, 'b': 95 }, { 'r': 215, 'g': 0, 'b': 135 }, { 'r': 215, 'g': 0, 'b': 175 }, { 'r': 215, 'g': 0, 'b': 215 }, { 'r': 215, 'g': 0, 'b': 255 }, { 'r': 215, 'g': 95, 'b': 0 }, { 'r': 215, 'g': 95, 'b': 95 }, { 'r': 215, 'g': 95, 'b': 135 }, { 'r': 215, 'g': 95, 'b': 175 }, { 'r': 215, 'g': 95, 'b': 215 }, { 'r': 215, 'g': 95, 'b': 255 }, { 'r': 215, 'g': 135, 'b': 0 }, { 'r': 215, 'g': 135, 'b': 95 }, { 'r': 215, 'g': 135, 'b': 135 }, { 'r': 215, 'g': 135, 'b': 175 }, { 'r': 215, 'g': 135, 'b': 215 }, { 'r': 215, 'g': 135, 'b': 255 }, { 'r': 215, 'g': 175, 'b': 0 }, { 'r': 215, 'g': 175, 'b': 95 }, { 'r': 215, 'g': 175, 'b': 135 }, { 'r': 215, 'g': 175, 'b': 175 }, { 'r': 215, 'g': 175, 'b': 215 }, { 'r': 215, 'g': 175, 'b': 255 }, { 'r': 215, 'g': 215, 'b': 0 }, { 'r': 215, 'g': 215, 'b': 95 }, { 'r': 215, 'g': 215, 'b': 135 }, { 'r': 215, 'g': 215, 'b': 175 }, { 'r': 215, 'g': 215, 'b': 215 }, { 'r': 215, 'g': 215, 'b': 255 }, { 'r': 215, 'g': 255, 'b': 0 }, { 'r': 215, 'g': 255, 'b': 95 }, { 'r': 215, 'g': 255, 'b': 135 }, { 'r': 215, 'g': 255, 'b': 175 }, { 'r': 215, 'g': 255, 'b': 215 }, { 'r': 215, 'g': 255, 'b': 255 }, { 'r': 255, 'g': 0, 'b': 0 }, { 'r': 255, 'g': 0, 'b': 95 }, { 'r': 255, 'g': 0, 'b': 135 }, { 'r': 255, 'g': 0, 'b': 175 }, { 'r': 255, 'g': 0, 'b': 215 }, { 'r': 255, 'g': 0, 'b': 255 }, { 'r': 255, 'g': 95, 'b': 0 }, { 'r': 255, 'g': 95, 'b': 95 }, { 'r': 255, 'g': 95, 'b': 135 }, { 'r': 255, 'g': 95, 'b': 175 }, { 'r': 255, 'g': 95, 'b': 215 }, { 'r': 255, 'g': 95, 'b': 255 }, { 'r': 255, 'g': 135, 'b': 0 }, { 'r': 255, 'g': 135, 'b': 95 }, { 'r': 255, 'g': 135, 'b': 135 }, { 'r': 255, 'g': 135, 'b': 175 }, { 'r': 255, 'g': 135, 'b': 215 }, { 'r': 255, 'g': 135, 'b': 255 }, { 'r': 255, 'g': 175, 'b': 0 }, { 'r': 255, 'g': 175, 'b': 95 }, { 'r': 255, 'g': 175, 'b': 135 }, { 'r': 255, 'g': 175, 'b': 175 }, { 'r': 255, 'g': 175, 'b': 215 }, { 'r': 255, 'g': 175, 'b': 255 }, { 'r': 255, 'g': 215, 'b': 0 }, { 'r': 255, 'g': 215, 'b': 95 }, { 'r': 255, 'g': 215, 'b': 135 }, { 'r': 255, 'g': 215, 'b': 175 }, { 'r': 255, 'g': 215, 'b': 215 }, { 'r': 255, 'g': 215, 'b': 255 }, { 'r': 255, 'g': 255, 'b': 0 }, { 'r': 255, 'g': 255, 'b': 95 }, { 'r': 255, 'g': 255, 'b': 135 }, { 'r': 255, 'g': 255, 'b': 175 }, { 'r': 255, 'g': 255, 'b': 215 }, { 'r': 255, 'g': 255, 'b': 255 }, { 'r': 8, 'g': 8, 'b': 8 }, { 'r': 18, 'g': 18, 'b': 18 }, { 'r': 28, 'g': 28, 'b': 28 }, { 'r': 38, 'g': 38, 'b': 38 }, { 'r': 48, 'g': 48, 'b': 48 }, { 'r': 58, 'g': 58, 'b': 58 }, { 'r': 68, 'g': 68, 'b': 68 }, { 'r': 78, 'g': 78, 'b': 78 }, { 'r': 88, 'g': 88, 'b': 88 }, { 'r': 98, 'g': 98, 'b': 98 }, { 'r': 108, 'g': 108, 'b': 108 }, { 'r': 118, 'g': 118, 'b': 118 }, { 'r': 128, 'g': 128, 'b': 128 }, { 'r': 138, 'g': 138, 'b': 138 }, { 'r': 148, 'g': 148, 'b': 148 }, { 'r': 158, 'g': 158, 'b': 158 }, { 'r': 168, 'g': 168, 'b': 168 }, { 'r': 178, 'g': 178, 'b': 178 }, { 'r': 188, 'g': 188, 'b': 188 }, { 'r': 198, 'g': 198, 'b': 198 }, { 'r': 208, 'g': 208, 'b': 208 }, { 'r': 218, 'g': 218, 'b': 218 }, { 'r': 228, 'g': 228, 'b': 228 }, { 'r': 238, 'g': 238, 'b': 238 }];
        this._AnsiAttr = 7;
        this._AnsiBuffer = '';
        this._AnsiIntermediates = [];
        this._AnsiParams = [];
        this._AnsiParserState = AnsiParserState.None;
        this._AnsiXY = new Point(1, 1);
        this._Crt = crt;
    }
    Ansi.prototype.AnsiCommand = function (finalByte) {
        var Colour = 0;
        var Colour256;
        var x = 0;
        var y = 0;
        var z = 0;
        switch (finalByte) {
            case '!':
                switch (this.GetNextParam(0)) {
                    case 0:
                        this.onripdetect.trigger();
                        break;
                    case 1:
                        this.onripdisable.trigger();
                        break;
                    case 2:
                        this.onripenable.trigger();
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case '@':
                x = Math.max(1, this.GetNextParam(1));
                this._Crt.InsChar(x);
                break;
            case '{':
                console.log('Unhandled ESC sequence: Indicates that a font block is following');
                break;
            case 'A':
                y = Math.max(1, this.GetNextParam(1));
                y = Math.max(1, this._Crt.WhereY() - y);
                this._Crt.GotoXY(this._Crt.WhereX(), y);
                break;
            case 'B':
                y = Math.max(1, this.GetNextParam(1));
                y = Math.min(this._Crt.WindRows, this._Crt.WhereY() + y);
                this._Crt.GotoXY(this._Crt.WhereX(), y);
                break;
            case 'C':
                x = Math.max(1, this.GetNextParam(1));
                x = Math.min(this._Crt.WindCols, this._Crt.WhereX() + x);
                this._Crt.GotoXY(x, this._Crt.WhereY());
                break;
            case 'c':
                x = this.GetNextParam(0);
                switch (x) {
                    case 0:
                        this.onesc0c.trigger();
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'D':
                if (this._AnsiIntermediates.length === 0) {
                    x = Math.max(1, this.GetNextParam(1));
                    x = Math.max(1, this._Crt.WhereX() - x);
                    this._Crt.GotoXY(x, this._Crt.WhereY());
                }
                else if (this._AnsiIntermediates.indexOf(' ') !== -1) {
                    x = this.GetNextParam(0);
                    y = this.GetNextParam(0);
                    if ((x === 0) && (y >= 0) && (y <= 40)) {
                        this._Crt.SetFont('SyncTerm-' + y.toString(10));
                    }
                    else {
                        console.log('Unhandled ESC sequence: Secondary Font Selection (set font ' + x + ' to ' + y + ')');
                    }
                    break;
                }
                break;
            case 'E':
                y = Math.max(1, this.GetNextParam(1));
                y = Math.min(this._Crt.WindRows, this._Crt.WhereY() + y);
                this._Crt.GotoXY(1, y);
                break;
            case 'F':
                y = Math.max(1, this.GetNextParam(1));
                y = Math.max(1, this._Crt.WhereY() - y);
                this._Crt.GotoXY(1, y);
                break;
            case 'G':
                x = Math.max(1, this.GetNextParam(1));
                if ((x >= 1) && (x <= this._Crt.WindCols)) {
                    this._Crt.GotoXY(x, this._Crt.WhereY());
                }
                break;
            case 'H':
            case 'f':
                y = Math.max(1, this.GetNextParam(1));
                x = Math.max(1, this.GetNextParam(1));
                this._Crt.GotoXY(x, y);
                break;
            case 'h':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (this._AnsiParams[0]) {
                    case '=255':
                        console.log('Unhandled ESC sequence: Enable DoorWay Mode');
                        break;
                    case '?6':
                        console.log('Unhandled ESC sequence: Enable origin mode');
                        break;
                    case '?7':
                        console.log('Unhandled ESC sequence: Enable auto wrap');
                        break;
                    case '?25':
                        this._Crt.ShowCursor();
                        break;
                    case '?31':
                        console.log('Unhandled ESC sequence: Enable alt character set');
                        break;
                    case '?32':
                        console.log('Unhandled ESC sequence: Bright Intensity Enable');
                        break;
                    case '?33':
                        console.log('Unhandled ESC sequence: Blink to Bright Intensity Background');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'J':
                switch (this.GetNextParam(0)) {
                    case 0:
                        this._Crt.ClrEos();
                        break;
                    case 1:
                        this._Crt.ClrBos();
                        break;
                    case 2:
                        this._Crt.ClrScr();
                        break;
                    case 3:
                        this._Crt.ClrScr();
                        break;
                }
                break;
            case 'K':
                switch (this.GetNextParam(0)) {
                    case 0:
                        this._Crt.ClrEol();
                        break;
                    case 1:
                        this._Crt.ClrBol();
                        break;
                    case 2:
                        this._Crt.ClrLine();
                        break;
                }
                break;
            case 'L':
                y = Math.max(1, this.GetNextParam(1));
                this._Crt.InsLine(y);
                break;
            case 'l':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                switch (this._AnsiParams[0]) {
                    case '=255':
                        console.log('Unhandled ESC sequence: Disable DoorWay Mode');
                        break;
                    case '?6':
                        console.log('Unhandled ESC sequence: Disable origin mode');
                        break;
                    case '?7':
                        console.log('Unhandled ESC sequence: Disable auto wrap');
                        break;
                    case '?25':
                        this._Crt.HideCursor();
                        break;
                    case '?31':
                        console.log('Unhandled ESC sequence: Disable alt character set');
                        break;
                    case '?32':
                        console.log('Unhandled ESC sequence: Bright Intensity Disable');
                        break;
                    case '?33':
                        console.log('Unhandled ESC sequence: Blink Normal');
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'M':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('1');
                }
                if (this._AnsiParams[0][0] === '=') {
                    x = this.GetNextParam(0);
                    switch (x) {
                        case 0:
                            console.log('Unhandled ESC sequence: Only CSI | will introduce an ANSI music string.');
                            break;
                        case 1:
                            console.log('Unhandled ESC sequence: Both CSI | and CSI N will introduce an ANSI music string.');
                            break;
                        case 2:
                            console.log('Unhandled ESC sequence: CSI |, CSI N, and CSI M will all introduce and ANSI music string.');
                            break;
                        default:
                            console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                            break;
                    }
                }
                else {
                    y = Math.max(1, this.GetNextParam(1));
                    this._Crt.DelLine(y);
                }
                break;
            case 'm':
                if (this._AnsiParams.length < 1) {
                    this._AnsiParams.push('0');
                }
                while (this._AnsiParams.length > 0) {
                    x = this.GetNextParam(0);
                    switch (x) {
                        case 0:
                            this._Crt.NormVideo();
                            break;
                        case 1:
                            this._Crt.HighVideo();
                            break;
                        case 2:
                            this._Crt.LowVideo();
                            break;
                        case 3:
                            break;
                        case 4:
                            break;
                        case 5:
                            this._Crt.SetBlink(true);
                            this._Crt.SetBlinkRate(500);
                            break;
                        case 6:
                            this._Crt.SetBlink(true);
                            this._Crt.SetBlinkRate(250);
                            break;
                        case 7:
                            this._Crt.ReverseVideo();
                            break;
                        case 8:
                            this._AnsiAttr = this._Crt.TextAttr;
                            this._Crt.Conceal();
                            break;
                        case 21:
                            break;
                        case 22:
                            this._Crt.LowVideo();
                            break;
                        case 24:
                            break;
                        case 25:
                            this._Crt.SetBlink(false);
                            break;
                        case 27:
                            this._Crt.ReverseVideo();
                            break;
                        case 28:
                            this._Crt.TextAttr = this._AnsiAttr;
                            break;
                        case 30:
                        case 31:
                        case 32:
                        case 33:
                        case 34:
                        case 35:
                        case 36:
                        case 37:
                            Colour = this.ANSI_COLORS[x - 30];
                            if (this._Crt.TextAttr % 16 > 7) {
                                Colour += 8;
                            }
                            this._Crt.TextColor(Colour);
                            break;
                        case 38:
                            switch (this.GetNextParam(0)) {
                                case 2:
                                    if (this._AnsiParams.length === 3) {
                                        this._Crt.TextColor24(this.GetNextParam(0), this.GetNextParam(0), this.GetNextParam(0));
                                    }
                                    else {
                                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                                    }
                                    break;
                                case 5:
                                    Colour256 = this.ANSI256_COLORS[this.GetNextParam(0)];
                                    this._Crt.TextColor24(Colour256.r, Colour256.g, Colour256.b);
                                    break;
                                default:
                                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                                    break;
                            }
                            break;
                        case 39:
                            Colour = this.ANSI_COLORS[37 - 30];
                            if (this._Crt.TextAttr % 16 > 7) {
                                Colour += 8;
                            }
                            this._Crt.TextColor(Colour);
                            break;
                        case 40:
                        case 41:
                        case 42:
                        case 43:
                        case 44:
                        case 45:
                        case 46:
                        case 47:
                            Colour = this.ANSI_COLORS[x - 40];
                            this._Crt.TextBackground(Colour);
                            break;
                        case 48:
                            switch (this.GetNextParam(0)) {
                                case 2:
                                    if (this._AnsiParams.length === 3) {
                                        this._Crt.TextBackground24(this.GetNextParam(0), this.GetNextParam(0), this.GetNextParam(0));
                                    }
                                    else {
                                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                                    }
                                    break;
                                case 5:
                                    Colour256 = this.ANSI256_COLORS[this.GetNextParam(0)];
                                    this._Crt.TextBackground24(Colour256.r, Colour256.g, Colour256.b);
                                    break;
                                default:
                                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                                    break;
                            }
                            break;
                        case 49:
                            Colour = this.ANSI_COLORS[40 - 40];
                            this._Crt.TextBackground(Colour);
                            break;
                        case 90:
                        case 91:
                        case 92:
                        case 93:
                        case 94:
                        case 95:
                        case 96:
                        case 97:
                            Colour = this.ANSI_COLORS[x - 90] + 8;
                            this._Crt.TextColor(Colour);
                            break;
                        case 100:
                        case 101:
                        case 102:
                        case 103:
                        case 104:
                        case 105:
                        case 106:
                        case 107:
                            Colour = this.ANSI_COLORS[x - 100] + 8;
                            this._Crt.TextBackground(Colour);
                            break;
                    }
                }
                break;
            case 'N':
                console.log('Unhandled ESC sequence: ANSI Music');
                break;
            case 'n':
                x = this.GetNextParam(0);
                switch (x) {
                    case 5:
                        this.onesc5n.trigger();
                        break;
                    case 6:
                        this.onesc6n.trigger();
                        break;
                    case 255:
                        this.onesc255n.trigger();
                        break;
                    default:
                        console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                        break;
                }
                break;
            case 'P':
                x = Math.max(1, this.GetNextParam(1));
                this._Crt.DelChar(x);
                break;
            case 'Q':
                x = this.GetNextParam(0);
                y = this.GetNextParam(0);
                z = this.GetNextParam(0);
                this.onescQ.trigger(x.toString(10));
                break;
            case 'r':
                if (this._AnsiIntermediates.length === 0) {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                }
                else if (this._AnsiIntermediates[0].indexOf('*') !== -1) {
                    console.log('Unhandled ESC sequence: Set the output emulation speed.');
                }
                else if (this._AnsiIntermediates[0].indexOf(']') !== -1) {
                    console.log('Unhandled ESC sequence: Set Top and Bottom Margins');
                }
                else {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                }
                break;
            case 'S':
                y = Math.max(1, this.GetNextParam(1));
                this._Crt.ScrollUpScreen(y);
                break;
            case 's':
                if (this._AnsiIntermediates.length === 0) {
                    this._AnsiXY = new Point(this._Crt.WhereX(), this._Crt.WhereY());
                }
                else {
                    console.log('Unhandled ESC sequence: Save Mode Setting');
                }
                break;
            case 'T':
                y = Math.max(1, this.GetNextParam(1));
                this._Crt.ScrollDownWindow(y);
                break;
            case 't':
                if (this._AnsiParams.length === 4) {
                    switch (this.GetNextParam(1)) {
                        case 0:
                            this._Crt.TextBackground24(this.GetNextParam(0), this.GetNextParam(0), this.GetNextParam(0));
                            break;
                        case 1:
                            this._Crt.TextColor24(this.GetNextParam(0), this.GetNextParam(0), this.GetNextParam(0));
                            break;
                        default:
                            console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                            break;
                    }
                }
                else {
                    console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                }
                break;
            case 'U':
                console.log('Unhandled ESC sequence: Clear screen with default attribute');
                break;
            case 'u':
                if (this._AnsiIntermediates.length === 0) {
                    this._Crt.GotoXY(this._AnsiXY.x, this._AnsiXY.y);
                }
                else {
                    console.log('Unhandled ESC sequence: Restore Mode Setting');
                }
                break;
            case 'X':
                x = Math.max(1, this.GetNextParam(1));
                this._Crt.DelChar(x);
                break;
            case 'Z':
                console.log('Unhandled ESC sequnce: Cursor Backward Tabulation');
                break;
            default:
                console.log('Unknown ESC sequence: PB(' + this._AnsiParams.toString() + ') IB(' + this._AnsiIntermediates.toString() + ') FB(' + finalByte + ')');
                break;
        }
    };
    Ansi.prototype.CursorPosition = function (x, y) {
        if (typeof x === 'undefined') {
            x = this._Crt.WhereXA();
        }
        if (typeof y === 'undefined') {
            y = this._Crt.WhereYA();
        }
        return '\x1B[' + y + ';' + x + 'R';
    };
    Ansi.prototype.GetNextParam = function (defaultValue) {
        var Result = this._AnsiParams.shift();
        if (typeof Result === 'undefined') {
            return defaultValue;
        }
        else {
            return parseInt(Result, 10);
        }
    };
    Ansi.prototype.Write = function (text) {
        if (this._Crt.Atari || this._Crt.C64) {
            this._Crt.Write(text);
        }
        else {
            var Buffer = '';
            for (var i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\x1B') {
                    this._AnsiParserState = AnsiParserState.Escape;
                }
                else if (this._AnsiParserState === AnsiParserState.Escape) {
                    if (text.charAt(i) === '[') {
                        this._AnsiParserState = AnsiParserState.Bracket;
                        this._AnsiBuffer = '';
                        while (this._AnsiParams.length > 0) {
                            this._AnsiParams.pop();
                        }
                        while (this._AnsiIntermediates.length > 0) {
                            this._AnsiIntermediates.pop();
                        }
                    }
                    else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                }
                else if (this._AnsiParserState === AnsiParserState.Bracket) {
                    if (text.charAt(i) === '!') {
                        this._Crt.Write(Buffer);
                        Buffer = '';
                        this.AnsiCommand(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.ParameterByte;
                    }
                    else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        this._AnsiBuffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.IntermediateByte;
                    }
                    else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        this._Crt.Write(Buffer);
                        Buffer = '';
                        this.AnsiCommand(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                }
                else if (this._AnsiParserState === AnsiParserState.ParameterByte) {
                    if (text.charAt(i) === '!') {
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                        this._Crt.Write(Buffer);
                        Buffer = '';
                        this.AnsiCommand(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else if (text.charAt(i) === ';') {
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                    }
                    else if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        this._AnsiBuffer += text.charAt(i);
                    }
                    else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                        this._AnsiIntermediates.push(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.IntermediateByte;
                    }
                    else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        this._AnsiParams.push((this._AnsiBuffer === '') ? '0' : this._AnsiBuffer);
                        this._AnsiBuffer = '';
                        this._Crt.Write(Buffer);
                        Buffer = '';
                        this.AnsiCommand(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                }
                else if (this._AnsiParserState === AnsiParserState.IntermediateByte) {
                    if ((text.charAt(i) >= '0') && (text.charAt(i) <= '?')) {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else if ((text.charAt(i) >= ' ') && (text.charAt(i) <= '/')) {
                        this._AnsiIntermediates.push(text.charAt(i));
                    }
                    else if ((text.charAt(i) >= '@') && (text.charAt(i) <= '~')) {
                        this._Crt.Write(Buffer);
                        Buffer = '';
                        this.AnsiCommand(text.charAt(i));
                        this._AnsiParserState = AnsiParserState.None;
                    }
                    else {
                        Buffer += text.charAt(i);
                        this._AnsiParserState = AnsiParserState.None;
                    }
                }
                else {
                    Buffer += text.charAt(i);
                }
            }
            this._Crt.Write(Buffer);
        }
    };
    Ansi.prototype.WriteLn = function (text) {
        this.Write(text + '\r\n');
    };
    return Ansi;
}());
var AnsiParserState;
(function (AnsiParserState) {
    AnsiParserState[AnsiParserState["None"] = 0] = "None";
    AnsiParserState[AnsiParserState["Escape"] = 1] = "Escape";
    AnsiParserState[AnsiParserState["Bracket"] = 2] = "Bracket";
    AnsiParserState[AnsiParserState["ParameterByte"] = 3] = "ParameterByte";
    AnsiParserState[AnsiParserState["IntermediateByte"] = 4] = "IntermediateByte";
})(AnsiParserState || (AnsiParserState = {}));
var BlinkState;
(function (BlinkState) {
    BlinkState[BlinkState["Show"] = 0] = "Show";
    BlinkState[BlinkState["Hide"] = 1] = "Hide";
})(BlinkState || (BlinkState = {}));
var CharInfo = (function () {
    function CharInfo(oldCharInfo) {
        if (oldCharInfo == null) {
            this.Attr = Crt.LIGHTGRAY;
            this.Back24 = CrtFont.ANSI_COLOURS[Crt.BLACK];
            this.Blink = false;
            this.Ch = ' ';
            this.Fore24 = CrtFont.ANSI_COLOURS[Crt.LIGHTGRAY];
            this.NeedsRedraw = false;
            this.Reverse = false;
            this.Underline = false;
        }
        else {
            this.Set(oldCharInfo);
        }
    }
    CharInfo.GetNew = function (ch, attr) {
        var Result = new CharInfo(null);
        Result.Attr = attr;
        Result.Back24 = CrtFont.ANSI_COLOURS[(attr & 0xF0) >> 4];
        Result.Ch = ch;
        Result.Fore24 = CrtFont.ANSI_COLOURS[attr & 0x0F];
        return Result;
    };
    CharInfo.prototype.Set = function (oldCharInfo) {
        this.Attr = oldCharInfo.Attr;
        this.Back24 = oldCharInfo.Back24;
        this.Blink = oldCharInfo.Blink;
        this.Ch = oldCharInfo.Ch;
        this.Fore24 = oldCharInfo.Fore24;
        this.Reverse = oldCharInfo.Reverse;
        this.Underline = oldCharInfo.Underline;
    };
    return CharInfo;
}());
var Crt = (function () {
    function Crt(container, useModernScrollback) {
        var _this = this;
        this.onfontchange = new TypedEvent();
        this.onkeypressed = new TypedEvent();
        this.onscreensizechange = new TypedEvent();
        this._AllowDynamicFontResize = true;
        this._Atari = false;
        this._ATASCIIEscaped = false;
        this._BareLFtoCRLF = false;
        this._BlinkHidden = false;
        this._C64 = false;
        this._CharInfo = new CharInfo(null);
        this._FlushBeforeWritePETSCII = [0x05, 0x07, 0x08, 0x09, 0x0A, 0x0D, 0x0E, 0x11, 0x12, 0x13, 0x14, 0x1c, 0x1d, 0x1e, 0x1f, 0x81, 0x8d, 0x8e, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f];
        this._InScrollback = false;
        this._KeyBuf = [];
        this._LastChar = 0x00;
        this._LocalEcho = false;
        this._ScreenSize = new Point(80, 25);
        this._ScrollbackPosition = -1;
        this._ScrollbackSize = 250;
        this._SkipRedrawWhenSameFontSize = false;
        this._Transparent = false;
        this._UseModernScrollback = false;
        this._WindMin = 0;
        this._WindMax = (80 - 1) | ((25 - 1) << 8);
        this._Container = container;
        this._UseModernScrollback = useModernScrollback;
        this._Font = new CrtFont();
        this._Font.onchange.on(function (oldSize) { _this.OnFontChanged(oldSize); });
        this._Canvas = document.createElement('canvas');
        this._Canvas.className = 'fTelnetCrtCanvas';
        this._Canvas.innerHTML = 'Your browser does not support the HTML5 Canvas element!<br>The latest version of every major web browser supports this element, so please consider upgrading now:<ul><li><a href="http://www.mozilla.com/firefox/">Mozilla Firefox</a></li><li><a href="http://www.google.com/chrome">Google Chrome</a></li><li><a href="http://www.apple.com/safari/">Apple Safari</a></li><li><a href="http://www.opera.com/">Opera</a></li><li><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home">MS Internet Explorer</a></li></ul>';
        this._Canvas.style.zIndex = '50';
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
        }
        else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
            if (!!window.cordova) {
                this._Canvas.style.width = '100%';
            }
        }
        if (!DetectMobileBrowser.IsMobile) {
            this._Canvas.addEventListener('mousedown', function (me) { _this.OnMouseDown(me); }, false);
            this._Canvas.addEventListener('mousemove', function (me) { _this.OnMouseMove(me); }, false);
            this._Canvas.addEventListener('mouseup', function (me) { _this.OnMouseUp(me); }, false);
            window.addEventListener('mouseup', function (me) { _this.OnMouseUpForWindow(me); }, false);
        }
        if (!this._Canvas.getContext) {
            console.log('fTelnet Error: Canvas not supported');
        }
        this._Container.appendChild(this._Canvas);
        window.addEventListener('keydown', function (ke) { _this.OnKeyDown(ke); }, false);
        window.addEventListener('keypress', function (ke) { _this.OnKeyPress(ke); }, false);
        window.addEventListener('resize', function () { _this.OnResize(); }, false);
        this.InitBuffers(true);
        this._Cursor = new Cursor(CrtFont.ANSI_COLOURS[Crt.LIGHTGRAY], this._Font.Size);
        this._Cursor.onhide.on(function () { _this.OnBlinkHide(); });
        this._Cursor.onshow.on(function () { _this.OnBlinkShow(); });
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);
        var CanvasContext = this._Canvas.getContext('2d');
        if (CanvasContext === null) {
            console.log('fTelnet Error: _Canvas.getContext error');
        }
        else {
            this._CanvasContext = CanvasContext;
        }
        this._CanvasContext.font = '12pt monospace';
        this._CanvasContext.textBaseline = 'top';
        if (this._UseModernScrollback) {
            this._CanvasContext.fillStyle = 'black';
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
        }
        this._TempCanvas = document.createElement('canvas');
        this._TempCanvas.width = this._Canvas.width;
        this._TempCanvas.height = this._Canvas.height;
        var TempCanvasContext = this._TempCanvas.getContext('2d');
        if (TempCanvasContext === null) {
            console.log('fTelnet Error: _TempCanvas.getContext error');
        }
        else {
            this._TempCanvasContext = TempCanvasContext;
        }
        this._TempCanvasContext.font = '12pt monospace';
        this._TempCanvasContext.textBaseline = 'top';
        this.ClrScr();
    }
    Object.defineProperty(Crt.prototype, "AllowDynamicFontResize", {
        get: function () {
            return this._AllowDynamicFontResize;
        },
        set: function (value) {
            this._AllowDynamicFontResize = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "Atari", {
        get: function () {
            return this._Atari;
        },
        set: function (value) {
            this._Atari = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "BareLFtoCRLF", {
        get: function () {
            return this._BareLFtoCRLF;
        },
        set: function (value) {
            this._BareLFtoCRLF = value;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.Beep = function () {
    };
    Object.defineProperty(Crt.prototype, "C64", {
        get: function () {
            return this._C64;
        },
        set: function (value) {
            this._C64 = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "Canvas", {
        get: function () {
            return this._Canvas;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.ClrBol = function () {
        this.FastWrite(StringUtils.NewString(' ', this.WhereX()), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    };
    Crt.prototype.ClrBos = function () {
        this.ScrollUpWindow(this.WhereY() - 1);
        this.ScrollDownWindow(this.WhereY() - 1);
        this.ClrBol();
    };
    Crt.prototype.ClrEol = function () {
        this.FastWrite(StringUtils.NewString(' ', (this.WindMaxX + 1) - this.WhereX() + 1), this.WhereXA(), this.WhereYA(), this._CharInfo);
    };
    Crt.prototype.ClrEos = function () {
        this.ScrollDownWindow(this.WindRows - this.WhereY());
        this.ScrollUpWindow(this.WindRows - this.WhereY());
        this.ClrEol();
    };
    Crt.prototype.ClrLine = function () {
        this.FastWrite(StringUtils.NewString(' ', this.WindCols), this.WindMinX + 1, this.WhereYA(), this._CharInfo);
    };
    Crt.prototype.ClrScr = function () {
        this.ScrollUpWindow(this.WindRows);
        this.GotoXY(1, 1);
    };
    Crt.prototype.Conceal = function () {
        this.TextColor((this.TextAttr & 0xF0) >> 4);
    };
    Crt.prototype.DelChar = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }
        var i;
        for (i = this.WhereXA(); i <= this.WindMinX + this.WindCols - count; i++) {
            this.FastWrite(this._Buffer[this.WhereYA()][i + count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i + count]);
        }
        for (i = this.WindMinX + this.WindCols + 1 - count; i <= this.WindMinX + this.WindCols; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    };
    Crt.prototype.DelLine = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }
        this.ScrollUpCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };
    Crt.prototype.EnterScrollback = function () {
        if (this._UseModernScrollback) {
            return;
        }
        if (!this._InScrollback) {
            this._InScrollback = true;
            var NewRow;
            var X;
            var Y;
            this._ScrollbackTemp = [];
            for (Y = 0; Y < this._Scrollback.length; Y++) {
                NewRow = [];
                for (X = 0; X < this._Scrollback[Y].length; X++) {
                    NewRow.push(new CharInfo(this._Scrollback[Y][X]));
                }
                this._ScrollbackTemp.push(NewRow);
            }
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                NewRow = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    NewRow.push(new CharInfo(this._Buffer[Y][X]));
                }
                this._ScrollbackTemp.push(NewRow);
            }
            this._ScrollbackPosition = this._ScrollbackTemp.length;
        }
    };
    Crt.prototype.ExitScrollback = function () {
        if (typeof this._Buffer !== 'undefined') {
            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                }
            }
        }
        this._InScrollback = false;
    };
    Crt.prototype.FastWrite = function (text, x, y, charInfo, updateBuffer) {
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }
        if ((x <= this._ScreenSize.x) && (y <= this._ScreenSize.y)) {
            var Chars = [];
            var CharCodes = [];
            var TextLength;
            if (typeof text === 'undefined') {
                TextLength = 1;
                Chars.push(' ');
                CharCodes.push(this._Transparent ? CrtFont.TRANSPARENT_CHARCODE : 32);
            }
            else {
                TextLength = text.length;
                for (var i = 0; i < TextLength; i++) {
                    Chars.push(text.charAt(i));
                    CharCodes.push(text.charCodeAt(i));
                }
            }
            for (var i = 0; i < TextLength; i++) {
                var BGetChar = Benchmarks.Start('GetChar');
                var Char = this._Font.GetChar(CharCodes[i], charInfo);
                BGetChar.Stop();
                var BPutImage = Benchmarks.Start('PutImage');
                if (typeof Char === 'undefined') {
                    this._Buffer[y][x + i].NeedsRedraw = true;
                }
                else {
                    if (this._UseModernScrollback) {
                        this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1 + this._ScrollbackSize) * this._Font.Height);
                    }
                    else {
                        if ((!this._InScrollback) || (this._InScrollback && !updateBuffer)) {
                            this._CanvasContext.putImageData(Char, (x - 1 + i) * this._Font.Width, (y - 1) * this._Font.Height);
                        }
                    }
                }
                BPutImage.Stop();
                var BUpdateBuffer = Benchmarks.Start('UpdateBuffer');
                if (updateBuffer) {
                    var CharToUpdate = this._Buffer[y][x + i];
                    CharToUpdate.Set(charInfo);
                    CharToUpdate.Ch = Chars[i];
                }
                BUpdateBuffer.Stop();
                if (x + i >= this._ScreenSize.x) {
                    break;
                }
            }
        }
    };
    Crt.prototype.FillScreen = function (ch) {
        var Line = StringUtils.NewString(ch.charAt(0), this.ScreenCols);
        for (var Y = 1; Y <= this.ScreenRows; Y++) {
            this.FastWrite(Line, 1, Y, this._CharInfo);
        }
    };
    Object.defineProperty(Crt.prototype, "Font", {
        get: function () {
            return this._Font;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.GotoXY = function (x, y) {
        if ((x >= 1) && (y >= 1) && ((x - 1 + this.WindMinX) <= this.WindMaxX) && ((y - 1 + this.WindMinY) <= this.WindMaxY)) {
            this._Cursor.Position = new Point(x, y);
        }
    };
    Crt.prototype.HideCursor = function () {
        this._Cursor.Visible = false;
    };
    Crt.prototype.HighVideo = function () {
        this.TextAttr |= 0x08;
    };
    Crt.prototype.InitBuffers = function (initScrollback) {
        this._Buffer = [];
        for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
            this._Buffer[Y] = [];
            for (var X = 1; X <= this._ScreenSize.x; X++) {
                this._Buffer[Y][X] = new CharInfo(null);
            }
        }
        if (initScrollback) {
            this._Scrollback = [];
        }
    };
    Crt.prototype.InsChar = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }
        var i;
        for (i = this.WindMinX + this.WindCols; i >= this.WhereXA() + count; i--) {
            this.FastWrite(this._Buffer[this.WhereYA()][i - count].Ch, i, this.WhereYA(), this._Buffer[this.WhereYA()][i - count]);
        }
        for (i = this.WhereXA(); i < this.WhereXA() + count; i++) {
            this.FastWrite(' ', i, this.WhereYA(), this._CharInfo);
        }
    };
    Crt.prototype.InsLine = function (count) {
        if (typeof count === 'undefined') {
            count = 1;
        }
        this.ScrollDownCustom(this.WindMinX + 1, this.WhereYA(), this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };
    Crt.prototype.KeyPressed = function () {
        return (this._KeyBuf.length > 0);
    };
    Object.defineProperty(Crt.prototype, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.LowVideo = function () {
        this.TextAttr &= 0xF7;
    };
    Crt.prototype.MousePositionToScreenPosition = function (x, y) {
        if (this._UseModernScrollback) {
            y -= this._ScrollbackSize * this._Font.Height;
        }
        return new Point(Math.floor(x / this._Font.Width) + 1, Math.floor(y / this._Font.Height) + 1);
    };
    Crt.prototype.NormVideo = function () {
        this.TextBackground(Crt.BLACK);
        if (this._C64) {
            this.TextAttr = Crt.PETSCII_WHITE;
        }
        else {
            this.TextAttr = Crt.LIGHTGRAY;
        }
        this._CharInfo.Blink = false;
        this._CharInfo.Underline = false;
        this._CharInfo.Reverse = false;
    };
    Crt.prototype.OnBlinkHide = function () {
        this._BlinkHidden = true;
        for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
            for (var X = 1; X <= this._ScreenSize.x; X++) {
                if (this._Buffer[Y][X].Blink) {
                    if (this._Buffer[Y][X].Ch !== ' ') {
                        this.FastWrite(' ', X, Y, this._Buffer[Y][X], false);
                    }
                }
            }
        }
        this._CanvasContext.fillStyle = this._Cursor.Colour;
        if (this._UseModernScrollback) {
            this._CanvasContext.fillRect((this.WhereXA() - 1) * this._Font.Size.x, ((this.WhereYA() + this._ScrollbackSize) * this._Font.Size.y) - (this._Font.Size.y * 0.20), this._Font.Size.x, this._Font.Size.y * 0.20);
        }
        else {
            this._CanvasContext.fillRect((this.WhereXA() - 1) * this._Font.Size.x, (this.WhereYA() * this._Font.Size.y) - (this._Font.Size.y * 0.20), this._Font.Size.x, this._Font.Size.y * 0.20);
        }
        this._Cursor.LastPosition = new Point(this.WhereXA(), this.WhereYA());
    };
    Crt.prototype.OnBlinkShow = function () {
        if (this._BlinkHidden) {
            this._BlinkHidden = false;
            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    if (this._Buffer[Y][X].Blink) {
                        if (this._Buffer[Y][X].Ch !== ' ') {
                            this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                        }
                    }
                }
            }
        }
        var X = this._Cursor.LastPosition.x;
        var Y = this._Cursor.LastPosition.y;
        var Cell = this._Buffer[Y][X];
        this.FastWrite(Cell.Ch, X, Y, Cell, false);
    };
    Crt.prototype.OnFontChanged = function (oldSize) {
        if ((oldSize.x == this._Font.Size.x) && (oldSize.y == this._Font.Size.y)) {
            if (this._SkipRedrawWhenSameFontSize) {
                if (typeof this._Buffer !== 'undefined') {
                    for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                        for (var X = 1; X <= this._ScreenSize.x; X++) {
                            if (this._Buffer[Y][X].NeedsRedraw) {
                                this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                                this._Buffer[Y][X].NeedsRedraw = false;
                            }
                        }
                    }
                }
                return;
            }
        }
        this._Cursor.Size = this._Font.Size;
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
        }
        else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        }
        this._TempCanvas.width = this._Canvas.width;
        this._TempCanvas.height = this._Canvas.height;
        if (typeof this._Buffer !== 'undefined') {
            for (var Y = 1; Y <= this._ScreenSize.y; Y++) {
                for (var X = 1; X <= this._ScreenSize.x; X++) {
                    this.FastWrite(this._Buffer[Y][X].Ch, X, Y, this._Buffer[Y][X], false);
                    this._Buffer[Y][X].NeedsRedraw = false;
                }
            }
        }
        this.onfontchange.trigger();
    };
    Crt.prototype.OnKeyDown = function (ke) {
        if (!window.cordova) {
            if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) {
                return;
            }
        }
        if (this._InScrollback) {
            var i;
            var X;
            var XEnd;
            var YDest;
            var YSource;
            if (ke.keyCode === KeyboardKeys.DOWN) {
                if (this._ScrollbackPosition < this._ScrollbackTemp.length) {
                    this._ScrollbackPosition += 1;
                    this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(null), false);
                    YDest = this._ScreenSize.y;
                    YSource = this._ScrollbackPosition - 1;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollbackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollbackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollbackTemp[YSource][X], false);
                    }
                }
            }
            else if (ke.keyCode === KeyboardKeys.PAGE_DOWN) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(KeyboardKeys.DOWN, KeyboardKeys.DOWN, false, false, false);
                }
            }
            else if (ke.keyCode === KeyboardKeys.PAGE_UP) {
                for (i = 0; i < this._ScreenSize.y; i++) {
                    this.PushKeyDown(KeyboardKeys.UP, KeyboardKeys.UP, false, false, false);
                }
            }
            else if (ke.keyCode === KeyboardKeys.UP) {
                if (this._ScrollbackPosition > this._ScreenSize.y) {
                    this._ScrollbackPosition -= 1;
                    this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, 1, new CharInfo(null), false);
                    YDest = 1;
                    YSource = this._ScrollbackPosition - this._ScreenSize.y;
                    XEnd = Math.min(this._ScreenSize.x, this._ScrollbackTemp[YSource].length);
                    for (X = 0; X < XEnd; X++) {
                        this.FastWrite(this._ScrollbackTemp[YSource][X].Ch, X + 1, YDest, this._ScrollbackTemp[YSource][X], false);
                    }
                }
            }
            ke.preventDefault();
            return;
        }
        var keyString = '';
        if (this._Atari) {
            if (ke.ctrlKey) {
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    switch (ke.keyCode) {
                        case 72:
                            keyString = String.fromCharCode(126);
                            break;
                        case 74:
                            keyString = String.fromCharCode(13);
                            break;
                        case 77:
                            keyString = String.fromCharCode(155);
                            break;
                        default:
                            keyString = String.fromCharCode(ke.keyCode - 64);
                            break;
                    }
                }
                else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    switch (ke.keyCode) {
                        case 104:
                            keyString = String.fromCharCode(126);
                            break;
                        case 106:
                            keyString = String.fromCharCode(13);
                            break;
                        case 109:
                            keyString = String.fromCharCode(155);
                            break;
                        default:
                            keyString = String.fromCharCode(ke.keyCode - 96);
                            break;
                    }
                }
            }
            else {
                switch (ke.keyCode) {
                    case KeyboardKeys.BACKSPACE:
                        keyString = '\x7E';
                        break;
                    case KeyboardKeys.DELETE:
                        keyString = '\x7E';
                        break;
                    case KeyboardKeys.DOWN:
                        keyString = '\x1D';
                        break;
                    case KeyboardKeys.ENTER:
                        keyString = '\x9B';
                        break;
                    case KeyboardKeys.LEFT:
                        keyString = '\x1E';
                        break;
                    case KeyboardKeys.RIGHT:
                        keyString = '\x1F';
                        break;
                    case KeyboardKeys.SPACE:
                        keyString = ' ';
                        break;
                    case KeyboardKeys.TAB:
                        keyString = '\x7F';
                        break;
                    case KeyboardKeys.UP:
                        keyString = '\x1C';
                        break;
                }
            }
        }
        else if (this._C64) {
            switch (ke.keyCode) {
                case KeyboardKeys.BACKSPACE:
                    keyString = '\x14';
                    break;
                case KeyboardKeys.DELETE:
                    keyString = '\x14';
                    break;
                case KeyboardKeys.DOWN:
                    keyString = '\x11';
                    break;
                case KeyboardKeys.ENTER:
                    keyString = '\r';
                    break;
                case KeyboardKeys.F1:
                    keyString = '\x85';
                    break;
                case KeyboardKeys.F2:
                    keyString = '\x89';
                    break;
                case KeyboardKeys.F3:
                    keyString = '\x86';
                    break;
                case KeyboardKeys.F4:
                    keyString = '\x8A';
                    break;
                case KeyboardKeys.F5:
                    keyString = '\x87';
                    break;
                case KeyboardKeys.F6:
                    keyString = '\x8B';
                    break;
                case KeyboardKeys.F7:
                    keyString = '\x88';
                    break;
                case KeyboardKeys.F8:
                    keyString = '\x8C';
                    break;
                case KeyboardKeys.HOME:
                    keyString = '\x13';
                    break;
                case KeyboardKeys.INSERT:
                    keyString = '\x94';
                    break;
                case KeyboardKeys.LEFT:
                    keyString = '\x9D';
                    break;
                case KeyboardKeys.RIGHT:
                    keyString = '\x1D';
                    break;
                case KeyboardKeys.SPACE:
                    keyString = ' ';
                    break;
                case KeyboardKeys.UP:
                    keyString = '\x91';
                    break;
            }
        }
        else {
            if (ke.ctrlKey) {
                if ((ke.keyCode >= 65) && (ke.keyCode <= 90)) {
                    keyString = String.fromCharCode(ke.keyCode - 64);
                }
                else if ((ke.keyCode >= 97) && (ke.keyCode <= 122)) {
                    keyString = String.fromCharCode(ke.keyCode - 96);
                }
            }
            else {
                switch (ke.keyCode) {
                    case KeyboardKeys.BACKSPACE:
                        keyString = '\b';
                        break;
                    case KeyboardKeys.DELETE:
                        keyString = '\x7F';
                        break;
                    case KeyboardKeys.DOWN:
                        keyString = '\x1B[B';
                        break;
                    case KeyboardKeys.END:
                        keyString = '\x1B[K';
                        break;
                    case KeyboardKeys.ENTER:
                        keyString = '\r\n';
                        break;
                    case KeyboardKeys.ESCAPE:
                        keyString = '\x1B';
                        break;
                    case KeyboardKeys.F1:
                        keyString = '\x1BOP';
                        break;
                    case KeyboardKeys.F2:
                        keyString = '\x1BOQ';
                        break;
                    case KeyboardKeys.F3:
                        keyString = '\x1BOR';
                        break;
                    case KeyboardKeys.F4:
                        keyString = '\x1BOS';
                        break;
                    case KeyboardKeys.F5:
                        keyString = '\x1BOt';
                        break;
                    case KeyboardKeys.F6:
                        keyString = '\x1B[17~';
                        break;
                    case KeyboardKeys.F7:
                        keyString = '\x1B[18~';
                        break;
                    case KeyboardKeys.F8:
                        keyString = '\x1B[19~';
                        break;
                    case KeyboardKeys.F9:
                        keyString = '\x1B[20~';
                        break;
                    case KeyboardKeys.F10:
                        keyString = '\x1B[21~';
                        break;
                    case KeyboardKeys.F11:
                        keyString = '\x1B[23~';
                        break;
                    case KeyboardKeys.F12:
                        keyString = '\x1B[24~';
                        break;
                    case KeyboardKeys.HOME:
                        keyString = '\x1B[H';
                        break;
                    case KeyboardKeys.INSERT:
                        keyString = '\x1B@';
                        break;
                    case KeyboardKeys.LEFT:
                        keyString = '\x1B[D';
                        break;
                    case KeyboardKeys.PAGE_DOWN:
                        keyString = '\x1B[U';
                        break;
                    case KeyboardKeys.PAGE_UP:
                        keyString = '\x1B[V';
                        break;
                    case KeyboardKeys.RIGHT:
                        keyString = '\x1B[C';
                        break;
                    case KeyboardKeys.SPACE:
                        keyString = ' ';
                        break;
                    case KeyboardKeys.TAB:
                        keyString = '\t';
                        break;
                    case KeyboardKeys.UP:
                        keyString = '\x1B[A';
                        break;
                }
            }
        }
        this._KeyBuf.push(new KeyPressEvent(ke, keyString));
        if ((keyString) || (ke.ctrlKey)) {
            ke.preventDefault();
            this.onkeypressed.trigger();
        }
    };
    Crt.prototype.OnKeyPress = function (ke) {
        if (!window.cordova) {
            if ((ke.target instanceof HTMLInputElement) || (ke.target instanceof HTMLTextAreaElement)) {
                return;
            }
        }
        if (this._InScrollback) {
            return;
        }
        var keyString = '';
        if (ke.altKey || ke.ctrlKey) {
            return;
        }
        var which = (typeof ke.charCode !== 'undefined') ? ke.charCode : ke.which;
        if (this._Atari) {
            if ((which >= 33) && (which <= 122)) {
                keyString = String.fromCharCode(which);
            }
        }
        else if (this._C64) {
            if ((which >= 33) && (which <= 64)) {
                keyString = String.fromCharCode(which);
            }
            else if ((which >= 65) && (which <= 90)) {
                keyString = String.fromCharCode(which).toLowerCase();
            }
            else if ((which >= 91) && (which <= 95)) {
                keyString = String.fromCharCode(which);
            }
            else if ((which >= 97) && (which <= 122)) {
                keyString = String.fromCharCode(which).toUpperCase();
            }
        }
        else {
            if (which >= 33) {
                keyString = String.fromCharCode(which);
            }
        }
        this._KeyBuf.push(new KeyPressEvent(ke, keyString));
        if (keyString) {
            ke.preventDefault();
            this.onkeypressed.trigger();
        }
    };
    Crt.prototype.OnMouseDown = function (me) {
        if (typeof me.offsetX !== 'undefined') {
            this._MouseDownPoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        }
        else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            this._MouseDownPoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }
        this._MouseMovePoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
    };
    Crt.prototype.OnMouseMove = function (me) {
        if (typeof this._MouseDownPoint === 'undefined') {
            return;
        }
        var NewMovePoint;
        if (typeof me.offsetX !== 'undefined') {
            NewMovePoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        }
        else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            NewMovePoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }
        if (typeof this._MouseMovePoint !== 'undefined') {
            if ((this._MouseMovePoint.x === NewMovePoint.x) && (this._MouseMovePoint.y === NewMovePoint.y)) {
                return;
            }
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            var MovePoint = new Point(this._MouseMovePoint.x, this._MouseMovePoint.y);
            if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                var TempPoint = DownPoint;
                DownPoint = MovePoint;
                MovePoint = TempPoint;
            }
            for (var y = DownPoint.y; y <= MovePoint.y; y++) {
                var FirstX = (y === DownPoint.y) ? DownPoint.x : 1;
                var LastX = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;
                for (var x = FirstX; x <= LastX; x++) {
                    var CI = this._Buffer[y][x];
                    CI.Reverse = false;
                    this.FastWrite(CI.Ch, x, y, CI, false);
                }
            }
            DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            MovePoint = new Point(NewMovePoint.x, NewMovePoint.y);
            if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                var TempPoint = DownPoint;
                DownPoint = MovePoint;
                MovePoint = TempPoint;
            }
            for (var y = DownPoint.y; y <= MovePoint.y; y++) {
                var FirstX = (y === DownPoint.y) ? DownPoint.x : 1;
                var LastX = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;
                for (var x = FirstX; x <= LastX; x++) {
                    var CI = this._Buffer[y][x];
                    CI.Reverse = true;
                    this.FastWrite(CI.Ch, x, y, CI, false);
                }
            }
        }
        this._MouseMovePoint = NewMovePoint;
    };
    Crt.prototype.OnMouseUp = function (me) {
        var UpPoint;
        if (typeof me.offsetX !== 'undefined') {
            UpPoint = this.MousePositionToScreenPosition(me.offsetX, me.offsetY);
        }
        else {
            var CanvasOffset = Offset.getOffset(this._Canvas);
            UpPoint = this.MousePositionToScreenPosition(me.clientX - CanvasOffset.x, me.clientY - CanvasOffset.y);
        }
        if (typeof this._MouseDownPoint !== 'undefined') {
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            if ((DownPoint.x === UpPoint.x) && (DownPoint.y === UpPoint.y)) {
                if ((typeof this._Buffer[DownPoint.y][DownPoint.x].Ch !== 'undefined') && (this._Buffer[DownPoint.y][DownPoint.x].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][DownPoint.x].Ch.charCodeAt(0) <= 126)) {
                    var StartX = DownPoint.x;
                    var EndX = DownPoint.x;
                    while ((StartX > 1) && (typeof this._Buffer[DownPoint.y][StartX - 1].Ch !== 'undefined') && (this._Buffer[DownPoint.y][StartX - 1].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][StartX - 1].Ch.charCodeAt(0) <= 126)) {
                        StartX--;
                    }
                    while ((EndX < this._ScreenSize.x) && (typeof this._Buffer[DownPoint.y][EndX + 1].Ch !== 'undefined') && (this._Buffer[DownPoint.y][EndX + 1].Ch.charCodeAt(0) > 32) && (this._Buffer[DownPoint.y][EndX + 1].Ch.charCodeAt(0) <= 126)) {
                        EndX++;
                    }
                    var ClickedWord = '';
                    for (var x = StartX; x <= EndX; x++) {
                        ClickedWord += this._Buffer[DownPoint.y][x].Ch;
                    }
                    if ((ClickedWord.toLowerCase().indexOf('http://') === 0) || (ClickedWord.toLowerCase().indexOf('https://') === 0)) {
                        if (confirm('Would you like to open this url in a new window?\n\n' + ClickedWord)) {
                            window.open(ClickedWord);
                        }
                    }
                }
            }
            else {
                if ((DownPoint.y > UpPoint.y) || ((DownPoint.y === UpPoint.y) && (DownPoint.x > UpPoint.x))) {
                    var TempPoint = DownPoint;
                    DownPoint = UpPoint;
                    UpPoint = TempPoint;
                }
                var Text = '';
                for (var y = DownPoint.y; y <= UpPoint.y; y++) {
                    var FirstX = (y === DownPoint.y) ? DownPoint.x : 1;
                    var LastX = (y === UpPoint.y) ? UpPoint.x : this._ScreenSize.x;
                    for (var x = FirstX; x <= LastX; x++) {
                        var CI = this._Buffer[y][x];
                        CI.Reverse = false;
                        this.FastWrite(CI.Ch, x, y, CI, false);
                        Text += (typeof this._Buffer[y][x].Ch === 'undefined') ? ' ' : this._Buffer[y][x].Ch;
                    }
                    if (y < DownPoint.y) {
                        Text += '\r\n';
                    }
                }
                ClipboardHelper.SetData(Text);
            }
        }
        delete this._MouseDownPoint;
        delete this._MouseMovePoint;
    };
    Crt.prototype.OnMouseUpForWindow = function (me) {
        me = me;
        if ((typeof this._MouseDownPoint !== 'undefined') && (typeof this._MouseMovePoint !== 'undefined')) {
            var DownPoint = new Point(this._MouseDownPoint.x, this._MouseDownPoint.y);
            var MovePoint = new Point(this._MouseMovePoint.x, this._MouseMovePoint.y);
            if ((DownPoint.x !== MovePoint.x) || (DownPoint.y !== MovePoint.y)) {
                if ((DownPoint.y > MovePoint.y) || ((DownPoint.y === MovePoint.y) && (DownPoint.x > MovePoint.x))) {
                    var TempPoint = DownPoint;
                    DownPoint = MovePoint;
                    MovePoint = TempPoint;
                }
                for (var y = DownPoint.y; y <= MovePoint.y; y++) {
                    var FirstX = (y === DownPoint.y) ? DownPoint.x : 1;
                    var LastX = (y === MovePoint.y) ? MovePoint.x : this._ScreenSize.x;
                    for (var x = FirstX; x <= LastX; x++) {
                        var CI = this._Buffer[y][x];
                        CI.Reverse = false;
                        this.FastWrite(CI.Ch, x, y, CI, false);
                    }
                }
            }
        }
        delete this._MouseDownPoint;
        delete this._MouseMovePoint;
    };
    Crt.prototype.OnResize = function () {
        if (this._AllowDynamicFontResize) {
            this.SetFont(this._Font.Name);
        }
    };
    Crt.prototype.OutputBenchmarks = function () {
        Benchmarks.Alert();
    };
    Crt.prototype.PushKeyDown = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        this.OnKeyDown({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () { }
        });
    };
    Crt.prototype.PushKeyPress = function (pushedCharCode, pushedKeyCode, ctrl, alt, shift) {
        this.OnKeyPress({
            altKey: alt,
            charCode: pushedCharCode,
            ctrlKey: ctrl,
            keyCode: pushedKeyCode,
            shiftKey: shift,
            preventDefault: function () { }
        });
    };
    Crt.prototype.ReadKey = function () {
        var KPE = this._KeyBuf.shift();
        if (typeof KPE === 'undefined') {
            return undefined;
        }
        else {
            if (this._LocalEcho) {
                this.Write(KPE.keyString);
            }
            return KPE;
        }
    };
    Crt.prototype.ResetBenchmarks = function () {
        Benchmarks.Reset();
    };
    Crt.prototype.RestoreScreen = function (buffer, left, top, right, bottom) {
        var Height = bottom - top + 1;
        var Width = right - left + 1;
        for (var Y = 0; Y < Height; Y++) {
            for (var X = 0; X < Width; X++) {
                this.FastWrite(buffer[Y][X].Ch, X + left, Y + top, buffer[Y][X]);
            }
        }
    };
    Crt.prototype.ReverseVideo = function () {
        this.TextAttr = ((this.TextAttr & 0xF0) >> 4) | ((this.TextAttr & 0x0F) << 4);
    };
    Crt.prototype.SaveScreen = function (left, top, right, bottom) {
        var Height = bottom - top + 1;
        var Width = right - left + 1;
        var Result = [];
        for (var Y = 0; Y < Height; Y++) {
            Result[Y] = [];
            for (var X = 0; X < Width; X++) {
                Result[Y][X] = new CharInfo(this._Buffer[Y + top][X + left]);
            }
        }
        return Result;
    };
    Object.defineProperty(Crt.prototype, "ScreenCols", {
        get: function () {
            return this._ScreenSize.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "ScreenRows", {
        get: function () {
            return this._ScreenSize.y;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.ScrollDownCustom = function (left, top, right, bottom, count, charInfo, updateBuffer) {
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }
        var MaxLines = bottom - top + 1;
        if (count > MaxLines) {
            count = MaxLines;
        }
        var Left = (left - 1) * this._Font.Width;
        var Top = (top - 1) * this._Font.Height;
        var Width = (right - left + 1) * this._Font.Width;
        var Height = ((bottom - top + 1 - count) * this._Font.Height);
        if (Height > 0) {
            var Buf = this._CanvasContext.getImageData(Left, Top, Width, Height);
            Left = (left - 1) * this._Font.Width;
            Top = (top - 1 + count) * this._Font.Height;
            this._CanvasContext.putImageData(Buf, Left, Top);
        }
        var Blanks = StringUtils.PadLeft('', ' ', right - left + 1);
        for (var Line = 0; Line < count; Line++) {
            this.FastWrite(Blanks, left, top + Line, charInfo, false);
        }
        if (updateBuffer) {
            var X = 0;
            var Y = 0;
            for (Y = bottom; Y > count; Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(this._Buffer[Y - count][X]);
                }
            }
            for (Y = top; Y <= count; Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(charInfo);
                }
            }
        }
    };
    Crt.prototype.ScrollDownScreen = function (count) {
        this.ScrollDownCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    };
    Crt.prototype.ScrollDownWindow = function (count) {
        this.ScrollDownCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };
    Crt.prototype.ScrollUpCustom = function (left, top, right, bottom, count, charInfo, updateBuffer) {
        if (typeof updateBuffer === 'undefined') {
            updateBuffer = true;
        }
        var MaxLines = bottom - top + 1;
        if (count > MaxLines) {
            count = MaxLines;
        }
        if ((!this._InScrollback) || (this._InScrollback && !updateBuffer)) {
            var BScrollUp = Benchmarks.Start('ScrollUp');
            if (this._UseModernScrollback) {
                if ((left === 1) && (top === 1) && (right === this._ScreenSize.x) && (bottom === this._ScreenSize.y)) {
                    var Left = 0;
                    var Top = count * this._Font.Height;
                    var Width = this._Canvas.width;
                    var Height = this._Canvas.height - Top;
                    this._TempCanvasContext.drawImage(this._Canvas, 0, 0);
                    this._CanvasContext.drawImage(this._TempCanvas, 0, Top, Width, Height, 0, 0, Width, Height);
                }
                else {
                    var Left = (left - 1) * this._Font.Width;
                    var Top = (top - 1 + count) * this._Font.Height;
                    var Width = (right - left + 1) * this._Font.Width;
                    var Height = ((bottom - top + 1 - count) * this._Font.Height);
                    if (Height > 0) {
                        var Buf = this._CanvasContext.getImageData(Left, Top, Width, Height);
                        Left = (left - 1) * this._Font.Width;
                        Top = (top - 1) * this._Font.Height;
                        this._CanvasContext.putImageData(Buf, Left, Top);
                    }
                }
            }
            else {
                var Left = (left - 1) * this._Font.Width;
                var Top = (top - 1 + count) * this._Font.Height;
                var Width = (right - left + 1) * this._Font.Width;
                var Height = ((bottom - top + 1 - count) * this._Font.Height);
                if (Height > 0) {
                    this._TempCanvasContext.drawImage(this._Canvas, Left, Top, Width, Height, 0, 0, Width, Height);
                    Left = (left - 1) * this._Font.Width;
                    Top = (top - 1) * this._Font.Height;
                    this._CanvasContext.drawImage(this._TempCanvas, 0, 0, Width, Height, Left, Top, Width, Height);
                }
            }
            BScrollUp.Stop();
            var BClearBottom = Benchmarks.Start('ClearBottom');
            for (var y = 0; y < count; y++) {
                for (var x = left; x <= right; x++) {
                    this.FastWrite(' ', x, bottom - count + 1 + y, charInfo, false);
                }
            }
            BClearBottom.Stop();
        }
        var BScrollUpdateBuffer = Benchmarks.Start('ScrollUpdateBuffer');
        if (updateBuffer) {
            var NewRow;
            var X;
            var Y;
            if (!this._UseModernScrollback) {
                for (Y = 0; Y < count; Y++) {
                    NewRow = [];
                    for (X = left; X <= right; X++) {
                        NewRow.push(new CharInfo(this._Buffer[Y + top][X]));
                    }
                    this._Scrollback.push(NewRow);
                }
                var ScrollbackLength = this._Scrollback.length;
                while (ScrollbackLength > (this._ScrollbackSize - 2)) {
                    this._Scrollback.shift();
                    ScrollbackLength -= 1;
                }
            }
            for (Y = top; Y <= (bottom - count); Y++) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(this._Buffer[Y + count][X]);
                }
            }
            for (Y = bottom; Y > (bottom - count); Y--) {
                for (X = left; X <= right; X++) {
                    this._Buffer[Y][X].Set(charInfo);
                }
            }
        }
        BScrollUpdateBuffer.Stop();
    };
    Crt.prototype.ScrollUpScreen = function (count) {
        this.ScrollUpCustom(1, 1, this._ScreenSize.x, this._ScreenSize.y, count, this._CharInfo);
    };
    Crt.prototype.ScrollUpWindow = function (count) {
        this.ScrollUpCustom(this.WindMinX + 1, this.WindMinY + 1, this.WindMaxX + 1, this.WindMaxY + 1, count, this._CharInfo);
    };
    Crt.prototype.SetBlink = function (value) {
        this._CharInfo.Blink = value;
    };
    Crt.prototype.SetBlinkRate = function (milliSeconds) {
        this._Cursor.BlinkRate = milliSeconds;
    };
    Crt.prototype.SetFont = function (font) {
        if (this._UseModernScrollback) {
            if (this._Container.parentElement === null) {
                return this._Font.Load(font, Math.floor(this._Container.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
            }
            else {
                return this._Font.Load(font, Math.floor(this._Container.parentElement.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
            }
        }
        else {
            return this._Font.Load(font, Math.floor(this._Container.clientWidth / this._ScreenSize.x), Math.floor(window.innerHeight / this._ScreenSize.y));
        }
    };
    Crt.prototype.SetScreenSize = function (columns, rows) {
        if (this._InScrollback) {
            return;
        }
        if ((columns === this._ScreenSize.x) && (rows === this._ScreenSize.y)) {
            return;
        }
        var X = 0;
        var Y = 0;
        var OldBuffer = [];
        if (typeof this._Buffer !== 'undefined') {
            for (Y = 1; Y <= this._ScreenSize.y; Y++) {
                OldBuffer[Y] = [];
                for (X = 1; X <= this._ScreenSize.x; X++) {
                    OldBuffer[Y][X] = new CharInfo(this._Buffer[Y][X]);
                }
            }
        }
        var OldScreenSize = new Point(this._ScreenSize.x, this._ScreenSize.y);
        this._ScreenSize.x = columns;
        this._ScreenSize.y = rows;
        this._WindMin = 0;
        this._WindMax = (this._ScreenSize.x - 1) | ((this._ScreenSize.y - 1) << 8);
        this.InitBuffers(false);
        this._Canvas.width = this._Font.Width * this._ScreenSize.x;
        if (this._UseModernScrollback) {
            this._Canvas.height = this._Font.Height * (this._ScreenSize.y + this._ScrollbackSize);
            this._CanvasContext.fillRect(0, 0, this._Canvas.width, this._Canvas.height);
            this._TempCanvas.width = this._Canvas.width;
            this._TempCanvas.height = this._Canvas.height;
        }
        else {
            this._Canvas.height = this._Font.Height * this._ScreenSize.y;
        }
        if (typeof this._Buffer !== 'undefined') {
            for (Y = 1; Y <= Math.min(this._ScreenSize.y, OldScreenSize.y); Y++) {
                for (X = 1; X <= Math.min(this._ScreenSize.x, OldScreenSize.x); X++) {
                    this.FastWrite(OldBuffer[Y][X].Ch, X, Y, OldBuffer[Y][X]);
                }
            }
        }
        this.onscreensizechange.trigger();
    };
    Crt.prototype.ShowCursor = function () {
        this._Cursor.Visible = true;
    };
    Object.defineProperty(Crt.prototype, "SkipRedrawWhenSameFontSize", {
        set: function (value) {
            this._SkipRedrawWhenSameFontSize = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "TextAttr", {
        get: function () {
            return this._CharInfo.Attr;
        },
        set: function (value) {
            this._CharInfo.Back24 = CrtFont.ANSI_COLOURS[(value & 0xF0) >> 4];
            this._CharInfo.Fore24 = CrtFont.ANSI_COLOURS[value & 0x0F];
            this._CharInfo.Attr = value;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.TextBackground = function (colour) {
        this.TextAttr = (this.TextAttr & 0x0F) | ((colour & 0x0F) << 4);
    };
    Crt.prototype.TextBackground24 = function (red, green, blue) {
        this._CharInfo.Back24 = ((red & 0xFF) << 16) + ((green & 0xFF) << 8) + (blue & 0xFF);
    };
    Crt.prototype.TextColor = function (colour) {
        this.TextAttr = (this.TextAttr & 0xF0) | (colour & 0x0F);
    };
    Crt.prototype.TextColor24 = function (red, green, blue) {
        this._CharInfo.Fore24 = ((red & 0xFF) << 16) + ((green & 0xFF) << 8) + (blue & 0xFF);
    };
    Object.defineProperty(Crt.prototype, "Transparent", {
        set: function (value) {
            this._Transparent = value;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.WhereX = function () {
        return this._Cursor.Position.x;
    };
    Crt.prototype.WhereXA = function () {
        return this.WhereX() + this.WindMinX;
    };
    Crt.prototype.WhereY = function () {
        return this._Cursor.Position.y;
    };
    Crt.prototype.WhereYA = function () {
        return this.WhereY() + this.WindMinY;
    };
    Object.defineProperty(Crt.prototype, "WindCols", {
        get: function () {
            return this.WindMaxX - this.WindMinX + 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMax", {
        get: function () {
            return this._WindMax;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMaxX", {
        get: function () {
            return (this.WindMax & 0x00FF);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMaxY", {
        get: function () {
            return ((this.WindMax & 0xFF00) >> 8);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMin", {
        get: function () {
            return this._WindMin;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMinX", {
        get: function () {
            return (this.WindMin & 0x00FF);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Crt.prototype, "WindMinY", {
        get: function () {
            return ((this.WindMin & 0xFF00) >> 8);
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.Window = function (left, top, right, bottom) {
        if ((left >= 1) && (top >= 1) && (left <= right) && (top <= bottom)) {
            if ((right <= this._ScreenSize.x) && (bottom <= this._ScreenSize.y)) {
                this._WindMin = (left - 1) + ((top - 1) << 8);
                this._WindMax = (right - 1) + ((bottom - 1) << 8);
                this.GotoXY(1, 1);
            }
        }
    };
    Object.defineProperty(Crt.prototype, "WindRows", {
        get: function () {
            return this.WindMaxY - this.WindMinY + 1;
        },
        enumerable: true,
        configurable: true
    });
    Crt.prototype.Write = function (text) {
        if (this._Atari) {
            this.WriteATASCII(text);
        }
        else if (this._C64) {
            this.WritePETSCII(text);
        }
        else {
            this.WriteASCII(text);
        }
    };
    Crt.prototype.WriteASCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }
        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';
        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;
            if (text.charCodeAt(i) === 0x00) {
                i += 0;
            }
            else if (text.charCodeAt(i) === 0x07) {
                this.Beep();
            }
            else if (text.charCodeAt(i) === 0x08) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                if (X > 1) {
                    X -= 1;
                }
                DoGoto = true;
                Buf = '';
            }
            else if (text.charCodeAt(i) === 0x09) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                if (X === this.WindCols) {
                    X = 1;
                    Y += 1;
                }
                else {
                    X += 8 - (X % 8);
                    X = Math.min(X, this.WindCols);
                }
                DoGoto = true;
            }
            else if (text.charCodeAt(i) === 0x0A) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                if (this._BareLFtoCRLF && (this._LastChar !== 0x0D)) {
                    X = 1;
                }
                else {
                    X += Buf.length;
                }
                Y += 1;
                DoGoto = true;
                Buf = '';
            }
            else if (text.charCodeAt(i) === 0x0C) {
                this.ClrScr();
                X = 1;
                Y = 1;
                Buf = '';
            }
            else if (text.charCodeAt(i) === 0x0D) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                DoGoto = true;
                Buf = '';
            }
            else if (text.charCodeAt(i) !== 0) {
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);
                if ((X + Buf.length) > this.WindCols) {
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';
                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }
            this._LastChar = text.charCodeAt(i);
            if (Y > this.WindRows) {
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }
            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };
    Crt.prototype.WriteATASCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }
        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';
        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;
            if (text.charCodeAt(i) === 0x00) {
                i += 0;
            }
            if ((text.charCodeAt(i) === 0x1B) && (!this._ATASCIIEscaped)) {
                this._ATASCIIEscaped = true;
            }
            else if ((text.charCodeAt(i) === 0x1C) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y > 1) ? Y - 1 : this.WindRows;
                DoGoto = true;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x1D) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Y = (Y < this.WindRows) ? Y + 1 : 1;
                DoGoto = true;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x1E) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X > 1) ? X - 1 : this.WindCols;
                DoGoto = true;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x1F) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                X = (X < this.WindCols) ? X + 1 : 1;
                DoGoto = true;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x7D) && (!this._ATASCIIEscaped)) {
                this.ClrScr();
                X = 1;
                Y = 1;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x7E) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                DoGoto = true;
                if (X > 1) {
                    X -= 1;
                    this.FastWrite(' ', X, this.WhereYA(), this._CharInfo);
                }
            }
            else if ((text.charCodeAt(i) === 0x7F) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                if (X === this.WindCols) {
                    X = 1;
                    Y += 1;
                }
                else {
                    X += 8 - (X % 8);
                }
                DoGoto = true;
            }
            else if ((text.charCodeAt(i) === 0x9B) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Y += 1;
                DoGoto = true;
                Buf = '';
            }
            else if ((text.charCodeAt(i) === 0x9C) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';
                this.GotoXY(X, Y);
                this.DelLine();
            }
            else if ((text.charCodeAt(i) === 0x9D) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X = 1;
                Buf = '';
                this.GotoXY(X, Y);
                this.InsLine();
            }
            else if ((text.charCodeAt(i) === 0xFD) && (!this._ATASCIIEscaped)) {
                this.Beep();
            }
            else if ((text.charCodeAt(i) === 0xFE) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                this.GotoXY(X, Y);
                this.DelChar();
            }
            else if ((text.charCodeAt(i) === 0xFF) && (!this._ATASCIIEscaped)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                Buf = '';
                this.GotoXY(X, Y);
                this.InsChar();
            }
            else {
                if ((text.charCodeAt(i) === 0x00) && (this._LastChar === 0x0D)) {
                    Buf += '';
                }
                else {
                    Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);
                }
                this._ATASCIIEscaped = false;
                this._LastChar = text.charCodeAt(i);
                if ((X + Buf.length) > this.WindCols) {
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';
                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }
            if (Y > this.WindRows) {
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }
            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };
    Crt.prototype.WritePETSCII = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }
        var X = this.WhereX();
        var Y = this.WhereY();
        var Buf = '';
        for (var i = 0; i < text.length; i++) {
            var DoGoto = false;
            if ((Buf !== '') && (this._FlushBeforeWritePETSCII.indexOf(text.charCodeAt(i)) !== -1)) {
                this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                X += Buf.length;
                DoGoto = true;
                Buf = '';
            }
            if (text.charCodeAt(i) === 0x00) {
                i += 0;
            }
            else if (text.charCodeAt(i) === 0x05) {
                this.TextColor(Crt.PETSCII_WHITE);
            }
            else if (text.charCodeAt(i) === 0x07) {
                this.Beep();
            }
            else if (text.charCodeAt(i) === 0x08) {
                console.log('PETSCII 0x08');
            }
            else if (text.charCodeAt(i) === 0x09) {
                console.log('PETSCII 0x09');
            }
            else if (text.charCodeAt(i) === 0x0A) {
                i += 0;
            }
            else if ((text.charCodeAt(i) === 0x0D) || (text.charCodeAt(i) === 0x8D)) {
                X = 1;
                Y += 1;
                this._CharInfo.Reverse = false;
                DoGoto = true;
            }
            else if (text.charCodeAt(i) === 0x0E) {
                this.SetFont('C64-Lower');
            }
            else if (text.charCodeAt(i) === 0x11) {
                Y += 1;
                DoGoto = true;
            }
            else if (text.charCodeAt(i) === 0x12) {
                this._CharInfo.Reverse = true;
            }
            else if (text.charCodeAt(i) === 0x13) {
                X = 1;
                Y = 1;
                DoGoto = true;
            }
            else if (text.charCodeAt(i) === 0x14) {
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    }
                    else {
                        X -= 1;
                    }
                    this.GotoXY(X, Y);
                    this.DelChar(1);
                }
            }
            else if (text.charCodeAt(i) === 0x1C) {
                this.TextColor(Crt.PETSCII_RED);
            }
            else if (text.charCodeAt(i) === 0x1D) {
                if (X === this.WindCols) {
                    X = 1;
                    Y += 1;
                }
                else {
                    X += 1;
                }
                DoGoto = true;
            }
            else if (text.charCodeAt(i) === 0x1E) {
                this.TextColor(Crt.PETSCII_GREEN);
            }
            else if (text.charCodeAt(i) === 0x1F) {
                this.TextColor(Crt.PETSCII_BLUE);
            }
            else if (text.charCodeAt(i) === 0x81) {
                this.TextColor(Crt.PETSCII_ORANGE);
            }
            else if (text.charCodeAt(i) === 0x8E) {
                this.SetFont('C64-Upper');
            }
            else if (text.charCodeAt(i) === 0x90) {
                this.TextColor(Crt.PETSCII_BLACK);
            }
            else if (text.charCodeAt(i) === 0x91) {
                if (Y > 1) {
                    Y -= 1;
                    DoGoto = true;
                }
            }
            else if (text.charCodeAt(i) === 0x92) {
                this._CharInfo.Reverse = false;
            }
            else if (text.charCodeAt(i) === 0x93) {
                this.ClrScr();
                X = 1;
                Y = 1;
            }
            else if (text.charCodeAt(i) === 0x94) {
                this.GotoXY(X, Y);
                this.InsChar(1);
            }
            else if (text.charCodeAt(i) === 0x95) {
                this.TextColor(Crt.PETSCII_BROWN);
            }
            else if (text.charCodeAt(i) === 0x96) {
                this.TextColor(Crt.PETSCII_LIGHTRED);
            }
            else if (text.charCodeAt(i) === 0x97) {
                this.TextColor(Crt.PETSCII_DARKGRAY);
            }
            else if (text.charCodeAt(i) === 0x98) {
                this.TextColor(Crt.PETSCII_GRAY);
            }
            else if (text.charCodeAt(i) === 0x99) {
                this.TextColor(Crt.PETSCII_LIGHTGREEN);
            }
            else if (text.charCodeAt(i) === 0x9A) {
                this.TextColor(Crt.PETSCII_LIGHTBLUE);
            }
            else if (text.charCodeAt(i) === 0x9B) {
                this.TextColor(Crt.PETSCII_LIGHTGRAY);
            }
            else if (text.charCodeAt(i) === 0x9C) {
                this.TextColor(Crt.PETSCII_PURPLE);
            }
            else if (text.charCodeAt(i) === 0x9D) {
                if ((X > 1) || (Y > 1)) {
                    if (X === 1) {
                        X = this.WindCols;
                        Y -= 1;
                    }
                    else {
                        X -= 1;
                    }
                    DoGoto = true;
                }
            }
            else if (text.charCodeAt(i) === 0x9E) {
                this.TextColor(Crt.PETSCII_YELLOW);
            }
            else if (text.charCodeAt(i) === 0x9F) {
                this.TextColor(Crt.PETSCII_CYAN);
            }
            else if (text.charCodeAt(i) !== 0) {
                Buf += String.fromCharCode(text.charCodeAt(i) & 0xFF);
                if ((X + Buf.length) > this.WindCols) {
                    this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
                    Buf = '';
                    X = 1;
                    Y += 1;
                    DoGoto = true;
                }
            }
            if (Y > this.WindRows) {
                Y = this.WindRows;
                this.ScrollUpWindow(1);
                DoGoto = true;
            }
            if (DoGoto) {
                this.GotoXY(X, Y);
            }
        }
        if (Buf.length > 0) {
            this.FastWrite(Buf, this.WhereXA(), this.WhereYA(), this._CharInfo);
            X += Buf.length;
            this.GotoXY(X, Y);
        }
    };
    Crt.prototype.WriteLn = function (text) {
        if (typeof text === 'undefined') {
            text = '';
        }
        this.Write(text + '\r\n');
    };
    Crt.BLACK = 0;
    Crt.BLUE = 1;
    Crt.GREEN = 2;
    Crt.CYAN = 3;
    Crt.RED = 4;
    Crt.MAGENTA = 5;
    Crt.BROWN = 6;
    Crt.LIGHTGRAY = 7;
    Crt.DARKGRAY = 8;
    Crt.LIGHTBLUE = 9;
    Crt.LIGHTGREEN = 10;
    Crt.LIGHTCYAN = 11;
    Crt.LIGHTRED = 12;
    Crt.LIGHTMAGENTA = 13;
    Crt.YELLOW = 14;
    Crt.WHITE = 15;
    Crt.BLINK = 128;
    Crt.PETSCII_BLACK = 0;
    Crt.PETSCII_WHITE = 1;
    Crt.PETSCII_RED = 2;
    Crt.PETSCII_CYAN = 3;
    Crt.PETSCII_PURPLE = 4;
    Crt.PETSCII_GREEN = 5;
    Crt.PETSCII_BLUE = 6;
    Crt.PETSCII_YELLOW = 7;
    Crt.PETSCII_ORANGE = 8;
    Crt.PETSCII_BROWN = 9;
    Crt.PETSCII_LIGHTRED = 10;
    Crt.PETSCII_DARKGRAY = 11;
    Crt.PETSCII_GRAY = 12;
    Crt.PETSCII_LIGHTGREEN = 13;
    Crt.PETSCII_LIGHTBLUE = 14;
    Crt.PETSCII_LIGHTGRAY = 15;
    return Crt;
}());
var CrtFont = (function () {
    function CrtFont() {
        this.onchange = new TypedEvent();
        this._CharMap = [];
        this._Name = 'CP437';
        this._Loading = 0;
        this._NewName = 'CP437';
        this._NewSize = new Point(9, 16);
        this._Size = new Point(9, 16);
        this._Canvas = document.createElement('canvas');
        if (this._Canvas.getContext) {
            var CanvasContext = this._Canvas.getContext('2d');
            if (CanvasContext !== null) {
                this._CanvasContext = CanvasContext;
            }
            this.Load(this._Name, this._Size.x, this._Size.y);
        }
    }
    CrtFont.prototype.GetChar = function (charCode, charInfo) {
        if (this._Loading > 0) {
            return undefined;
        }
        var Alpha = 255;
        if (charCode === CrtFont.TRANSPARENT_CHARCODE) {
            Alpha = 0;
            charCode = 32;
            charInfo.Attr = 0;
            charInfo.Back24 = 0;
            charInfo.Fore24 = 0;
            charInfo.Reverse = false;
        }
        else if ((charCode < 0) || (charCode > 255) || (charInfo.Attr < 0) || (charInfo.Attr > 255)) {
            return undefined;
        }
        var CharMapKey = charCode + '-' + charInfo.Fore24 + '-' + charInfo.Back24 + '-' + charInfo.Reverse;
        if (!this._CharMap[CharMapKey]) {
            var NewChar = this._CanvasContext.getImageData(charCode * this._Size.x, 0, this._Size.x, this._Size.y);
            var Back;
            var Fore;
            if (this._Name.indexOf('C64') === 0) {
                Back = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0xF0) >> 4];
                Fore = CrtFont.PETSCII_COLOURS[(charInfo.Attr & 0x0F)];
            }
            else {
                Back = charInfo.Back24;
                Fore = charInfo.Fore24;
            }
            if (charInfo.Reverse) {
                var Temp = Fore;
                Fore = Back;
                Back = Temp;
            }
            var BackR = Back >> 16;
            var BackG = (Back >> 8) & 0xFF;
            var BackB = Back & 0xFF;
            var ForeR = Fore >> 16;
            var ForeG = (Fore >> 8) & 0xFF;
            var ForeB = Fore & 0xFF;
            var R = 0;
            var G = 0;
            var B = 0;
            var NewCharDataLength = NewChar.data.length;
            for (var i = 0; i < NewCharDataLength; i += 4) {
                if (NewChar.data[i] & 0x80) {
                    R = ForeR;
                    G = ForeG;
                    B = ForeB;
                }
                else {
                    R = BackR;
                    G = BackG;
                    B = BackB;
                }
                NewChar.data[i] = R;
                NewChar.data[i + 1] = G;
                NewChar.data[i + 2] = B;
                NewChar.data[i + 3] = Alpha;
            }
            this._CharMap[CharMapKey] = NewChar;
        }
        return this._CharMap[CharMapKey];
    };
    Object.defineProperty(CrtFont.prototype, "Height", {
        get: function () {
            return this._Size.y;
        },
        enumerable: true,
        configurable: true
    });
    CrtFont.prototype.Load = function (font, maxWidth, maxHeight) {
        var _this = this;
        var BestFit;
        if (font.indexOf('_') >= 0) {
            if (CrtFonts.HasFont(font)) {
                var NameSize = font.split('_');
                var WidthHeight = NameSize[1].split('x');
                BestFit = new Point(parseInt(WidthHeight[0], 10), parseInt(WidthHeight[1], 10));
                font = NameSize[0];
            }
        }
        else {
            BestFit = CrtFonts.GetBestFit(font, maxWidth, maxHeight);
        }
        if (typeof BestFit === 'undefined') {
            console.log('fTelnet Error: Font CP=' + font + ' does not exist');
            return false;
        }
        else {
            if ((typeof this._Png !== 'undefined') && (this._Name === font) && (this._Size.x === BestFit.x) && (this._Size.y === BestFit.y)) {
                return true;
            }
            CrtFont.ANSI_COLOURS[7] = 0xA8A8A8;
            CrtFont.ANSI_COLOURS[0] = 0x000000;
            this._Loading += 1;
            this._NewName = font;
            this._NewSize = new Point(BestFit.x, BestFit.y);
            if (font.indexOf('Atari') === 0) {
                CrtFont.ANSI_COLOURS[7] = 0x63B6E7;
                CrtFont.ANSI_COLOURS[0] = 0x005184;
            }
            this._Png = new Image();
            this._Png.crossOrigin = 'Anonymous';
            this._Png.onload = function () { _this.OnPngLoad(); };
            this._Png.onerror = function () { _this.OnPngError(); };
            this._Png.src = CrtFonts.GetLocalUrl(font, this._NewSize.x, this._NewSize.y);
            return true;
        }
    };
    Object.defineProperty(CrtFont.prototype, "Name", {
        get: function () {
            return this._Name;
        },
        enumerable: true,
        configurable: true
    });
    CrtFont.prototype.OnPngError = function () {
        var _this = this;
        this._Png = new Image();
        this._Png.crossOrigin = 'Anonymous';
        this._Png.onload = function () { _this.OnPngLoad(); };
        this._Png.onerror = function () {
            alert('fTelnet Error: Unable to load requested font');
            _this._Loading -= 1;
        };
        this._Png.src = CrtFonts.GetRemoteUrl(this._NewName, this._NewSize.x, this._NewSize.y);
    };
    CrtFont.prototype.OnPngLoad = function () {
        if (this._Loading === 1) {
            var oldSize = new Point(this._Size.x, this._Size.y);
            this._Name = this._NewName;
            this._Size = this._NewSize;
            this._Canvas.width = this._Png.width;
            this._Canvas.height = this._Png.height;
            this._CanvasContext.drawImage(this._Png, 0, 0);
            this._CharMap = [];
            this._Loading -= 1;
            this.onchange.trigger(oldSize);
        }
        else {
            this._Loading -= 1;
        }
    };
    Object.defineProperty(CrtFont.prototype, "Size", {
        get: function () {
            return this._Size;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtFont.prototype, "Width", {
        get: function () {
            return this._Size.x;
        },
        enumerable: true,
        configurable: true
    });
    CrtFont.TRANSPARENT_CHARCODE = 1000;
    CrtFont.ANSI_COLOURS = [
        0x000000, 0x0000A8, 0x00A800, 0x00A8A8, 0xA80000, 0xA800A8, 0xA85400, 0xA8A8A8,
        0x545454, 0x5454FC, 0x54FC54, 0x54FCFC, 0xFC5454, 0xFC54FC, 0xFCFC54, 0xFCFCFC
    ];
    CrtFont.PETSCII_COLOURS = [
        0x000000, 0xFDFEFC, 0xBE1A24, 0x30E6C6, 0xB41AE2, 0x1FD21E, 0x211BAE, 0xDFF60A,
        0xB84104, 0x6A3304, 0xFE4A57, 0x424540, 0x70746F, 0x59FE59, 0x5F53FE, 0xA4A7A2
    ];
    return CrtFont;
}());
var CrtFonts = (function () {
    function CrtFonts() {
    }
    CrtFonts.__ctor = function () {
        for (var i = 0; i < this._FontNames.length; i++) {
            var NameSize = this._FontNames[i].split('_');
            var WidthHeight = NameSize[1].split('x');
            var Width = parseInt(WidthHeight[0], 10);
            var Height = parseInt(WidthHeight[1], 10);
            if (typeof this._Fonts[NameSize[0]] === 'undefined') {
                this._Fonts[NameSize[0]] = [];
            }
            this._Fonts[NameSize[0]].push(new Point(Width, Height));
        }
        for (var key in this._Fonts) {
            if (this._Fonts.hasOwnProperty(key)) {
                this._Fonts[key].sort(function (a, b) {
                    if (b.x - a.x === 0) {
                        return b.y - a.y;
                    }
                    else {
                        return b.x - a.x;
                    }
                });
            }
        }
    };
    CrtFonts.GetBestFit = function (font, maxWidth, maxHeight) {
        if (typeof this._Fonts[font] === 'undefined') {
            return undefined;
        }
        else if (this._Fonts[font].length === 1) {
            return this._Fonts[font][0];
        }
        else {
            for (var i = 0; i < this._Fonts[font].length; i++) {
                if ((this._Fonts[font][i].x <= maxWidth) && (this._Fonts[font][i].y <= maxHeight)) {
                    return this._Fonts[font][i];
                }
            }
            return this._Fonts[font][this._Fonts[font].length - 1];
        }
    };
    CrtFonts.GetLocalUrl = function (font, width, height) {
        if (document.getElementById('fTelnetScript') === null) {
            return this.GetRemoteUrl(font, width, height);
        }
        else {
            return StringUtils.GetUrl('fonts/' + font + '_' + width.toString(10) + 'x' + height.toString(10) + '.png');
        }
    };
    CrtFonts.GetRemoteUrl = function (font, width, height) {
        var PngUrl = '//embed-v2.ftelnet.ca/ftelnet/fonts/' + font + '_' + width.toString(10) + 'x' + height.toString(10) + '.png';
        return PngUrl;
    };
    CrtFonts.HasFont = function (font) {
        return (this._FontNames.indexOf(font) >= 0);
    };
    CrtFonts._FontNames = ['Amiga-BStrict_8x8', 'Amiga-BStruct_8x8', 'Amiga-MicroKnight_8x16', 'Amiga-MicroKnight_8x8', 'Amiga-MoSoul_8x16', 'Amiga-MoSoul_8x8', 'Amiga-PotNoodle_8x11', 'Amiga-PotNoodle_8x16', 'Amiga-TopazPlus_8x11', 'Amiga-Topaz_8x11', 'Amiga-Topaz_8x16', 'Atari-Arabic_16x16', 'Atari-Arabic_8x16', 'Atari-Graphics_16x16', 'Atari-Graphics_8x16', 'Atari-Graphics_8x8', 'Atari-International_16x16', 'Atari-International_8x16', 'C128-Lower_8x16', 'C128-Upper_8x16', 'C128-Upper_8x8', 'C128_Lower_8x8', 'C64-Lower_16x16', 'C64-Lower_8x16', 'C64-Lower_8x8', 'C64-Upper_16x16', 'C64-Upper_8x16', 'C64-Upper_8x8', 'CP437_10x19', 'CP437_12x23', 'CP437_6x8', 'CP437_7x12', 'CP437_8x12', 'CP437_8x13', 'CP437_8x14', 'CP437_8x16', 'CP437_8x8', 'CP437_9x16', 'CP737_12x23', 'CP737_9x16', 'CP775_9x16', 'CP850_10x19', 'CP850_12x23', 'CP850_8x13', 'CP850_9x16', 'CP852_10x19', 'CP852_12x23', 'CP852_9x16', 'CP855_9x16', 'CP857_9x16', 'CP860_9x16', 'CP861_9x16', 'CP862_10x19', 'CP863_9x16', 'CP865_10x19', 'CP865_12x23', 'CP865_8x13', 'CP865_9x16', 'CP866_9x16', 'CP869_9x16', 'RIP_7x8', 'RIP_7x14', 'RIP_8x8', 'RIP_8x14', 'RIP_16x14', 'SyncTerm-0_8x14', 'SyncTerm-0_8x16', 'SyncTerm-0_8x8', 'SyncTerm-10_8x16', 'SyncTerm-11_8x14', 'SyncTerm-11_8x16', 'SyncTerm-11_8x8', 'SyncTerm-12_8x16', 'SyncTerm-13_8x16', 'SyncTerm-14_8x14', 'SyncTerm-14_8x16', 'SyncTerm-14_8x8', 'SyncTerm-15_8x14', 'SyncTerm-15_8x16', 'SyncTerm-15_8x8', 'SyncTerm-16_8x14', 'SyncTerm-16_8x16', 'SyncTerm-16_8x8', 'SyncTerm-17_8x16', 'SyncTerm-17_8x8', 'SyncTerm-18_8x14', 'SyncTerm-18_8x16', 'SyncTerm-18_8x8', 'SyncTerm-19_8x16', 'SyncTerm-19_8x8', 'SyncTerm-1_8x16', 'SyncTerm-20_8x14', 'SyncTerm-20_8x16', 'SyncTerm-20_8x8', 'SyncTerm-21_8x14', 'SyncTerm-21_8x16', 'SyncTerm-21_8x8', 'SyncTerm-22_8x16', 'SyncTerm-23_8x14', 'SyncTerm-23_8x16', 'SyncTerm-23_8x8', 'SyncTerm-24_8x14', 'SyncTerm-24_8x16', 'SyncTerm-24_8x8', 'SyncTerm-25_8x14', 'SyncTerm-25_8x16', 'SyncTerm-25_8x8', 'SyncTerm-26_8x16', 'SyncTerm-26_8x8', 'SyncTerm-27_8x16', 'SyncTerm-28_8x14', 'SyncTerm-28_8x16', 'SyncTerm-28_8x8', 'SyncTerm-29_8x14', 'SyncTerm-29_8x16', 'SyncTerm-29_8x8', 'SyncTerm-2_8x14', 'SyncTerm-2_8x16', 'SyncTerm-2_8x8', 'SyncTerm-30_8x16', 'SyncTerm-31_8x16', 'SyncTerm-32_8x16', 'SyncTerm-32_8x8', 'SyncTerm-33_8x16', 'SyncTerm-33_8x8', 'SyncTerm-34_8x16', 'SyncTerm-34_8x8', 'SyncTerm-35_8x16', 'SyncTerm-35_8x8', 'SyncTerm-36_8x16', 'SyncTerm-36_8x8', 'SyncTerm-37_8x16', 'SyncTerm-38_8x16', 'SyncTerm-39_8x16', 'SyncTerm-3_8x14', 'SyncTerm-3_8x16', 'SyncTerm-3_8x8', 'SyncTerm-40_8x16', 'SyncTerm-4_8x16', 'SyncTerm-5_8x16', 'SyncTerm-6_8x16', 'SyncTerm-7_8x14', 'SyncTerm-7_8x16', 'SyncTerm-7_8x8', 'SyncTerm-8_8x14', 'SyncTerm-8_8x16', 'SyncTerm-8_8x8', 'SyncTerm-9_8x14', 'SyncTerm-9_8x16', 'SyncTerm-9_8x8'];
    CrtFonts._Fonts = [];
    return CrtFonts;
}());
CrtFonts.__ctor();
var Cursor = (function () {
    function Cursor(colour, size) {
        var _this = this;
        this.onhide = new TypedEvent();
        this.onshow = new TypedEvent();
        this._BlinkRate = 500;
        this._BlinkState = BlinkState.Hide;
        this._Colour = '#' + StringUtils.PadLeft(colour.toString(16), '0', 6);
        this._LastPosition = new Point(1, 1);
        this._Position = new Point(1, 1);
        this._Size = size;
        this._Visible = true;
        this._WindowOffset = new Point(0, 0);
        this._WindowOffsetAdjusted = new Point(0, 0);
        this._Timer = setInterval(function () { _this.OnTimer(); }, this._BlinkRate);
    }
    Object.defineProperty(Cursor.prototype, "BlinkRate", {
        set: function (value) {
            var _this = this;
            this._BlinkRate = value;
            clearInterval(this._Timer);
            this._Timer = setInterval(function () { _this.OnTimer(); }, this._BlinkRate);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cursor.prototype, "Colour", {
        get: function () {
            return this._Colour;
        },
        set: function (value) {
            this._Colour = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cursor.prototype, "LastPosition", {
        get: function () {
            return this._LastPosition;
        },
        set: function (value) {
            this._LastPosition = value;
        },
        enumerable: true,
        configurable: true
    });
    Cursor.prototype.OnTimer = function () {
        this._BlinkState = (this._BlinkState === BlinkState.Hide) ? BlinkState.Show : BlinkState.Hide;
        switch (this._BlinkState) {
            case BlinkState.Hide:
                this.onhide.trigger();
                break;
            case BlinkState.Show:
                this.onshow.trigger();
                break;
        }
    };
    Object.defineProperty(Cursor.prototype, "Position", {
        get: function () {
            return this._Position;
        },
        set: function (value) {
            this._Position = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cursor.prototype, "Size", {
        get: function () {
            return this._Size;
        },
        set: function (value) {
            this._Size = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Cursor.prototype, "Visible", {
        set: function (value) {
            this._Visible = value;
        },
        enumerable: true,
        configurable: true
    });
    return Cursor;
}());
var KeyPressEvent = (function () {
    function KeyPressEvent(keyEvent, keyString) {
        this.altKey = keyEvent.altKey;
        this.charCode = keyEvent.charCode;
        this.ctrlKey = keyEvent.ctrlKey;
        this.keyCode = keyEvent.keyCode;
        this.keyString = keyString;
        this.shiftKey = keyEvent.shiftKey;
    }
    return KeyPressEvent;
}());
var KeyboardKeys;
(function (KeyboardKeys) {
    KeyboardKeys[KeyboardKeys["ALTERNATE"] = 18] = "ALTERNATE";
    KeyboardKeys[KeyboardKeys["APPMENU"] = 1001] = "APPMENU";
    KeyboardKeys[KeyboardKeys["BACKSPACE"] = 8] = "BACKSPACE";
    KeyboardKeys[KeyboardKeys["BREAK"] = 1000] = "BREAK";
    KeyboardKeys[KeyboardKeys["CAPS_LOCK"] = 20] = "CAPS_LOCK";
    KeyboardKeys[KeyboardKeys["CONTROL"] = 17] = "CONTROL";
    KeyboardKeys[KeyboardKeys["DELETE"] = 46] = "DELETE";
    KeyboardKeys[KeyboardKeys["DOWN"] = 40] = "DOWN";
    KeyboardKeys[KeyboardKeys["END"] = 35] = "END";
    KeyboardKeys[KeyboardKeys["ESCAPE"] = 27] = "ESCAPE";
    KeyboardKeys[KeyboardKeys["ENTER"] = 13] = "ENTER";
    KeyboardKeys[KeyboardKeys["F1"] = 112] = "F1";
    KeyboardKeys[KeyboardKeys["F2"] = 113] = "F2";
    KeyboardKeys[KeyboardKeys["F3"] = 114] = "F3";
    KeyboardKeys[KeyboardKeys["F4"] = 115] = "F4";
    KeyboardKeys[KeyboardKeys["F5"] = 116] = "F5";
    KeyboardKeys[KeyboardKeys["F6"] = 117] = "F6";
    KeyboardKeys[KeyboardKeys["F7"] = 118] = "F7";
    KeyboardKeys[KeyboardKeys["F8"] = 119] = "F8";
    KeyboardKeys[KeyboardKeys["F9"] = 120] = "F9";
    KeyboardKeys[KeyboardKeys["F10"] = 121] = "F10";
    KeyboardKeys[KeyboardKeys["F11"] = 122] = "F11";
    KeyboardKeys[KeyboardKeys["F12"] = 123] = "F12";
    KeyboardKeys[KeyboardKeys["HOME"] = 36] = "HOME";
    KeyboardKeys[KeyboardKeys["INSERT"] = 45] = "INSERT";
    KeyboardKeys[KeyboardKeys["LEFT"] = 37] = "LEFT";
    KeyboardKeys[KeyboardKeys["NUM_LOCK"] = 1002] = "NUM_LOCK";
    KeyboardKeys[KeyboardKeys["PAGE_DOWN"] = 34] = "PAGE_DOWN";
    KeyboardKeys[KeyboardKeys["PAGE_UP"] = 33] = "PAGE_UP";
    KeyboardKeys[KeyboardKeys["PRINT_SCREEN"] = 1006] = "PRINT_SCREEN";
    KeyboardKeys[KeyboardKeys["RIGHT"] = 39] = "RIGHT";
    KeyboardKeys[KeyboardKeys["SHIFT"] = 16] = "SHIFT";
    KeyboardKeys[KeyboardKeys["SHIFTLEFT"] = 1004] = "SHIFTLEFT";
    KeyboardKeys[KeyboardKeys["SHIFTRIGHT"] = 1005] = "SHIFTRIGHT";
    KeyboardKeys[KeyboardKeys["SPACE"] = 32] = "SPACE";
    KeyboardKeys[KeyboardKeys["TAB"] = 9] = "TAB";
    KeyboardKeys[KeyboardKeys["WINDOWS"] = 1003] = "WINDOWS";
    KeyboardKeys[KeyboardKeys["UP"] = 38] = "UP";
})(KeyboardKeys || (KeyboardKeys = {}));
//# sourceMappingURL=crt.js.map
var RLoginCommand;
(function (RLoginCommand) {
    RLoginCommand[RLoginCommand["Cookie"] = 255] = "Cookie";
    RLoginCommand[RLoginCommand["S"] = 115] = "S";
})(RLoginCommand || (RLoginCommand = {}));
var UseCordovaSocket = (!!window.cordova && !navigator.userAgent.match(/iemobile/i) && !navigator.userAgent.match(/MSAppHost/i));
if (!UseCordovaSocket) {
    if (('WebSocket' in window) && !navigator.userAgent.match('AppleWebKit/534.30')) {
    }
    else if ('MozWebSocket' in window) {
        window['WebSocket'] = window['MozWebSocket'];
    }
    else {
        window['WEB_SOCKET_FORCE_FLASH'] = true;
        window['WEB_SOCKET_SWF_LOCATION'] = StringUtils.GetUrl('WebSocketMain.swf');
        document.write('<script src="' + StringUtils.GetUrl('swfobject.js') + '"><\/script>');
        document.write('<script src="' + StringUtils.GetUrl('web_socket.js') + '"><\/script>');
    }
}
var WebSocketProtocol = (document.location.protocol === 'https:' ? 'wss' : 'ws');
var WebSocketSupportsTypedArrays = (('Uint8Array' in window) && ('set' in Uint8Array.prototype));
var WebSocketSupportsBinaryType = false;
if (!UseCordovaSocket) {
    WebSocketSupportsBinaryType = (WebSocketSupportsTypedArrays && ('binaryType' in WebSocket.prototype || !!(new WebSocket(WebSocketProtocol + '://.').binaryType)));
}
var WebSocketConnection = (function () {
    function WebSocketConnection() {
        this.onclose = new TypedEvent();
        this.onconnect = new TypedEvent();
        this.ondata = new TypedEvent();
        this.onlocalecho = new TypedEvent();
        this.onioerror = new TypedEvent();
        this.onsecurityerror = new TypedEvent();
        this._WasConnected = false;
        this._LocalEcho = false;
        this._LogIO = (window.location.hash.indexOf('ftelnetdebug=1') >= 0);
        this._Protocol = 'plain';
        this._SendLocation = true;
        this._InputBuffer = new ByteArray();
        this._OutputBuffer = new ByteArray();
    }
    Object.defineProperty(WebSocketConnection.prototype, "bytesAvailable", {
        get: function () {
            return this._InputBuffer.bytesAvailable;
        },
        enumerable: true,
        configurable: true
    });
    WebSocketConnection.prototype.close = function () {
        if (UseCordovaSocket) {
            if (this._CordovaSocket) {
                this._CordovaSocket.close();
            }
        }
        else {
            if (this._WebSocket) {
                this._WebSocket.close();
            }
        }
    };
    WebSocketConnection.prototype.connect = function (hostname, port, urlPath, forceWss, proxyHostname, proxyPort, proxyPortSecure) {
        var _this = this;
        if (typeof proxyHostname === 'undefined') {
            proxyHostname = '';
        }
        if (typeof proxyPort === 'undefined') {
            proxyPort = 80;
        }
        if (typeof proxyPortSecure === 'undefined') {
            proxyPortSecure = 443;
        }
        if (!!window.cordova && !UseCordovaSocket) {
            proxyHostname = 'proxy-us-nj.ftelnet.ca';
            proxyPort = 80;
            proxyPortSecure = 443;
        }
        this._WasConnected = false;
        if (UseCordovaSocket) {
            this._CordovaSocket = new Socket();
            this._CordovaSocket.open(hostname, port, function () { _this.OnSocketOpen(); }, function (message) {
                var e = new ErrorEvent('Socket', {
                    bubbles: true,
                    cancelable: true,
                    message: message
                });
                _this.OnSocketError(e);
            });
            this._CordovaSocket.onClose = function () { _this.OnSocketClose(); };
            this._CordovaSocket.onData = function (data) { _this.OnCordovaSocketData(data); };
            this._CordovaSocket.onError = function (message) {
                var e = new ErrorEvent('Socket', {
                    bubbles: true,
                    cancelable: false,
                    message: message
                });
                _this.OnSocketError(e);
            };
        }
        else {
            var Protocols;
            if (('WebSocket' in window) && (WebSocket.CLOSED === 2 || WebSocket.prototype.CLOSED === 2)) {
                Protocols = ['plain'];
            }
            else {
                if (WebSocketSupportsBinaryType && WebSocketSupportsTypedArrays) {
                    Protocols = ['binary', 'base64', 'plain'];
                }
                else {
                    Protocols = ['base64', 'plain'];
                }
            }
            var WsOrWss = forceWss ? 'wss' : WebSocketProtocol;
            if (proxyHostname === '') {
                this._WebSocket = new WebSocket(WsOrWss + '://' + hostname + ':' + port + urlPath, Protocols);
            }
            else {
                this._WebSocket = new WebSocket(WsOrWss + '://' + proxyHostname + ':' + (WsOrWss === 'wss' ? proxyPortSecure : proxyPort) + '/' + hostname + '/' + port, Protocols);
            }
            if (Protocols.indexOf('binary') >= 0) {
                this._WebSocket.binaryType = 'arraybuffer';
            }
            this._WebSocket.onclose = function () { _this.OnSocketClose(); };
            this._WebSocket.onerror = function (e) { _this.OnSocketError(e); };
            this._WebSocket.onmessage = function (e) { _this.OnWebSocketMessage(e); };
            this._WebSocket.onopen = function () { _this.OnSocketOpen(); };
        }
    };
    Object.defineProperty(WebSocketConnection.prototype, "connected", {
        get: function () {
            if (UseCordovaSocket) {
                if (this._CordovaSocket) {
                    return (this._CordovaSocket.state === Socket.State.OPENED);
                }
            }
            else {
                if (this._WebSocket) {
                    return (this._WebSocket.readyState === this._WebSocket.OPEN) || (this._WebSocket.readyState === WebSocket.OPEN);
                }
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });
    WebSocketConnection.prototype.flush = function () {
        var ToSendBytes = [];
        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);
        }
        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    };
    Object.defineProperty(WebSocketConnection.prototype, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;
        },
        enumerable: true,
        configurable: true
    });
    WebSocketConnection.prototype.NegotiateInbound = function (data) {
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();
            this._InputBuffer.writeByte(B);
        }
    };
    WebSocketConnection.prototype.OnCordovaSocketData = function (data) {
        if (this._InputBuffer.bytesAvailable === 0) {
            this._InputBuffer.clear();
        }
        var OldPosition = this._InputBuffer.position;
        this._InputBuffer.position = this._InputBuffer.length;
        var Data = new ByteArray();
        var i;
        for (i = 0; i < data.length; i++) {
            Data.writeByte(data[i]);
        }
        Data.position = 0;
        this.NegotiateInbound(Data);
        this._InputBuffer.position = OldPosition;
        this.ondata.trigger();
    };
    WebSocketConnection.prototype.OnSocketClose = function () {
        if (this._WasConnected) {
            this.onclose.trigger();
        }
        else {
            this.onsecurityerror.trigger();
        }
        this._WasConnected = false;
    };
    WebSocketConnection.prototype.OnSocketError = function (e) {
        this.onioerror.trigger(e);
    };
    WebSocketConnection.prototype.OnSocketOpen = function () {
        if (!UseCordovaSocket) {
            if (this._WebSocket.protocol) {
                this._Protocol = this._WebSocket.protocol;
            }
            else {
                this._Protocol = 'plain';
            }
        }
        this._WasConnected = true;
        this.onconnect.trigger();
    };
    WebSocketConnection.prototype.OnWebSocketMessage = function (e) {
        if (this._InputBuffer.bytesAvailable === 0) {
            this._InputBuffer.clear();
        }
        var OldPosition = this._InputBuffer.position;
        this._InputBuffer.position = this._InputBuffer.length;
        var Data = new ByteArray();
        var i;
        if (this._Protocol === 'binary') {
            var u8 = new Uint8Array(e.data);
            for (i = 0; i < u8.length; i++) {
                Data.writeByte(u8[i]);
            }
        }
        else if (this._Protocol === 'base64') {
            Data.writeString(atob(e.data));
        }
        else {
            Data.writeString(e.data);
        }
        Data.position = 0;
        this.NegotiateInbound(Data);
        this._InputBuffer.position = OldPosition;
        this.ondata.trigger();
    };
    WebSocketConnection.prototype.readBytes = function (bytes, offset, length) {
        return this._InputBuffer.readBytes(bytes, offset, length);
    };
    WebSocketConnection.prototype.readString = function (length) {
        return this._InputBuffer.readString(length);
    };
    WebSocketConnection.prototype.readUnsignedByte = function () {
        return this._InputBuffer.readUnsignedByte();
    };
    WebSocketConnection.prototype.readUnsignedShort = function () {
        return this._InputBuffer.readUnsignedShort();
    };
    WebSocketConnection.prototype.Send = function (data) {
        var DebugLine = "";
        if (UseCordovaSocket) {
            this._CordovaSocket.write(new Uint8Array(data));
        }
        else {
            var i = 0;
            var ToSendString = '';
            if (this._Protocol === 'binary') {
                this._WebSocket.send(new Uint8Array(data).buffer);
            }
            else if (this._Protocol === 'base64') {
                for (i = 0; i < data.length; i++) {
                    var B = data[i];
                    if (B >= 32 && B <= 126) {
                        DebugLine += String.fromCharCode(B);
                    }
                    else {
                        DebugLine += '~' + B.toString(10);
                    }
                    ToSendString += String.fromCharCode(data[i]);
                }
                this._WebSocket.send(btoa(ToSendString));
            }
            else {
                for (i = 0; i < data.length; i++) {
                    var B = data[i];
                    if (B >= 32 && B <= 126) {
                        DebugLine += String.fromCharCode(B);
                    }
                    else {
                        DebugLine += '~' + B.toString(10);
                    }
                    ToSendString += String.fromCharCode(data[i]);
                }
                this._WebSocket.send(ToSendString);
            }
        }
        if (this._LogIO) {
            console.log('SEND: ' + DebugLine);
        }
    };
    Object.defineProperty(WebSocketConnection.prototype, "SendLocation", {
        set: function (value) {
            this._SendLocation = value;
        },
        enumerable: true,
        configurable: true
    });
    WebSocketConnection.prototype.writeByte = function (value) {
        this._OutputBuffer.writeByte(value);
    };
    WebSocketConnection.prototype.writeBytes = function (bytes, offset, length) {
        this._OutputBuffer.writeBytes(bytes, offset, length);
    };
    WebSocketConnection.prototype.writeShort = function (value) {
        this._OutputBuffer.writeShort(value);
    };
    WebSocketConnection.prototype.writeString = function (text) {
        this._OutputBuffer.writeString(text);
        this.flush();
    };
    return WebSocketConnection;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var RLoginConnection = (function (_super) {
    __extends(RLoginConnection, _super);
    function RLoginConnection() {
        var _this = _super.call(this) || this;
        _this._NegotiationState = RLoginNegotiationState.Data;
        _this._SSBytes = 0;
        return _this;
    }
    RLoginConnection.prototype.NegotiateInbound = function (data) {
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();
            if (this._NegotiationState === RLoginNegotiationState.Data) {
                if (B === RLoginCommand.Cookie) {
                    this._NegotiationState = RLoginNegotiationState.Cookie1;
                }
                else {
                    this._InputBuffer.writeByte(B);
                }
            }
            else if (this._NegotiationState === RLoginNegotiationState.Cookie1) {
                if (B === RLoginCommand.Cookie) {
                    this._NegotiationState = RLoginNegotiationState.Cookie2;
                }
                else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            }
            else if (this._NegotiationState === RLoginNegotiationState.Cookie2) {
                if (B === RLoginCommand.S) {
                    this._NegotiationState = RLoginNegotiationState.S1;
                }
                else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            }
            else if (this._NegotiationState === RLoginNegotiationState.S1) {
                if (B === RLoginCommand.S) {
                    this._NegotiationState = RLoginNegotiationState.SS;
                }
                else {
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            }
            else if (this._NegotiationState === RLoginNegotiationState.SS) {
                if (++this._SSBytes >= 8) {
                    this._SSBytes = 0;
                    this._NegotiationState = RLoginNegotiationState.Data;
                }
            }
        }
    };
    return RLoginConnection;
}(WebSocketConnection));
var RLoginNegotiationState;
(function (RLoginNegotiationState) {
    RLoginNegotiationState[RLoginNegotiationState["Data"] = 0] = "Data";
    RLoginNegotiationState[RLoginNegotiationState["Cookie1"] = 1] = "Cookie1";
    RLoginNegotiationState[RLoginNegotiationState["Cookie2"] = 2] = "Cookie2";
    RLoginNegotiationState[RLoginNegotiationState["S1"] = 3] = "S1";
    RLoginNegotiationState[RLoginNegotiationState["SS"] = 4] = "SS";
})(RLoginNegotiationState || (RLoginNegotiationState = {}));
var TelnetCommand;
(function (TelnetCommand) {
    TelnetCommand[TelnetCommand["EndSubnegotiation"] = 240] = "EndSubnegotiation";
    TelnetCommand[TelnetCommand["NoOperation"] = 241] = "NoOperation";
    TelnetCommand[TelnetCommand["DataMark"] = 242] = "DataMark";
    TelnetCommand[TelnetCommand["Break"] = 243] = "Break";
    TelnetCommand[TelnetCommand["InterruptProcess"] = 244] = "InterruptProcess";
    TelnetCommand[TelnetCommand["AbortOutput"] = 245] = "AbortOutput";
    TelnetCommand[TelnetCommand["AreYouThere"] = 246] = "AreYouThere";
    TelnetCommand[TelnetCommand["EraseCharacter"] = 247] = "EraseCharacter";
    TelnetCommand[TelnetCommand["EraseLine"] = 248] = "EraseLine";
    TelnetCommand[TelnetCommand["GoAhead"] = 249] = "GoAhead";
    TelnetCommand[TelnetCommand["Subnegotiation"] = 250] = "Subnegotiation";
    TelnetCommand[TelnetCommand["Will"] = 251] = "Will";
    TelnetCommand[TelnetCommand["Wont"] = 252] = "Wont";
    TelnetCommand[TelnetCommand["Do"] = 253] = "Do";
    TelnetCommand[TelnetCommand["Dont"] = 254] = "Dont";
    TelnetCommand[TelnetCommand["IAC"] = 255] = "IAC";
})(TelnetCommand || (TelnetCommand = {}));
var TelnetConnection = (function (_super) {
    __extends(TelnetConnection, _super);
    function TelnetConnection(crt) {
        var _this = _super.call(this) || this;
        _this._Crt = crt;
        _this._NegotiatedOptions = [];
        for (var i = 0; i < 256; i++) {
            _this._NegotiatedOptions[i] = 0;
        }
        _this._NegotiationState = TelnetNegotiationState.Data;
        _this._TerminalTypeIndex = 0;
        _this._TerminalTypes = ['ansi-bbs', 'ansi', 'cp437', 'cp437'];
        return _this;
    }
    TelnetConnection.prototype.flush = function () {
        var ToSendBytes = [];
        this._OutputBuffer.position = 0;
        while (this._OutputBuffer.bytesAvailable > 0) {
            var B = this._OutputBuffer.readUnsignedByte();
            ToSendBytes.push(B);
            if (B === TelnetCommand.IAC) {
                ToSendBytes.push(TelnetCommand.IAC);
            }
        }
        this.Send(ToSendBytes);
        this._OutputBuffer.clear();
    };
    TelnetConnection.prototype.HandleAreYouThere = function () {
        var ToSendBytes = [];
        ToSendBytes.push('.'.charCodeAt(0));
        this.Send(ToSendBytes);
    };
    TelnetConnection.prototype.HandleEcho = function (command) {
        switch (command) {
            case TelnetCommand.Do:
                this.SendWill(TelnetOption.Echo);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Dont:
                this.SendWont(TelnetOption.Echo);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Will:
                this.SendDo(TelnetOption.Echo);
                this._LocalEcho = false;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
            case TelnetCommand.Wont:
                this.SendDont(TelnetOption.Echo);
                this._LocalEcho = true;
                this.onlocalecho.trigger(this._LocalEcho);
                break;
        }
    };
    TelnetConnection.prototype.HandleSendLocation = function () {
        var _this = this;
        if (this._SendLocation) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('get', 'https://text.ipv4.wtfismyip.com/', true);
                xhr.onload = function () {
                    var status = xhr.status;
                    if (status === 200) {
                        _this.SendWill(TelnetOption.SendLocation);
                        _this.SendSubnegotiate(TelnetOption.SendLocation);
                        var ToSendString = xhr.responseText;
                        var ToSendBytes = [];
                        for (var i = 0; i < ToSendString.length; i++) {
                            var CharCode = ToSendString.charCodeAt(i);
                            ToSendBytes.push(CharCode);
                            if (CharCode === TelnetCommand.IAC) {
                                ToSendBytes.push(TelnetCommand.IAC);
                            }
                        }
                        _this.Send(ToSendBytes);
                        _this.SendSubnegotiateEnd();
                    }
                    else {
                        console.log('failed to get remote ip, status=' + status);
                    }
                };
                xhr.onerror = function () {
                    console.log('failed to get remote ip');
                };
                xhr.send();
            }
            catch (e) {
                console.log('failed to get remote ip: ' + e);
            }
        }
        else {
            this.SendWont(TelnetOption.SendLocation);
        }
    };
    TelnetConnection.prototype.HandleTerminalType = function () {
        this.SendWill(TelnetOption.TerminalType);
        this.SendSubnegotiate(TelnetOption.TerminalType);
        var TerminalType = this._TerminalTypes[this._TerminalTypeIndex];
        var ToSendBytes = [];
        ToSendBytes.push(0);
        for (var i = 0; i < TerminalType.length; i++) {
            ToSendBytes.push(TerminalType.charCodeAt(i));
        }
        this.Send(ToSendBytes);
        this.SendSubnegotiateEnd();
        if (this._TerminalTypeIndex < (this._TerminalTypes.length - 1)) {
            this._TerminalTypeIndex += 1;
        }
        else {
            this._TerminalTypeIndex = 0;
        }
    };
    TelnetConnection.prototype.HandleTerminalLocationNumber = function () {
        var _this = this;
        if (this._SendLocation) {
            var xhr = new XMLHttpRequest();
            xhr.open('get', 'https://text.ipv4.wtfismyip.com/', true);
            xhr.onload = function () {
                var status = xhr.status;
                if (status === 200) {
                    _this.SendWill(TelnetOption.TerminalLocationNumber);
                    _this.SendSubnegotiate(TelnetOption.TerminalLocationNumber);
                    var InternetHostNumber = StringUtils.IPtoInteger(xhr.responseText);
                    var TerminalNumber = 0xFFFFFFFF;
                    var SixtyFourBits = [];
                    SixtyFourBits.push(0);
                    SixtyFourBits.push((InternetHostNumber & 0xFF000000) >> 24);
                    SixtyFourBits.push((InternetHostNumber & 0x00FF0000) >> 16);
                    SixtyFourBits.push((InternetHostNumber & 0x0000FF00) >> 8);
                    SixtyFourBits.push((InternetHostNumber & 0x000000FF) >> 0);
                    SixtyFourBits.push((TerminalNumber & 0xFF000000) >> 24);
                    SixtyFourBits.push((TerminalNumber & 0x00FF0000) >> 16);
                    SixtyFourBits.push((TerminalNumber & 0x0000FF00) >> 8);
                    SixtyFourBits.push((TerminalNumber & 0x000000FF) >> 0);
                    var ToSendBytes = [];
                    for (var i = 0; i < SixtyFourBits.length; i++) {
                        ToSendBytes.push(SixtyFourBits[i]);
                        if (SixtyFourBits[i] === TelnetCommand.IAC) {
                            ToSendBytes.push(TelnetCommand.IAC);
                        }
                    }
                    _this.Send(ToSendBytes);
                    _this.SendSubnegotiateEnd();
                }
                else {
                }
            };
            xhr.onerror = function () {
            };
            xhr.send();
        }
        else {
            this.SendWont(TelnetOption.TerminalLocationNumber);
        }
    };
    TelnetConnection.prototype.HandleWindowSize = function () {
        this.SendWill(TelnetOption.WindowSize);
        this.SendSubnegotiate(TelnetOption.WindowSize);
        var Size = [];
        Size[0] = (this._Crt.WindCols >> 8) & 0xff;
        Size[1] = this._Crt.WindCols & 0xff;
        Size[2] = (this._Crt.WindRows >> 8) & 0xff;
        Size[3] = this._Crt.WindRows & 0xff;
        var ToSendBytes = [];
        for (var i = 0; i < Size.length; i++) {
            ToSendBytes.push(Size[i]);
            if (Size[i] === TelnetCommand.IAC) {
                ToSendBytes.push(TelnetCommand.IAC);
            }
        }
        this.Send(ToSendBytes);
        this.SendSubnegotiateEnd();
    };
    Object.defineProperty(TelnetConnection.prototype, "LocalEcho", {
        set: function (value) {
            this._LocalEcho = value;
            if (this.connected) {
                if (this._LocalEcho) {
                    this.SendWill(TelnetOption.Echo);
                }
                else {
                    this.SendWont(TelnetOption.Echo);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    TelnetConnection.prototype.NegotiateInbound = function (data) {
        var DebugLine = "";
        while (data.bytesAvailable) {
            var B = data.readUnsignedByte();
            if (B >= 32 && B <= 126) {
                DebugLine += String.fromCharCode(B);
            }
            else {
                DebugLine += '~' + B.toString(10);
            }
            if (this._NegotiationState === TelnetNegotiationState.Data) {
                if (B === TelnetCommand.IAC) {
                    this._NegotiationState = TelnetNegotiationState.IAC;
                }
                else {
                    this._InputBuffer.writeByte(B);
                }
            }
            else if (this._NegotiationState === TelnetNegotiationState.IAC) {
                if (B === TelnetCommand.IAC) {
                    this._NegotiationState = TelnetNegotiationState.Data;
                    this._InputBuffer.writeByte(B);
                }
                else {
                    switch (B) {
                        case TelnetCommand.NoOperation:
                        case TelnetCommand.DataMark:
                        case TelnetCommand.Break:
                        case TelnetCommand.InterruptProcess:
                        case TelnetCommand.AbortOutput:
                        case TelnetCommand.EraseCharacter:
                        case TelnetCommand.EraseLine:
                        case TelnetCommand.GoAhead:
                            this._NegotiationState = TelnetNegotiationState.Data;
                            break;
                        case TelnetCommand.AreYouThere:
                            this.HandleAreYouThere();
                            this._NegotiationState = TelnetNegotiationState.Data;
                            break;
                        case TelnetCommand.Do:
                            this._NegotiationState = TelnetNegotiationState.Do;
                            break;
                        case TelnetCommand.Dont:
                            this._NegotiationState = TelnetNegotiationState.Dont;
                            break;
                        case TelnetCommand.Will:
                            this._NegotiationState = TelnetNegotiationState.Will;
                            break;
                        case TelnetCommand.Wont:
                            this._NegotiationState = TelnetNegotiationState.Wont;
                            break;
                        default:
                            this._NegotiationState = TelnetNegotiationState.Data;
                            break;
                    }
                }
            }
            else if (this._NegotiationState === TelnetNegotiationState.Do) {
                switch (B) {
                    case TelnetCommand.AreYouThere:
                        this.SendWill(TelnetCommand.AreYouThere);
                        this._NegotiatedOptions[TelnetCommand.AreYouThere] = 0;
                        break;
                    case TelnetOption.TransmitBinary:
                        this.SendWill(B);
                        break;
                    case TelnetOption.Echo:
                        this.HandleEcho(TelnetCommand.Do);
                        break;
                    case TelnetOption.SuppressGoAhead:
                        this.SendWill(B);
                        break;
                    case TelnetOption.SendLocation:
                        this.HandleSendLocation();
                        break;
                    case TelnetOption.TerminalType:
                        this.HandleTerminalType();
                        break;
                    case TelnetOption.TerminalLocationNumber:
                        this.HandleTerminalLocationNumber();
                        break;
                    case TelnetOption.WindowSize:
                        this.HandleWindowSize();
                        break;
                    case TelnetOption.LineMode:
                        this.SendWont(B);
                        break;
                    default:
                        this.SendWont(B);
                        break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            }
            else if (this._NegotiationState === TelnetNegotiationState.Dont) {
                switch (B) {
                    case TelnetOption.TransmitBinary:
                        this.SendWill(B);
                        break;
                    case TelnetOption.Echo:
                        this.HandleEcho(TelnetCommand.Dont);
                        break;
                    case TelnetOption.SuppressGoAhead:
                        this.SendWill(B);
                        break;
                    case TelnetOption.SendLocation:
                        this.SendWont(B);
                        break;
                    case TelnetOption.TerminalLocationNumber:
                        this.SendWont(B);
                        break;
                    case TelnetOption.WindowSize:
                        this.SendWont(B);
                        break;
                    case TelnetOption.LineMode:
                        this.SendWont(B);
                        break;
                    default:
                        this.SendWont(B);
                        break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            }
            else if (this._NegotiationState === TelnetNegotiationState.Will) {
                switch (B) {
                    case TelnetOption.TransmitBinary:
                        this.SendDo(B);
                        break;
                    case TelnetOption.Echo:
                        this.HandleEcho(TelnetCommand.Will);
                        break;
                    case TelnetOption.SuppressGoAhead:
                        this.SendDo(B);
                        break;
                    case TelnetOption.SendLocation:
                        this.SendDont(B);
                        break;
                    case TelnetOption.TerminalLocationNumber:
                        this.SendDont(B);
                        break;
                    case TelnetOption.WindowSize:
                        this.SendDont(B);
                        break;
                    case TelnetOption.LineMode:
                        this.SendDont(B);
                        break;
                    default:
                        this.SendDont(B);
                        break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            }
            else if (this._NegotiationState === TelnetNegotiationState.Wont) {
                switch (B) {
                    case TelnetOption.TransmitBinary:
                        this.SendDo(B);
                        break;
                    case TelnetOption.Echo:
                        this.HandleEcho(TelnetCommand.Wont);
                        break;
                    case TelnetOption.SuppressGoAhead:
                        this.SendDo(B);
                        break;
                    case TelnetOption.SendLocation:
                        this.SendDont(B);
                        break;
                    case TelnetOption.TerminalLocationNumber:
                        this.SendDont(B);
                        break;
                    case TelnetOption.WindowSize:
                        this.SendDont(B);
                        break;
                    case TelnetOption.LineMode:
                        this.SendDont(B);
                        break;
                    default:
                        this.SendDont(B);
                        break;
                }
                this._NegotiationState = TelnetNegotiationState.Data;
            }
            else {
                this._NegotiationState = TelnetNegotiationState.Data;
            }
        }
        if (this._LogIO) {
            if (DebugLine.length > 0) {
                console.log('IN: ' + DebugLine);
            }
        }
    };
    TelnetConnection.prototype.OnSocketOpen = function () {
        _super.prototype.OnSocketOpen.call(this);
        if (this._LocalEcho) {
            this.SendWill(TelnetOption.Echo);
        }
        else {
            this.SendWont(TelnetOption.Echo);
        }
        if (this._SendLocation) {
            this.SendWill(TelnetOption.SendLocation);
            this.SendWill(TelnetOption.TerminalLocationNumber);
        }
    };
    TelnetConnection.prototype.SendDo = function (option) {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Do) {
            this._NegotiatedOptions[option] = TelnetCommand.Do;
            var ToSendBytes = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Do);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
            if (this._LogIO) {
                console.log('DO ' + option.toString(10));
            }
        }
        else {
            if (this._LogIO) {
                console.log('Duplicate DO ' + option.toString(10));
            }
        }
    };
    TelnetConnection.prototype.SendDont = function (option) {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Dont) {
            this._NegotiatedOptions[option] = TelnetCommand.Dont;
            var ToSendBytes = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Dont);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
            if (this._LogIO) {
                console.log('DONT ' + option.toString(10));
            }
        }
        else {
            if (this._LogIO) {
                console.log('Duplicate DONT ' + option.toString(10));
            }
        }
    };
    TelnetConnection.prototype.SendSubnegotiate = function (option) {
        var ToSendBytes = [];
        ToSendBytes.push(TelnetCommand.IAC);
        ToSendBytes.push(TelnetCommand.Subnegotiation);
        ToSendBytes.push(option);
        this.Send(ToSendBytes);
    };
    TelnetConnection.prototype.SendSubnegotiateEnd = function () {
        var ToSendBytes = [];
        ToSendBytes.push(TelnetCommand.IAC);
        ToSendBytes.push(TelnetCommand.EndSubnegotiation);
        this.Send(ToSendBytes);
    };
    TelnetConnection.prototype.SendWill = function (option) {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Will) {
            this._NegotiatedOptions[option] = TelnetCommand.Will;
            var ToSendBytes = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Will);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
            if (this._LogIO) {
                console.log('WILL ' + option.toString(10));
            }
        }
        else {
            if (this._LogIO) {
                console.log('Duplicate WILL ' + option.toString(10));
            }
        }
    };
    TelnetConnection.prototype.SendWont = function (option) {
        if (this._NegotiatedOptions[option] !== TelnetCommand.Wont) {
            this._NegotiatedOptions[option] = TelnetCommand.Wont;
            var ToSendBytes = [];
            ToSendBytes.push(TelnetCommand.IAC);
            ToSendBytes.push(TelnetCommand.Wont);
            ToSendBytes.push(option);
            this.Send(ToSendBytes);
            if (this._LogIO) {
                console.log('WONT ' + option.toString(10));
            }
        }
        else {
            if (this._LogIO) {
                console.log('Duplicate WONT ' + option.toString(10));
            }
        }
    };
    return TelnetConnection;
}(WebSocketConnection));
var TelnetNegotiationState;
(function (TelnetNegotiationState) {
    TelnetNegotiationState[TelnetNegotiationState["Data"] = 0] = "Data";
    TelnetNegotiationState[TelnetNegotiationState["IAC"] = 1] = "IAC";
    TelnetNegotiationState[TelnetNegotiationState["Do"] = 2] = "Do";
    TelnetNegotiationState[TelnetNegotiationState["Dont"] = 3] = "Dont";
    TelnetNegotiationState[TelnetNegotiationState["Will"] = 4] = "Will";
    TelnetNegotiationState[TelnetNegotiationState["Wont"] = 5] = "Wont";
})(TelnetNegotiationState || (TelnetNegotiationState = {}));
var TelnetOption;
(function (TelnetOption) {
    TelnetOption[TelnetOption["TransmitBinary"] = 0] = "TransmitBinary";
    TelnetOption[TelnetOption["Echo"] = 1] = "Echo";
    TelnetOption[TelnetOption["Reconnection"] = 2] = "Reconnection";
    TelnetOption[TelnetOption["SuppressGoAhead"] = 3] = "SuppressGoAhead";
    TelnetOption[TelnetOption["ApproxMessageSizeNegotiation"] = 4] = "ApproxMessageSizeNegotiation";
    TelnetOption[TelnetOption["Status"] = 5] = "Status";
    TelnetOption[TelnetOption["TimingMark"] = 6] = "TimingMark";
    TelnetOption[TelnetOption["RemoteControlledTransAndEcho"] = 7] = "RemoteControlledTransAndEcho";
    TelnetOption[TelnetOption["OutputLineWidth"] = 8] = "OutputLineWidth";
    TelnetOption[TelnetOption["OutputPageSize"] = 9] = "OutputPageSize";
    TelnetOption[TelnetOption["OutputCarriageReturnDisposition"] = 10] = "OutputCarriageReturnDisposition";
    TelnetOption[TelnetOption["OutputHorizontalTabStops"] = 11] = "OutputHorizontalTabStops";
    TelnetOption[TelnetOption["OutputHorizontalTabDisposition"] = 12] = "OutputHorizontalTabDisposition";
    TelnetOption[TelnetOption["OutputFormfeedDisposition"] = 13] = "OutputFormfeedDisposition";
    TelnetOption[TelnetOption["OutputVerticalTabstops"] = 14] = "OutputVerticalTabstops";
    TelnetOption[TelnetOption["OutputVerticalTabDisposition"] = 15] = "OutputVerticalTabDisposition";
    TelnetOption[TelnetOption["OutputLinefeedDisposition"] = 16] = "OutputLinefeedDisposition";
    TelnetOption[TelnetOption["ExtendedASCII"] = 17] = "ExtendedASCII";
    TelnetOption[TelnetOption["Logout"] = 18] = "Logout";
    TelnetOption[TelnetOption["ByteMacro"] = 19] = "ByteMacro";
    TelnetOption[TelnetOption["DataEntryTerminal"] = 20] = "DataEntryTerminal";
    TelnetOption[TelnetOption["SUPDUP"] = 21] = "SUPDUP";
    TelnetOption[TelnetOption["SUPDUPOutput"] = 22] = "SUPDUPOutput";
    TelnetOption[TelnetOption["SendLocation"] = 23] = "SendLocation";
    TelnetOption[TelnetOption["TerminalType"] = 24] = "TerminalType";
    TelnetOption[TelnetOption["EndOfRecord"] = 25] = "EndOfRecord";
    TelnetOption[TelnetOption["TACACSUserIdentification"] = 26] = "TACACSUserIdentification";
    TelnetOption[TelnetOption["OutputMarking"] = 27] = "OutputMarking";
    TelnetOption[TelnetOption["TerminalLocationNumber"] = 28] = "TerminalLocationNumber";
    TelnetOption[TelnetOption["Telnet3270Regime"] = 29] = "Telnet3270Regime";
    TelnetOption[TelnetOption["Xdot3PAD"] = 30] = "Xdot3PAD";
    TelnetOption[TelnetOption["WindowSize"] = 31] = "WindowSize";
    TelnetOption[TelnetOption["TerminalSpeed"] = 32] = "TerminalSpeed";
    TelnetOption[TelnetOption["RemoteFlowControl"] = 33] = "RemoteFlowControl";
    TelnetOption[TelnetOption["LineMode"] = 34] = "LineMode";
    TelnetOption[TelnetOption["XDisplayLocation"] = 35] = "XDisplayLocation";
    TelnetOption[TelnetOption["EnvironmentOption"] = 36] = "EnvironmentOption";
    TelnetOption[TelnetOption["AuthenticationOption"] = 37] = "AuthenticationOption";
    TelnetOption[TelnetOption["EncryptionOption"] = 38] = "EncryptionOption";
    TelnetOption[TelnetOption["NewEnvironmentOption"] = 39] = "NewEnvironmentOption";
    TelnetOption[TelnetOption["TN3270E"] = 40] = "TN3270E";
    TelnetOption[TelnetOption["XAUTH"] = 41] = "XAUTH";
    TelnetOption[TelnetOption["CHARSET"] = 42] = "CHARSET";
    TelnetOption[TelnetOption["TelnetRemoteSerialPort"] = 43] = "TelnetRemoteSerialPort";
    TelnetOption[TelnetOption["ComPortControlOption"] = 44] = "ComPortControlOption";
    TelnetOption[TelnetOption["TelnetSuppressLocalEcho"] = 45] = "TelnetSuppressLocalEcho";
    TelnetOption[TelnetOption["TelnetStartTLS"] = 46] = "TelnetStartTLS";
    TelnetOption[TelnetOption["KERMIT"] = 47] = "KERMIT";
    TelnetOption[TelnetOption["SENDURL"] = 48] = "SENDURL";
    TelnetOption[TelnetOption["FORWARD_X"] = 49] = "FORWARD_X";
})(TelnetOption || (TelnetOption = {}));
//# sourceMappingURL=connections.js.map
var BorderStyle;
(function (BorderStyle) {
    BorderStyle[BorderStyle["Single"] = 0] = "Single";
    BorderStyle[BorderStyle["Double"] = 1] = "Double";
    BorderStyle[BorderStyle["SingleH"] = 2] = "SingleH";
    BorderStyle[BorderStyle["SingleV"] = 3] = "SingleV";
    BorderStyle[BorderStyle["DoubleH"] = 4] = "DoubleH";
    BorderStyle[BorderStyle["DoubleV"] = 5] = "DoubleV";
})(BorderStyle || (BorderStyle = {}));
var ContentAlignment;
(function (ContentAlignment) {
    ContentAlignment[ContentAlignment["BottomLeft"] = 0] = "BottomLeft";
    ContentAlignment[ContentAlignment["BottomCenter"] = 1] = "BottomCenter";
    ContentAlignment[ContentAlignment["BottomRight"] = 2] = "BottomRight";
    ContentAlignment[ContentAlignment["MiddleLeft"] = 3] = "MiddleLeft";
    ContentAlignment[ContentAlignment["MiddleCenter"] = 4] = "MiddleCenter";
    ContentAlignment[ContentAlignment["MiddleRight"] = 5] = "MiddleRight";
    ContentAlignment[ContentAlignment["TopLeft"] = 6] = "TopLeft";
    ContentAlignment[ContentAlignment["TopCenter"] = 7] = "TopCenter";
    ContentAlignment[ContentAlignment["TopRight"] = 8] = "TopRight";
    ContentAlignment[ContentAlignment["Left"] = 9] = "Left";
    ContentAlignment[ContentAlignment["Center"] = 10] = "Center";
    ContentAlignment[ContentAlignment["Right"] = 11] = "Right";
})(ContentAlignment || (ContentAlignment = {}));
var CrtControl = (function () {
    function CrtControl(crt, parent, left, top, width, height) {
        this._BackColour = Crt.BLACK;
        this._Controls = [];
        this._ForeColour = Crt.LIGHTGRAY;
        this._Crt = crt;
        this._Parent = parent;
        this._Left = left;
        this._Top = top;
        this._Width = width;
        this._Height = height;
        this.SaveBackground();
        if (typeof this._Parent !== 'undefined') {
            this._Parent.AddControl(this);
        }
    }
    CrtControl.prototype.AddControl = function (child) {
        this._Controls.push(child);
    };
    Object.defineProperty(CrtControl.prototype, "BackColour", {
        get: function () {
            return this._BackColour;
        },
        set: function (value) {
            if (value !== this._BackColour) {
                this._BackColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtControl.prototype, "ForeColour", {
        get: function () {
            return this._ForeColour;
        },
        set: function (value) {
            if (value !== this._ForeColour) {
                this._ForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtControl.prototype, "Height", {
        get: function () {
            return this._Height;
        },
        set: function (value) {
            if (value !== this._Height) {
                this.RestoreBackground();
                this._Height = value;
                this.SaveBackground();
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    CrtControl.prototype.Hide = function () {
        this.RestoreBackground();
    };
    Object.defineProperty(CrtControl.prototype, "Left", {
        get: function () {
            return this._Left;
        },
        set: function (value) {
            if (value !== this._Left) {
                this.RestoreBackground();
                this._Left = value;
                this.SaveBackground();
                this.Paint(true);
                for (var i = 0; i < this._Controls.length; i++) {
                    this._Controls[i].Paint(true);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    CrtControl.prototype.Paint = function (force) {
        force = force;
    };
    Object.defineProperty(CrtControl.prototype, "Parent", {
        get: function () {
            return this._Parent;
        },
        set: function (value) {
            this.RestoreBackground();
            this._Parent = value;
            this.SaveBackground();
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });
    CrtControl.prototype.RestoreBackground = function () {
        var Left = this._Left;
        var Top = this._Top;
        var P = this._Parent;
        while (typeof P !== 'undefined') {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        this._Crt.RestoreScreen(this._Background, Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    };
    CrtControl.prototype.SaveBackground = function () {
        var Left = this._Left;
        var Top = this._Top;
        var P = this._Parent;
        while (typeof P !== 'undefined') {
            Left += P.Left;
            Top += P.Top;
            P = P.Parent;
        }
        this._Background = this._Crt.SaveScreen(Left, Top, Left + this._Width - 1, Top + this._Height - 1);
    };
    Object.defineProperty(CrtControl.prototype, "ScreenLeft", {
        get: function () {
            return this._Left + ((typeof this._Parent === 'undefined') ? 0 : this._Parent.Left);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtControl.prototype, "ScreenTop", {
        get: function () {
            return this._Top + ((typeof this._Parent === 'undefined') ? 0 : this._Parent.Top);
        },
        enumerable: true,
        configurable: true
    });
    CrtControl.prototype.Show = function () {
        this.Paint(true);
        for (var i = 0; i < this._Controls.length; i++) {
            this._Controls[i].Paint(true);
        }
    };
    Object.defineProperty(CrtControl.prototype, "Top", {
        get: function () {
            return this._Top;
        },
        set: function (value) {
            if (value !== this._Top) {
                this.RestoreBackground();
                this._Top = value;
                this.SaveBackground();
                this.Paint(true);
                for (var i = 0; i < this._Controls.length; i++) {
                    this._Controls[i].Paint(true);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtControl.prototype, "Width", {
        get: function () {
            return this._Width;
        },
        set: function (value) {
            if (value !== this._Width) {
                this.RestoreBackground();
                this._Width = value;
                this.SaveBackground();
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    return CrtControl;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CrtLabel = (function (_super) {
    __extends(CrtLabel, _super);
    function CrtLabel(crt, parent, left, top, width, text, textAlign, foreColour, backColour) {
        var _this = _super.call(this, crt, parent, left, top, width, 1) || this;
        _this._Text = text;
        _this._TextAlign = textAlign;
        _this.ForeColour = foreColour;
        _this.BackColour = backColour;
        _this.Paint(true);
        return _this;
    }
    CrtLabel.prototype.Paint = function (force) {
        force = force;
        var Lines = this._Text.replace('\r\n', '\n').split('\n');
        for (var i = 0; i < Lines.length; i++) {
            if (i === this.Height) {
                break;
            }
            switch (this._TextAlign) {
                case ContentAlignment.Center:
                    if (Lines[i].length >= this.Width) {
                        this._Crt.FastWrite(Lines[i].substring(0, this.Width), this.ScreenLeft, this.ScreenTop + i, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
                    }
                    else {
                        var i = 0;
                        var LeftSpaces = '';
                        for (i = 0; i < Math.floor((this.Width - Lines[i].length) / 2); i++) {
                            LeftSpaces += ' ';
                        }
                        var RightSpaces = '';
                        for (i = 0; i < this.Width - Lines[i].length - LeftSpaces.length; i++) {
                            RightSpaces += ' ';
                        }
                        this._Crt.FastWrite(LeftSpaces + Lines[i] + RightSpaces, this.ScreenLeft, this.ScreenTop + i, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
                    }
                    break;
                case ContentAlignment.Left:
                    this._Crt.FastWrite(StringUtils.PadRight(Lines[i], ' ', this.Width), this.ScreenLeft, this.ScreenTop + i, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
                    break;
                case ContentAlignment.Right:
                    this._Crt.FastWrite(StringUtils.PadLeft(Lines[i], ' ', this.Width), this.ScreenLeft, this.ScreenTop + i, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
                    break;
            }
        }
    };
    Object.defineProperty(CrtLabel.prototype, "Text", {
        get: function () {
            return this._Text;
        },
        set: function (value) {
            this._Text = value;
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtLabel.prototype, "TextAlign", {
        get: function () {
            return this._TextAlign;
        },
        set: function (value) {
            if (value !== this._TextAlign) {
                this._TextAlign = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    return CrtLabel;
}(CrtControl));
var CrtPanel = (function (_super) {
    __extends(CrtPanel, _super);
    function CrtPanel(crt, parent, left, top, width, height, border, foreColour, backColour, text, textAlign) {
        var _this = _super.call(this, crt, parent, left, top, width, height) || this;
        _this._Border = border;
        _this._Text = text;
        _this._TextAlign = textAlign;
        _this.ForeColour = foreColour;
        _this.BackColour = backColour;
        _this.Paint(true);
        return _this;
    }
    Object.defineProperty(CrtPanel.prototype, "Border", {
        get: function () {
            return this._Border;
        },
        set: function (value) {
            if (value !== this._Border) {
                this._Border = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    CrtPanel.prototype.Paint = function (force) {
        force = force;
        var TopLeft = '+';
        var TopRight = '+';
        var BottomLeft = '+';
        var BottomRight = '+';
        var TopBottom = '|';
        var LeftRight = '-';
        switch (this._Border) {
            case BorderStyle.Single:
                TopLeft = String.fromCharCode(218);
                TopRight = String.fromCharCode(191);
                BottomLeft = String.fromCharCode(192);
                BottomRight = String.fromCharCode(217);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(179);
                break;
            case BorderStyle.Double:
                TopLeft = String.fromCharCode(201);
                TopRight = String.fromCharCode(187);
                BottomLeft = String.fromCharCode(200);
                BottomRight = String.fromCharCode(188);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(186);
                break;
            case BorderStyle.DoubleH:
            case BorderStyle.SingleV:
                TopLeft = String.fromCharCode(213);
                TopRight = String.fromCharCode(184);
                BottomLeft = String.fromCharCode(212);
                BottomRight = String.fromCharCode(190);
                TopBottom = String.fromCharCode(205);
                LeftRight = String.fromCharCode(179);
                break;
            case BorderStyle.DoubleV:
            case BorderStyle.SingleH:
                TopLeft = String.fromCharCode(214);
                TopRight = String.fromCharCode(183);
                BottomLeft = String.fromCharCode(211);
                BottomRight = String.fromCharCode(189);
                TopBottom = String.fromCharCode(196);
                LeftRight = String.fromCharCode(186);
                break;
        }
        this._Crt.FastWrite(TopLeft + StringUtils.NewString(TopBottom, this.Width - 2) + TopRight, this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
        for (var Line = this.ScreenTop + 1; Line < this.ScreenTop + this.Height - 1; Line++) {
            this._Crt.FastWrite(LeftRight + StringUtils.NewString(' ', this.Width - 2) + LeftRight, this.ScreenLeft, Line, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
        }
        this._Crt.FastWrite(BottomLeft + StringUtils.NewString(TopBottom, this.Width - 2) + BottomRight, this.ScreenLeft, this.ScreenTop + this.Height - 1, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
        if (StringUtils.Trim(this._Text).length > 0) {
            var TitleX = 0;
            var TitleY = 0;
            var WindowTitle = ' ' + StringUtils.Trim(this._Text) + ' ';
            switch (this._TextAlign) {
                case ContentAlignment.BottomLeft:
                case ContentAlignment.MiddleLeft:
                case ContentAlignment.TopLeft:
                    TitleX = this.ScreenLeft + 2;
                    break;
                case ContentAlignment.BottomCenter:
                case ContentAlignment.MiddleCenter:
                case ContentAlignment.TopCenter:
                    TitleX = this.ScreenLeft + Math.round((this.Width - WindowTitle.length) / 2);
                    break;
                case ContentAlignment.BottomRight:
                case ContentAlignment.MiddleRight:
                case ContentAlignment.TopRight:
                    TitleX = this.ScreenLeft + this.Width - WindowTitle.length - 2;
                    break;
            }
            switch (this._TextAlign) {
                case ContentAlignment.BottomCenter:
                case ContentAlignment.BottomLeft:
                case ContentAlignment.BottomRight:
                    TitleY = this.ScreenTop + this.Height - 1;
                    break;
                case ContentAlignment.MiddleCenter:
                case ContentAlignment.MiddleLeft:
                case ContentAlignment.MiddleRight:
                case ContentAlignment.TopCenter:
                case ContentAlignment.TopLeft:
                case ContentAlignment.TopRight:
                    TitleY = this.ScreenTop;
                    break;
            }
            this._Crt.FastWrite(WindowTitle, TitleX, TitleY, CharInfo.GetNew(' ', this.ForeColour + (this.BackColour << 4)));
        }
    };
    Object.defineProperty(CrtPanel.prototype, "Text", {
        get: function () {
            return this._Text;
        },
        set: function (value) {
            this._Text = value;
            this.Paint(true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtPanel.prototype, "TextAlign", {
        get: function () {
            return this._TextAlign;
        },
        set: function (value) {
            if (value !== this._TextAlign) {
                this._TextAlign = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    return CrtPanel;
}(CrtControl));
var CrtProgressBar = (function (_super) {
    __extends(CrtProgressBar, _super);
    function CrtProgressBar(crt, parent, left, top, width, style) {
        var _this = _super.call(this, crt, parent, left, top, width, 1) || this;
        _this._LastBarWidth = 9999;
        _this._LastMarqueeUpdate = 0;
        _this._LastPercentText = '';
        _this._Style = style;
        _this.BackColour = Crt.BLUE;
        _this._BarForeColour = Crt.YELLOW;
        _this._BlankForeColour = Crt.LIGHTGRAY;
        _this._LastMarqueeUpdate = new Date().getTime();
        _this._MarqueeAnimationSpeed = 25;
        _this._Maximum = 100;
        _this._PercentPrecision = 2;
        _this._PercentVisible = true;
        _this._Value = 0;
        _this.Paint(true);
        return _this;
    }
    Object.defineProperty(CrtProgressBar.prototype, "BarForeColour", {
        get: function () {
            return this._BarForeColour;
        },
        set: function (value) {
            if (value !== this._BarForeColour) {
                this._BarForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtProgressBar.prototype, "BlankForeColour", {
        get: function () {
            return this._BlankForeColour;
        },
        set: function (value) {
            if (value !== this._BlankForeColour) {
                this._BlankForeColour = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtProgressBar.prototype, "MarqueeAnimationSpeed", {
        get: function () {
            return this._MarqueeAnimationSpeed;
        },
        set: function (value) {
            this._MarqueeAnimationSpeed = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtProgressBar.prototype, "Maximum", {
        get: function () {
            return this._Maximum;
        },
        set: function (value) {
            if (value !== this._Maximum) {
                this._Maximum = value;
                if (this._Value > this._Maximum) {
                    this._Value = this._Maximum;
                }
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    CrtProgressBar.prototype.Paint = function (force) {
        if (this._Style === ProgressBarStyle.Marquee) {
            if (force) {
                this._Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this._BlankForeColour + (this.BackColour << 4)));
            }
            if (this._Value > 0) {
                if (this._Value > this.Width) {
                    this._Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this.Width - (15 - Math.floor(this._Value - this.Width)), this.ScreenTop, CharInfo.GetNew(' ', this._BlankForeColour + (this.BackColour << 4)));
                }
                else if (this._Value >= 15) {
                    this._Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft + this._Value - 15, this.ScreenTop, CharInfo.GetNew(' ', this._BarForeColour + (this.BackColour << 4)));
                    this._Crt.FastWrite(String.fromCharCode(176), this.ScreenLeft + this._Value - 15, this.ScreenTop, CharInfo.GetNew(' ', this._BlankForeColour + (this.BackColour << 4)));
                }
                else {
                    this._Crt.FastWrite(StringUtils.NewString(String.fromCharCode(219), Math.min(this._Value, 15)), this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this._BarForeColour + (this.BackColour << 4)));
                }
            }
        }
        else {
            if (force) {
                this._LastBarWidth = 9999;
                this._LastPercentText = '';
            }
            var PaintPercentText = false;
            var Percent = this._Value / this._Maximum;
            var NewBarWidth = Math.floor(Percent * this.Width);
            if (NewBarWidth !== this._LastBarWidth) {
                if (NewBarWidth < this._LastBarWidth) {
                    this._Crt.FastWrite(StringUtils.NewString(String.fromCharCode(176), this.Width), this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this._BlankForeColour + (this.BackColour << 4)));
                }
                this._Crt.FastWrite(StringUtils.NewString(String.fromCharCode(this._Style), NewBarWidth), this.ScreenLeft, this.ScreenTop, CharInfo.GetNew(' ', this._BarForeColour + (this.BackColour << 4)));
                this._LastBarWidth = NewBarWidth;
                PaintPercentText = true;
            }
            if (this._PercentVisible) {
                var NewPercentText = StringUtils.FormatPercent(Percent, this._PercentPrecision);
                if ((NewPercentText !== this._LastPercentText) || (PaintPercentText)) {
                    this._LastPercentText = NewPercentText;
                    var ProgressStart = Math.round((this.Width - NewPercentText.length) / 2);
                    if (ProgressStart >= NewBarWidth) {
                        this._Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, CharInfo.GetNew(' ', this._BlankForeColour + (this.BackColour << 4)));
                    }
                    else if (ProgressStart + NewPercentText.length <= NewBarWidth) {
                        this._Crt.FastWrite(NewPercentText, this.ScreenLeft + ProgressStart, this.ScreenTop, CharInfo.GetNew(' ', this.BackColour + (this._BarForeColour << 4)));
                    }
                    else {
                        for (var i = 0; i < NewPercentText.length; i++) {
                            var LetterPosition = ProgressStart + i;
                            var FG = (LetterPosition >= NewBarWidth) ? this._BlankForeColour : this.BackColour;
                            var BG = (LetterPosition >= NewBarWidth) ? this.BackColour : this._BarForeColour;
                            this._Crt.FastWrite(NewPercentText.charAt(i), this.ScreenLeft + LetterPosition, this.ScreenTop, CharInfo.GetNew(' ', FG + (BG << 4)));
                        }
                    }
                }
            }
        }
    };
    Object.defineProperty(CrtProgressBar.prototype, "PercentPrecision", {
        get: function () {
            return this._PercentPrecision;
        },
        set: function (value) {
            if (value !== this._PercentPrecision) {
                this._PercentPrecision = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtProgressBar.prototype, "PercentVisible", {
        get: function () {
            return this._PercentVisible;
        },
        set: function (value) {
            if (value !== this._PercentVisible) {
                this._PercentVisible = value;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    CrtProgressBar.prototype.Step = function () {
        this.StepBy(1);
    };
    CrtProgressBar.prototype.StepBy = function (count) {
        this.Value += count;
    };
    Object.defineProperty(CrtProgressBar.prototype, "Style", {
        get: function () {
            return this._Style;
        },
        set: function (style) {
            if (style !== this._Style) {
                this._Style = style;
                this.Paint(true);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CrtProgressBar.prototype, "Value", {
        get: function () {
            return this._Value;
        },
        set: function (value) {
            if (value !== this._Value) {
                if (this._Style === ProgressBarStyle.Marquee) {
                    if ((new Date()).getTime() - this._LastMarqueeUpdate >= this._MarqueeAnimationSpeed) {
                        if (value < 0) {
                            value = 0;
                        }
                        if (value >= this.Width + 15) {
                            value = 0;
                        }
                        this._Value = value;
                        this.Paint(false);
                        this._LastMarqueeUpdate = (new Date()).getTime();
                    }
                }
                else {
                    this._Value = Math.max(0, Math.min(value, this._Maximum));
                    this.Paint(false);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    return CrtProgressBar;
}(CrtControl));
var ProgressBarStyle;
(function (ProgressBarStyle) {
    ProgressBarStyle[ProgressBarStyle["Blocks"] = 254] = "Blocks";
    ProgressBarStyle[ProgressBarStyle["Continuous"] = 219] = "Continuous";
    ProgressBarStyle[ProgressBarStyle["Marquee"] = 0] = "Marquee";
})(ProgressBarStyle || (ProgressBarStyle = {}));
//# sourceMappingURL=crtcontrols.js.map
var CRC = (function () {
    function CRC() {
    }
    CRC.Calculate16 = function (bytes) {
        var CRC = 0;
        var OldPosition = bytes.position;
        bytes.position = 0;
        while (bytes.bytesAvailable > 0) {
            CRC = this.UpdateCrc(bytes.readUnsignedByte(), CRC);
        }
        CRC = this.UpdateCrc(0, CRC);
        CRC = this.UpdateCrc(0, CRC);
        bytes.position = OldPosition;
        return CRC;
    };
    CRC.UpdateCrc = function (curByte, curCrc) {
        return (this.CRC_TABLE[(curCrc >> 8) & 0x00FF] ^ (curCrc << 8) ^ curByte) & 0xFFFF;
    };
    CRC.CRC_TABLE = [
        0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
        0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
        0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
        0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
        0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
        0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
        0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
        0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
        0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
        0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
        0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
        0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
        0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
        0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
        0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
        0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
        0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
        0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
        0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
        0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
        0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
        0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
        0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
        0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
        0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
        0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
        0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
        0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
        0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
        0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
        0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
        0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0
    ];
    return CRC;
}());
var FileRecord = (function () {
    function FileRecord(name, size) {
        this._Data = new ByteArray();
        this._Name = '';
        this._Size = 0;
        this._Name = name;
        this._Size = size;
    }
    Object.defineProperty(FileRecord.prototype, "data", {
        get: function () {
            return this._Data;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileRecord.prototype, "name", {
        get: function () {
            return this._Name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileRecord.prototype, "size", {
        get: function () {
            return this._Size;
        },
        enumerable: true,
        configurable: true
    });
    return FileRecord;
}());
var YModemReceive = (function () {
    function YModemReceive(crt, connection) {
        this.ontransfercomplete = new TypedEvent();
        this.SOH = 0x01;
        this.STX = 0x02;
        this.EOT = 0x04;
        this.ACK = 0x06;
        this.CAN = 0x18;
        this.CAPG = 'G'.charCodeAt(0);
        this._ExpectingHeader = true;
        this._Files = [];
        this._LastGTime = 0;
        this._NextByte = 0;
        this._ShouldSendG = true;
        this._TotalBytesReceived = 0;
        this._Crt = crt;
        this._Connection = connection;
    }
    YModemReceive.prototype.Cancel = function (reason) {
        try {
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeString('\b\b\b\b\b     \b\b\b\b\b');
        }
        catch (ioe1) {
            this.HandleIOError(ioe1);
            return;
        }
        try {
            this._Connection.readString();
        }
        catch (ioe2) {
            this.HandleIOError(ioe2);
            return;
        }
        this.CleanUp('Cancelling (' + reason + ')');
    };
    YModemReceive.prototype.CleanUp = function (message) {
        var _this = this;
        clearInterval(this._Timer);
        this.lblStatus.Text = 'Status: ' + message;
        setTimeout(function () { _this.Dispatch(); }, 3000);
    };
    YModemReceive.prototype.Dispatch = function () {
        this.pnlMain.Hide();
        this._Crt.ShowCursor();
        this.ontransfercomplete.trigger();
    };
    YModemReceive.prototype.Download = function () {
        var _this = this;
        this._Timer = setInterval(function () { _this.OnTimer(); }, 50);
        this._Crt.HideCursor();
        this.pnlMain = new CrtPanel(this._Crt, undefined, 10, 5, 60, 14, BorderStyle.Single, Crt.WHITE, Crt.BLUE, 'YModem-G Receive Status (Hit CTRL+X to abort)', ContentAlignment.TopLeft);
        this.lblFileCount = new CrtLabel(this._Crt, this.pnlMain, 2, 2, 56, 'Receiving file 1', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileName = new CrtLabel(this._Crt, this.pnlMain, 2, 4, 56, 'File Name: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileSize = new CrtLabel(this._Crt, this.pnlMain, 2, 5, 56, 'File Size: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileReceived = new CrtLabel(this._Crt, this.pnlMain, 2, 6, 56, 'File Recv: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.pbFileReceived = new CrtProgressBar(this._Crt, this.pnlMain, 2, 7, 56, ProgressBarStyle.Continuous);
        this.lblTotalReceived = new CrtLabel(this._Crt, this.pnlMain, 2, 9, 56, 'Total Recv: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblStatus = new CrtLabel(this._Crt, this.pnlMain, 2, 11, 56, 'Status: Transferring file(s)', ContentAlignment.Left, Crt.WHITE, Crt.BLUE);
    };
    YModemReceive.prototype.FileAt = function (index) {
        return this._Files[index];
    };
    Object.defineProperty(YModemReceive.prototype, "FileCount", {
        get: function () {
            return this._Files.length;
        },
        enumerable: true,
        configurable: true
    });
    YModemReceive.prototype.HandleIOError = function (ioe) {
        console.log('I/O Error: ' + ioe);
        if (this._Connection.connected) {
            this.CleanUp('Unhandled I/O error');
        }
        else {
            this.CleanUp('Connection to server lost');
        }
    };
    YModemReceive.prototype.OnTimer = function () {
        while (this._Crt.KeyPressed()) {
            var KPE = this._Crt.ReadKey();
            if ((typeof KPE !== 'undefined') && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === this.CAN)) {
                this.Cancel('User requested abort');
            }
        }
        while (true) {
            if (this._NextByte === 0) {
                if (this._Connection.bytesAvailable === 0) {
                    if (this._ShouldSendG && ((new Date()).getTime() - this._LastGTime > 3000)) {
                        try {
                            this._Connection.writeByte(this.CAPG);
                            this._Connection.flush();
                        }
                        catch (ioe1) {
                            this.HandleIOError(ioe1);
                            return;
                        }
                        this._LastGTime = new Date().getTime();
                    }
                    return;
                }
                else {
                    try {
                        this._NextByte = this._Connection.readUnsignedByte();
                    }
                    catch (ioe2) {
                        this.HandleIOError(ioe2);
                        return;
                    }
                }
            }
            switch (this._NextByte) {
                case this.CAN:
                    this.CleanUp('Sender requested abort');
                    break;
                case this.SOH:
                case this.STX:
                    this._ShouldSendG = false;
                    var BlockSize = (this._NextByte === this.STX) ? 1024 : 128;
                    if (this._Connection.bytesAvailable < (1 + 1 + BlockSize + 1 + 1)) {
                        return;
                    }
                    this._NextByte = 0;
                    var InBlock = this._Connection.readUnsignedByte();
                    var InBlockInverse = this._Connection.readUnsignedByte();
                    if (InBlockInverse !== (255 - InBlock)) {
                        this.Cancel('Bad block #: ' + InBlockInverse.toString() + ' !== 255-' + InBlock.toString());
                        return;
                    }
                    var Packet = new ByteArray();
                    this._Connection.readBytes(Packet, 0, BlockSize);
                    var InCRC = this._Connection.readUnsignedShort();
                    var OurCRC = CRC.Calculate16(Packet);
                    if (InCRC !== OurCRC) {
                        this.Cancel('Bad CRC: ' + InCRC.toString() + ' !== ' + OurCRC.toString());
                        return;
                    }
                    if (this._ExpectingHeader) {
                        if (InBlock !== 0) {
                            this.Cancel('Expecting header got block ' + InBlock.toString());
                            return;
                        }
                        this._ExpectingHeader = false;
                        var FileName = '';
                        var B = Packet.readUnsignedByte();
                        while ((B !== 0) && (Packet.bytesAvailable > 0)) {
                            FileName += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }
                        var Temp = '';
                        var FileSize = 0;
                        B = Packet.readUnsignedByte();
                        while ((B >= 48) && (B <= 57) && (Packet.bytesAvailable > 0)) {
                            Temp += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }
                        FileSize = parseInt(Temp, 10);
                        if (FileName.length === 0) {
                            this.CleanUp('File(s) successfully received!');
                            return;
                        }
                        if (isNaN(FileSize) || (FileSize === 0)) {
                            this.Cancel('File Size missing from header block');
                            return;
                        }
                        this._File = new FileRecord(FileName, FileSize);
                        this.lblFileCount.Text = 'Receiving file ' + (this._Files.length + 1).toString();
                        this.lblFileName.Text = 'File Name: ' + FileName;
                        this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(FileSize) + ' bytes';
                        this.lblFileReceived.Text = 'File Recv: 0 bytes';
                        this.pbFileReceived.Value = 0;
                        this.pbFileReceived.Maximum = FileSize;
                        try {
                            this._Connection.writeByte(this.CAPG);
                            this._Connection.flush();
                        }
                        catch (ioe3) {
                            this.HandleIOError(ioe3);
                            return;
                        }
                    }
                    else {
                        var BytesToWrite = Math.min(BlockSize, this._File.size - this._File.data.length);
                        this._File.data.writeBytes(Packet, 0, BytesToWrite);
                        this._TotalBytesReceived += BytesToWrite;
                        this.lblFileReceived.Text = 'File Recv: ' + StringUtils.AddCommas(this._File.data.length) + ' bytes';
                        this.pbFileReceived.Value = this._File.data.length;
                        this.lblTotalReceived.Text = 'Total Recv: ' + StringUtils.AddCommas(this._TotalBytesReceived) + ' bytes';
                    }
                    break;
                case this.EOT:
                    this._ShouldSendG = true;
                    try {
                        this._Connection.writeByte(this.ACK);
                        this._Connection.writeByte(this.CAPG);
                        this._Connection.flush();
                    }
                    catch (ioe4) {
                        this.HandleIOError(ioe4);
                        return;
                    }
                    this._NextByte = 0;
                    this._ExpectingHeader = true;
                    this._Files.push(this._File);
                    this.SaveFile(this._Files.length - 1);
                    break;
                default:
                    this.Cancel('Unexpected byte: ' + this._NextByte.toString());
                    return;
            }
        }
    };
    YModemReceive.prototype.SaveFile = function (index) {
        var ByteString = this._Files[index].data.toString();
        var Buffer = new ArrayBuffer(ByteString.length);
        var View = new DataView(Buffer);
        for (var i = 0; i < ByteString.length; i++) {
            View.setUint8(i, ByteString.charCodeAt(i));
        }
        var FileBlob = new Blob([Buffer], { type: 'application/octet-binary' });
        saveAs(FileBlob, this._Files[index].name);
    };
    return YModemReceive;
}());
var YModemSend = (function () {
    function YModemSend(crt, connection) {
        this.ontransfercomplete = new TypedEvent();
        this.SOH = 0x01;
        this.STX = 0x02;
        this.EOT = 0x04;
        this.ACK = 0x06;
        this.NAK = 0x15;
        this.CAN = 0x18;
        this.SUB = 0x1A;
        this.CAPG = 'G'.charCodeAt(0);
        this._Block = 0;
        this._EOTCount = 0;
        this._FileBytesSent = 0;
        this._FileCount = 0;
        this._Files = [];
        this._State = YModemSendState.WaitingForHeaderRequest;
        this._TotalBytes = 0;
        this._TotalBytesSent = 0;
        this._Crt = crt;
        this._Connection = connection;
    }
    YModemSend.prototype.Cancel = function (reason) {
        try {
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeString('\b\b\b\b\b     \b\b\b\b\b');
        }
        catch (ioe1) {
            this.HandleIOError(ioe1);
            return;
        }
        try {
            this._Connection.readString();
        }
        catch (ioe2) {
            this.HandleIOError(ioe2);
            return;
        }
        this.CleanUp('Cancelling (' + reason + ')');
    };
    YModemSend.prototype.CleanUp = function (message) {
        var _this = this;
        clearInterval(this._Timer);
        this.lblStatus.Text = 'Status: ' + message;
        setTimeout(function () { _this.Dispatch(); }, 3000);
    };
    YModemSend.prototype.Dispatch = function () {
        this.pnlMain.Hide();
        this._Crt.ShowCursor();
        this.ontransfercomplete.trigger();
    };
    YModemSend.prototype.HandleIOError = function (ioe) {
        console.log('I/O Error: ' + ioe);
        if (this._Connection.connected) {
            this.CleanUp('Unhandled I/O error');
        }
        else {
            this.CleanUp('Connection to server lost');
        }
    };
    YModemSend.prototype.OnTimer = function () {
        while (this._Crt.KeyPressed()) {
            var KPE = this._Crt.ReadKey();
            if ((typeof KPE !== 'undefined') && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === this.CAN)) {
                this.Cancel('User requested abort');
            }
        }
        if ((this._State !== YModemSendState.SendingData) && (this._Connection.bytesAvailable === 0)) {
            return;
        }
        var B = 0;
        switch (this._State) {
            case YModemSendState.WaitingForHeaderRequest:
                try {
                    B = this._Connection.readUnsignedByte();
                }
                catch (ioe1) {
                    this.HandleIOError(ioe1);
                    return;
                }
                if (B !== this.CAPG) {
                    this.Cancel('Expecting G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }
                try {
                    this._Connection.readString();
                }
                catch (ioe2) {
                    this.HandleIOError(ioe2);
                    return;
                }
                var NextFile = this._Files.shift();
                if (typeof NextFile === 'undefined') {
                    this.SendEmptyHeaderBlock();
                    this.CleanUp('File(s) successfully sent!');
                    return;
                }
                this._File = NextFile;
                this.lblFileCount.Text = 'Sending file ' + (this._FileCount - this._Files.length).toString() + ' of ' + this._FileCount.toString();
                this.lblFileName.Text = 'File Name: ' + this._File.name;
                this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(this._File.size) + ' bytes';
                this.lblFileSent.Text = 'File Sent: 0 bytes';
                this.pbFileSent.Value = 0;
                this.pbFileSent.Maximum = this._File.size;
                this.SendHeaderBlock();
                this._Block = 1;
                this._EOTCount = 0;
                this._FileBytesSent = 0;
                this._State = YModemSendState.WaitingForHeaderAck;
                return;
            case YModemSendState.WaitingForHeaderAck:
                try {
                    B = this._Connection.readUnsignedByte();
                }
                catch (ioe3) {
                    this.HandleIOError(ioe3);
                    return;
                }
                if ((B !== this.ACK) && (B !== this.CAPG)) {
                    this.Cancel('Expecting ACK/G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }
                if (B === this.ACK) {
                    this._State = YModemSendState.WaitingForFileRequest;
                }
                else if (B === this.CAPG) {
                    this._State = YModemSendState.SendingData;
                }
                return;
            case YModemSendState.WaitingForFileRequest:
                try {
                    B = this._Connection.readUnsignedByte();
                }
                catch (ioe4) {
                    this.HandleIOError(ioe4);
                    return;
                }
                if (B !== this.CAPG) {
                    this.Cancel('Expecting G got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }
                this._State = YModemSendState.SendingData;
                return;
            case YModemSendState.SendingData:
                if (this.SendDataBlocks(16)) {
                    this._State = YModemSendState.WaitingForFileAck;
                }
                return;
            case YModemSendState.WaitingForFileAck:
                try {
                    B = this._Connection.readUnsignedByte();
                }
                catch (ioe5) {
                    this.HandleIOError(ioe5);
                    return;
                }
                if ((B !== this.ACK) && (B !== this.NAK)) {
                    this.Cancel('Expecting (N)ACK got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }
                if (B === this.ACK) {
                    this._State = YModemSendState.WaitingForHeaderRequest;
                }
                else if (B === this.NAK) {
                    this.SendEOT();
                }
                return;
        }
    };
    YModemSend.prototype.SendDataBlocks = function (blocks) {
        for (var loop = 0; loop < blocks; loop++) {
            var BytesToRead = Math.min(1024, this._File.data.bytesAvailable);
            if (BytesToRead === 0) {
                this.SendEOT();
                return true;
            }
            else {
                var Packet = new ByteArray();
                this._File.data.readBytes(Packet, 0, BytesToRead);
                if (Packet.length < 1024) {
                    Packet.position = Packet.length;
                    while (Packet.length < 1024) {
                        Packet.writeByte(this.SUB);
                    }
                    Packet.position = 0;
                }
                try {
                    this._Connection.writeByte(this.STX);
                    this._Connection.writeByte(this._Block % 256);
                    this._Connection.writeByte(255 - (this._Block % 256));
                    this._Connection.writeBytes(Packet);
                    this._Connection.writeShort(CRC.Calculate16(Packet));
                    this._Connection.flush();
                }
                catch (ioe) {
                    this.HandleIOError(ioe);
                    return false;
                }
                this._Block++;
                this._FileBytesSent += BytesToRead;
                this._TotalBytesSent += BytesToRead;
                this.lblFileSent.Text = 'File Sent: ' + StringUtils.AddCommas(this._FileBytesSent) + ' bytes';
                this.pbFileSent.StepBy(BytesToRead);
                this.lblTotalSent.Text = 'Total Sent: ' + StringUtils.AddCommas(this._TotalBytesSent) + ' bytes';
                this.pbTotalSent.StepBy(BytesToRead);
            }
        }
        return false;
    };
    YModemSend.prototype.SendEmptyHeaderBlock = function () {
        var Packet = new ByteArray();
        for (var i = 0; i < 128; i++) {
            Packet.writeByte(0);
        }
        try {
            this._Connection.writeByte(this.SOH);
            this._Connection.writeByte(0);
            this._Connection.writeByte(255);
            this._Connection.writeBytes(Packet);
            this._Connection.writeShort(CRC.Calculate16(Packet));
            this._Connection.flush();
        }
        catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    };
    YModemSend.prototype.SendEOT = function () {
        try {
            this._Connection.writeByte(this.EOT);
            this._Connection.flush();
        }
        catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
        this._EOTCount++;
    };
    YModemSend.prototype.SendHeaderBlock = function () {
        var i = 0;
        var Packet = new ByteArray();
        for (i = 0; i < this._File.name.length; i++) {
            Packet.writeByte(this._File.name.charCodeAt(i));
        }
        Packet.writeByte(0);
        var Size = this._File.size.toString();
        for (i = 0; i < Size.length; i++) {
            Packet.writeByte(Size.charCodeAt(i));
        }
        if (Packet.length < 128) {
            while (Packet.length < 128) {
                Packet.writeByte(0);
            }
        }
        else if (Packet.length === 128) {
            i = 0;
        }
        else if (Packet.length < 1024) {
            while (Packet.length < 1024) {
                Packet.writeByte(0);
            }
        }
        else if (Packet.length === 1024) {
            i = 0;
        }
        else {
            this.Cancel('Header packet exceeded 1024 bytes!');
            return;
        }
        try {
            this._Connection.writeByte(Packet.length === 128 ? this.SOH : this.STX);
            this._Connection.writeByte(0);
            this._Connection.writeByte(255);
            this._Connection.writeBytes(Packet);
            this._Connection.writeShort(CRC.Calculate16(Packet));
            this._Connection.flush();
        }
        catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    };
    YModemSend.prototype.Upload = function (file, fileCount) {
        var _this = this;
        this._FileCount = fileCount;
        this._Files.push(file);
        if (this._Files.length === fileCount) {
            this._Timer = setInterval(function () { _this.OnTimer(); }, 50);
            for (var i = 0; i < this._Files.length; i++) {
                this._TotalBytes += this._Files[i].size;
            }
            this._Crt.HideCursor();
            this.pnlMain = new CrtPanel(this._Crt, undefined, 10, 5, 60, 16, BorderStyle.Single, Crt.WHITE, Crt.BLUE, 'YModem-G Send Status (Hit CTRL+X to abort)', ContentAlignment.TopLeft);
            this.lblFileCount = new CrtLabel(this._Crt, this.pnlMain, 2, 2, 56, 'Sending file 1 of ' + this._FileCount.toString(), ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.lblFileName = new CrtLabel(this._Crt, this.pnlMain, 2, 4, 56, 'File Name: ' + this._Files[0].name, ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.lblFileSize = new CrtLabel(this._Crt, this.pnlMain, 2, 5, 56, 'File Size: ' + StringUtils.AddCommas(this._Files[0].size) + ' bytes', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.lblFileSent = new CrtLabel(this._Crt, this.pnlMain, 2, 6, 56, 'File Sent: 0 bytes', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.pbFileSent = new CrtProgressBar(this._Crt, this.pnlMain, 2, 7, 56, ProgressBarStyle.Continuous);
            this.lblTotalSize = new CrtLabel(this._Crt, this.pnlMain, 2, 9, 56, 'Total Size: ' + StringUtils.AddCommas(this._TotalBytes) + ' bytes', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.lblTotalSent = new CrtLabel(this._Crt, this.pnlMain, 2, 10, 56, 'Total Sent: 0 bytes', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            this.pbTotalSent = new CrtProgressBar(this._Crt, this.pnlMain, 2, 11, 56, ProgressBarStyle.Continuous);
            this.pbTotalSent.Maximum = this._TotalBytes;
            this.lblStatus = new CrtLabel(this._Crt, this.pnlMain, 2, 13, 56, 'Status: Transferring file(s)', ContentAlignment.Left, Crt.WHITE, Crt.BLUE);
        }
    };
    return YModemSend;
}());
var YModemSendState;
(function (YModemSendState) {
    YModemSendState[YModemSendState["WaitingForHeaderRequest"] = 0] = "WaitingForHeaderRequest";
    YModemSendState[YModemSendState["WaitingForHeaderAck"] = 1] = "WaitingForHeaderAck";
    YModemSendState[YModemSendState["WaitingForFileRequest"] = 2] = "WaitingForFileRequest";
    YModemSendState[YModemSendState["SendingData"] = 3] = "SendingData";
    YModemSendState[YModemSendState["WaitingForFileAck"] = 4] = "WaitingForFileAck";
})(YModemSendState || (YModemSendState = {}));
//# sourceMappingURL=filetransfer.js.map
var VirtualKeyboard = (function () {
    function VirtualKeyboard(crt, container) {
        var _this = this;
        this._AltPressed = false;
        this._CapsLockEnabled = false;
        this._CtrlPressed = false;
        this._ShiftPressed = false;
        this._SupportsTouchEvents = false;
        this._VibrateDurationInMilliseconds = 25;
        this._Visible = true;
        this._ClassKeys = {
            '27': 'Escape',
            '36': 'HomeEndInsertDelete',
            '35': 'HomeEndInsertDelete',
            '45': 'HomeEndInsertDelete',
            '46': 'HomeEndInsertDelete',
            '8': 'Backspace',
            '9': 'Tab',
            '220': 'Backslash',
            '20': 'CapsLock',
            '13': 'Enter',
            '1004': 'ShiftLeft',
            '38': 'ArrowUp',
            '17': 'Ctrl',
            '18': 'Alt',
            '32': 'Spacebar',
            '37': 'ArrowLeft',
            '40': 'ArrowDown',
            '39': 'ArrowRight'
        };
        this._Keys = [];
        this._Crt = crt;
        container.appendChild(this.CreateDivElement());
        var Keys = document.getElementsByClassName('fTelnetKeyboardKey');
        for (var i = 0; i < Keys.length; i++) {
            if (Keys[i].addEventListener) {
                var KeyCode = Keys[i].getAttribute('data-keycode');
                if (KeyCode !== null) {
                    if (this._Keys[KeyCode][2] > 0) {
                        Keys[i].addEventListener('click', function (e) { if (!_this._SupportsTouchEvents) {
                            _this.OnCharCode(e);
                        } }, false);
                        Keys[i].addEventListener('touchend', function (e) { _this.OnCharCode(e); }, false);
                        Keys[i].addEventListener('touchstart', function () { _this.OnTouchStart(); }, false);
                    }
                    else {
                        Keys[i].addEventListener('click', function (e) { if (!_this._SupportsTouchEvents) {
                            _this.OnKeyCode(e);
                        } }, false);
                        Keys[i].addEventListener('touchend', function (e) { _this.OnKeyCode(e); }, false);
                        Keys[i].addEventListener('touchstart', function () { _this.OnTouchStart(); }, false);
                    }
                }
            }
        }
    }
    VirtualKeyboard.prototype.CreateDivElement = function () {
        var Rows = [
            [
                [27, 'Esc', 0, 0],
                [112, 'F1', 0, 0],
                [113, 'F2', 0, 0],
                [114, 'F3', 0, 0],
                [115, 'F4', 0, 0],
                [116, 'F5', 0, 0],
                [117, 'F6', 0, 0],
                [118, 'F7', 0, 0],
                [119, 'F8', 0, 0],
                [120, 'F9', 0, 0],
                [121, 'F10', 0, 0],
                [122, 'F11', 0, 0],
                [123, 'F12', 0, 0],
                [36, 'Home', 0, 0],
                [35, 'End', 0, 0],
                [45, 'Ins', 0, 0],
                [46, 'Del', 0, 0]
            ],
            [
                [192, '~<br />`', 126, 96],
                [49, '!<br />1', 33, 49],
                [50, '@<br />2', 64, 50],
                [51, '#<br />3', 35, 51],
                [52, '$<br />4', 36, 52],
                [53, '%<br />5', 37, 53],
                [54, '^<br />6', 94, 54],
                [55, '&<br />7', 38, 55],
                [56, '*<br />8', 42, 56],
                [57, '(<br />9', 40, 57],
                [48, ')<br />0', 41, 48],
                [173, '_<br />-', 95, 45],
                [61, '+<br />=', 43, 61],
                [8, 'Backspace', 0, 0]
            ],
            [
                [9, 'Tab', 0, 0],
                [81, 'Q', 81, 113],
                [87, 'W', 87, 119],
                [69, 'E', 69, 101],
                [82, 'R', 82, 114],
                [84, 'T', 84, 116],
                [89, 'Y', 89, 121],
                [85, 'U', 85, 117],
                [73, 'I', 73, 105],
                [79, 'O', 79, 111],
                [80, 'P', 80, 112],
                [219, '{<br />[', 123, 91],
                [221, '}<br />]', 125, 93],
                [220, '|<br />\\', 124, 92]
            ],
            [
                [20, 'Caps Lock', 0, 0],
                [65, 'A', 65, 97],
                [83, 'S', 83, 115],
                [68, 'D', 68, 100],
                [70, 'F', 70, 102],
                [71, 'G', 71, 103],
                [72, 'H', 72, 104],
                [74, 'J', 74, 106],
                [75, 'K', 75, 107],
                [76, 'L', 76, 108],
                [59, ':<br />;', 58, 59],
                [222, '"<br />\'', 34, 39],
                [13, 'Enter', 0, 0]
            ],
            [
                [1004, 'Shift', 0, 0],
                [90, 'Z', 90, 122],
                [88, 'X', 88, 120],
                [67, 'C', 67, 99],
                [86, 'V', 86, 118],
                [66, 'B', 66, 98],
                [78, 'N', 78, 110],
                [77, 'M', 77, 109],
                [188, '&lt;<br />,', 60, 44],
                [190, '&gt;<br />.', 62, 46],
                [191, '?<br />/', 63, 47],
                [33, 'Page<br />Up', 0, 0],
                [38, '', 0, 0],
                [34, 'Page<br />Down', 0, 0]
            ],
            [
                [17, 'Ctrl', 0, 0],
                [18, 'Alt', 0, 0],
                [32, '&nbsp;', 0, 0],
                [18, 'Alt', 0, 0],
                [17, 'Ctrl', 0, 0],
                [37, '', 0, 0],
                [40, '', 0, 0],
                [39, '', 0, 0]
            ]
        ];
        var Html = '';
        for (var Row = 0; Row < Rows.length; Row++) {
            Html += '<div class="fTelnetKeyboardRow';
            if (Row === 0) {
                Html += ' fTelnetKeyboardRowFunction';
            }
            Html += '">';
            for (var i = 0; i < Rows[Row].length; i++) {
                Html += '<div class="fTelnetKeyboardKey';
                if (typeof this._ClassKeys[Rows[Row][i][0]] !== 'undefined') {
                    Html += ' fTelnetKeyboardKey' + this._ClassKeys[Rows[Row][i][0]];
                }
                Html += '" data-keycode="' + Rows[Row][i][0] + '">';
                Html += Rows[Row][i][1];
                Html += '</div>';
                this._Keys[Rows[Row][i][0]] = Rows[Row][i];
            }
            Html += '</div>';
        }
        var ChildDiv = document.createElement('div');
        ChildDiv.className = 'fTelnetKeyboard';
        ChildDiv.innerHTML = Html;
        this._Div = document.createElement('div');
        this._Div.className = 'fTelnetKeyboardWrapper';
        this._Div.appendChild(ChildDiv);
        this._Div.style.display = (this._Visible ? 'block' : 'none');
        return this._Div;
    };
    VirtualKeyboard.prototype.HighlightKey = function (className, lit) {
        var Keys = document.getElementsByClassName(className);
        for (var i = 0; i < Keys.length; i++) {
            if (lit) {
                Keys[i].style.color = '#00ff00';
            }
            else {
                Keys[i].removeAttribute('style');
            }
        }
    };
    VirtualKeyboard.prototype.OnCharCode = function (e) {
        var KeyCodeString = e.target.getAttribute('data-keycode');
        if (KeyCodeString !== null) {
            var KeyCode = parseInt(KeyCodeString, 10);
            var CharCode = 0;
            if ((KeyCode >= 65) && (KeyCode <= 90)) {
                CharCode = parseInt((this._ShiftPressed !== this._CapsLockEnabled) ? this._Keys[KeyCode][2] : this._Keys[KeyCode][3], 10);
            }
            else {
                CharCode = parseInt(this._ShiftPressed ? this._Keys[KeyCode][2] : this._Keys[KeyCode][3], 10);
            }
            var NeedReDraw = false;
            var RegularKey = true;
            if (this._AltPressed) {
                NeedReDraw = true;
                RegularKey = false;
            }
            if (this._CtrlPressed) {
                NeedReDraw = true;
                RegularKey = false;
            }
            if (this._ShiftPressed) {
                NeedReDraw = true;
            }
            this._Crt.PushKeyDown(0, KeyCode, this._CtrlPressed, this._AltPressed, this._ShiftPressed);
            if (RegularKey) {
                this._Crt.PushKeyPress(CharCode, 0, this._CtrlPressed, this._AltPressed, this._ShiftPressed);
            }
            if (!!navigator.vibrate && (this._VibrateDurationInMilliseconds > 0)) {
                navigator.vibrate(25);
            }
            if (NeedReDraw) {
                this._AltPressed = false;
                this._CtrlPressed = false;
                this._ShiftPressed = false;
                this.ReDrawSpecialKeys();
            }
        }
    };
    VirtualKeyboard.prototype.OnKeyCode = function (e) {
        var KeyCodeString = e.target.getAttribute('data-keycode');
        if (KeyCodeString !== null) {
            var KeyCode = parseInt(KeyCodeString, 10);
            var NeedReset = false;
            switch (KeyCode) {
                case KeyboardKeys.ALTERNATE:
                    this._AltPressed = !this._AltPressed;
                    this.ReDrawSpecialKeys();
                    break;
                case KeyboardKeys.CAPS_LOCK:
                    this._CapsLockEnabled = !this._CapsLockEnabled;
                    this.ReDrawSpecialKeys();
                    break;
                case KeyboardKeys.CONTROL:
                    this._CtrlPressed = !this._CtrlPressed;
                    this.ReDrawSpecialKeys();
                    break;
                case KeyboardKeys.SHIFTLEFT:
                    this._ShiftPressed = !this._ShiftPressed;
                    this.ReDrawSpecialKeys();
                    break;
                default:
                    NeedReset = true;
                    break;
            }
            this._Crt.PushKeyDown(0, KeyCode, this._CtrlPressed, this._AltPressed, this._ShiftPressed);
            if (!!navigator.vibrate && (this._VibrateDurationInMilliseconds > 0)) {
                navigator.vibrate(25);
            }
            if (NeedReset) {
                this._AltPressed = false;
                this._CtrlPressed = false;
                this._ShiftPressed = false;
                this.ReDrawSpecialKeys();
            }
        }
    };
    VirtualKeyboard.prototype.OnTouchStart = function () {
        if (this._SupportsTouchEvents) {
            return;
        }
        this._SupportsTouchEvents = true;
        var Keys = document.getElementsByClassName('fTelnetKeyboardKey');
        for (var i = 0; i < Keys.length; i++) {
            if (Keys[i].removeEventListener) {
                var KeyCode = Keys[i].getAttribute('data-keycode');
                if (KeyCode !== null) {
                    if (this._Keys[KeyCode][2] > 0) {
                        Keys[i].removeEventListener('click', this.OnCharCode);
                        Keys[i].removeEventListener('touchstart', this.OnTouchStart, false);
                    }
                    else {
                        Keys[i].removeEventListener('click', this.OnKeyCode, false);
                        Keys[i].removeEventListener('touchstart', this.OnTouchStart, false);
                    }
                }
            }
        }
    };
    VirtualKeyboard.prototype.ReDrawSpecialKeys = function () {
        this.HighlightKey('fTelnetKeyboardKeyCapsLock', this._CapsLockEnabled);
        this.HighlightKey('fTelnetKeyboardKeyShiftLeft', this._ShiftPressed);
        this.HighlightKey('fTelnetKeyboardKeyCtrl', this._CtrlPressed);
        this.HighlightKey('fTelnetKeyboardKeyAlt', this._AltPressed);
    };
    Object.defineProperty(VirtualKeyboard.prototype, "VibrateDurationInMilliseconds", {
        get: function () {
            return this._VibrateDurationInMilliseconds;
        },
        set: function (value) {
            this._VibrateDurationInMilliseconds = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "Visible", {
        get: function () {
            return this._Visible;
        },
        set: function (value) {
            this._Visible = value;
            if (typeof this._Div !== 'undefined') {
                this._Div.style.display = (value ? 'block' : 'none');
            }
        },
        enumerable: true,
        configurable: true
    });
    return VirtualKeyboard;
}());
var fTelnetClient = (function () {
    function fTelnetClient(containerId, options) {
        var _this = this;
        this.ondata = new TypedEvent();
        this._HasFocus = true;
        this._LastTimer = 0;
        this._UseModernScrollback = false;
        if (typeof options === 'undefined') {
            var Message = 'fTelnet Error: The options parameter is required (pass in an fTelnetOptions object)';
            alert(Message);
            throw new Error(Message);
        }
        else {
            this._Options = options;
            if ((this._Options.Emulation === 'RIP') && (typeof RIP !== 'undefined')) {
                this._Options.Font = 'RIP_8x8';
                this._Options.ScreenRows = 43;
            }
            else {
                this._Options.Emulation = 'ansi-bbs';
            }
        }
        if (typeof containerId === 'string') {
            var Container = document.getElementById(containerId);
            if (Container === null) {
                var Message = 'fTelnet Error: fTelnet constructor was passed an invalid container id';
                alert(Message);
                throw new Error(Message);
            }
            else {
                this._fTelnetContainer = Container;
            }
        }
        else {
            var Message = 'fTelnet Error: fTelnet constructor was passed an invalid container id';
            alert(Message);
            throw new Error(Message);
        }
        if (document.getElementById('fTelnetScript') === null) {
            var Message = 'fTelnet Error: Script element with id="fTelnetScript" was not found';
            alert(Message);
            throw new Error(Message);
        }
        if (document.getElementById('fTelnetCss') === null) {
            var link = document.createElement('link');
            link.id = 'fTelnetCss';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = StringUtils.GetUrl('ftelnet.css');
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        if (document.getElementById('fTelnetKeyboardCss') === null) {
            var link = document.createElement('link');
            link.id = 'fTelnetKeyboardCss';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        this._InitMessageBar = document.createElement('div');
        this._InitMessageBar.className = 'fTelnetInitMessage';
        this._InitMessageBar.innerHTML = 'Initializing fTelnet...';
        this._fTelnetContainer.appendChild(this._InitMessageBar);
        this._ClientContainer = document.createElement('div');
        this._ClientContainer.className = 'fTelnetClientContainer';
        this._fTelnetContainer.appendChild(this._ClientContainer);
        this._UseModernScrollback = (this._Options.AllowModernScrollback && DetectMobileBrowser.SupportsModernScrollback && (this._Options.Emulation !== 'RIP'));
        if (this._UseModernScrollback) {
            this._ClientContainer.style.overflowX = 'hidden';
            this._ClientContainer.style.overflowY = 'scroll';
            this._ClientContainer.style.height = this._Options.ScreenRows * 16 + 'px';
            this._ClientContainer.style.width = (this._Options.ScreenColumns * 9) + GetScrollbarWidth.Width + 'px';
            this._ClientContainer.scrollTop = this._ClientContainer.scrollHeight;
        }
        this._Crt = new Crt(this._ClientContainer, this._UseModernScrollback);
        this._InitMessageBar.style.display = 'none';
        this._Crt.onfontchange.on(function () { _this.OnCrtScreenSizeChanged(); });
        this._Crt.onkeypressed.on(function () { _this.OnCrtKeyPressed(); });
        this._Crt.onscreensizechange.on(function () { _this.OnCrtScreenSizeChanged(); });
        this._Crt.BareLFtoCRLF = this._Options.BareLFtoCRLF;
        this._Crt.LocalEcho = this._Options.LocalEcho;
        this._Crt.SkipRedrawWhenSameFontSize = this._Options.SkipRedrawWhenSameFontSize;
        this._Crt.SetFont(this._Options.Font);
        this._Crt.SetScreenSize(this._Options.ScreenColumns, this._Options.ScreenRows);
        this._Ansi = new Ansi(this._Crt);
        this._Ansi.onesc0c.on(function () { _this.OnAnsiESC0c(); });
        this._Ansi.onesc5n.on(function () { _this.OnAnsiESC5n(); });
        this._Ansi.onesc6n.on(function () { _this.OnAnsiESC6n(); });
        this._Ansi.onesc255n.on(function () { _this.OnAnsiESC255n(); });
        this._Ansi.onescQ.on(function (font) { _this.OnAnsiESCQ(font); });
        this._Ansi.onripdetect.on(function () { _this.OnAnsiRIPDetect(); });
        this._Ansi.onripdisable.on(function () { _this.OnAnsiRIPDisable(); });
        this._Ansi.onripenable.on(function () { _this.OnAnsiRIPEnable(); });
        if (this._Options.Emulation === 'RIP') {
            this._RIP = new RIP(this._Crt, this._Ansi, this._ClientContainer);
        }
        if (!('WebSocket' in window) || navigator.userAgent.match('AppleWebKit/534.30')) {
            this._Crt.WriteLn();
            this._Crt.WriteLn('Sorry, but your browser doesn\'t support the WebSocket protocol!');
            this._Crt.WriteLn();
            this._Crt.WriteLn('WebSockets are how fTelnet connects to the remote server, so without them that');
            this._Crt.WriteLn('means you won\'t be able to connect anywhere.');
            this._Crt.WriteLn();
            this._Crt.WriteLn('If you can, try upgrading your web browser.  If that\'s not an option (ie you\'re');
            this._Crt.WriteLn('already running the latest version your platform supports, like IE 8 on');
            this._Crt.WriteLn('Windows XP), then try switching to a different web browser.');
            this._Crt.WriteLn();
            this._Crt.WriteLn('Feel free to contact me (http://www.ftelnet.ca/contact/) if you think you\'re');
            this._Crt.WriteLn('seeing this message in error, and I\'ll look into it.  Be sure to let me know');
            this._Crt.WriteLn('what browser you use, as well as which version it is.');
            console.log('fTelnet Error: WebSocket not supported');
        }
        this._FocusWarningBar = document.createElement('div');
        this._FocusWarningBar.className = 'fTelnetFocusWarning';
        this._FocusWarningBar.innerHTML = '*** CLICK HERE TO ENABLE KEYBOARD INPUT ***';
        this._FocusWarningBar.style.display = 'none';
        this._fTelnetContainer.appendChild(this._FocusWarningBar);
        this._ScrollbackBar = document.createElement('div');
        this._ScrollbackBar.className = 'fTelnetScrollback';
        if (this._UseModernScrollback) {
            this._ScrollbackBar.innerHTML = 'SCROLLBACK: Scroll back down to the bottom to exit scrollback mode';
        }
        else {
            var ScrollbackLabel = document.createElement('span');
            ScrollbackLabel.innerHTML = 'SCROLLBACK:';
            this._ScrollbackBar.appendChild(ScrollbackLabel);
            var ScrollbackLineUp = document.createElement('a');
            ScrollbackLineUp.href = '#';
            ScrollbackLineUp.innerHTML = 'Line Up';
            ScrollbackLineUp.addEventListener('click', function (e) { _this._Crt.PushKeyDown(KeyboardKeys.UP, KeyboardKeys.UP, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackLineUp);
            var ScrollbackLineDown = document.createElement('a');
            ScrollbackLineDown.href = '#';
            ScrollbackLineDown.innerHTML = 'Line Down';
            ScrollbackLineDown.addEventListener('click', function (e) { _this._Crt.PushKeyDown(KeyboardKeys.DOWN, KeyboardKeys.DOWN, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackLineDown);
            var ScrollbackPageUp = document.createElement('a');
            ScrollbackPageUp.href = '#';
            ScrollbackPageUp.innerHTML = 'Page Up';
            ScrollbackPageUp.addEventListener('click', function (e) { _this._Crt.PushKeyDown(KeyboardKeys.PAGE_UP, KeyboardKeys.PAGE_UP, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackPageUp);
            var ScrollbackPageDown = document.createElement('a');
            ScrollbackPageDown.href = '#';
            ScrollbackPageDown.innerHTML = 'Page Down';
            ScrollbackPageDown.addEventListener('click', function (e) { _this._Crt.PushKeyDown(KeyboardKeys.PAGE_DOWN, KeyboardKeys.PAGE_DOWN, false, false, false); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackPageDown);
            var ScrollbackExit = document.createElement('a');
            ScrollbackExit.href = '#';
            ScrollbackExit.innerHTML = 'Exit';
            ScrollbackExit.addEventListener('click', function (e) { _this.ExitScrollback(); e.preventDefault(); return false; });
            this._ScrollbackBar.appendChild(ScrollbackExit);
        }
        this._ScrollbackBar.style.display = 'none';
        this._fTelnetContainer.appendChild(this._ScrollbackBar);
        this._StatusBar = document.createElement('div');
        this._StatusBar.className = 'fTelnetStatusBar';
        this._fTelnetContainer.appendChild(this._StatusBar);
        this._MenuButton = document.createElement('a');
        this._MenuButton.className = 'fTelnetMenuButton';
        this._MenuButton.href = '#';
        this._MenuButton.innerHTML = 'Menu';
        this._MenuButton.addEventListener('click', function (e) { _this.OnMenuButtonClick(); e.preventDefault(); return false; }, false);
        this._StatusBar.appendChild(this._MenuButton);
        this._ConnectButton = document.createElement('a');
        this._ConnectButton.className = 'fTelnetConnectButton';
        this._ConnectButton.href = '#';
        this._ConnectButton.innerHTML = 'Connect';
        this._ConnectButton.addEventListener('click', function (e) { _this.Connect(); e.preventDefault(); return false; }, false);
        this._StatusBar.appendChild(this._ConnectButton);
        this._StatusBarLabel = document.createElement('span');
        this._StatusBarLabel.className = 'fTelnetStatusBarLabel';
        this._StatusBarLabel.innerHTML = 'Not connected';
        this._StatusBar.appendChild(this._StatusBarLabel);
        this._MenuButtons = document.createElement('div');
        this._MenuButtons.className = 'fTelnetMenuButtons';
        var MenuButtonsTable = document.createElement('table');
        var MenuButtonsRow1 = document.createElement('tr');
        var MenuButtonsRow1Cell1 = document.createElement('td');
        var MenuButtonsConnect = document.createElement('a');
        MenuButtonsConnect.href = '#';
        MenuButtonsConnect.innerHTML = 'Connect';
        MenuButtonsConnect.addEventListener('click', function (me) { _this.Connect(); me.preventDefault(); return false; });
        MenuButtonsRow1Cell1.appendChild(MenuButtonsConnect);
        MenuButtonsRow1.appendChild(MenuButtonsRow1Cell1);
        var MenuButtonsRow1Cell2 = document.createElement('td');
        var MenuButtonsDisconnect = document.createElement('a');
        MenuButtonsDisconnect.href = '#';
        MenuButtonsDisconnect.innerHTML = 'Disconnect';
        MenuButtonsDisconnect.addEventListener('click', function (me) { _this.Disconnect(true); me.preventDefault(); return false; });
        MenuButtonsRow1Cell2.appendChild(MenuButtonsDisconnect);
        MenuButtonsRow1.appendChild(MenuButtonsRow1Cell2);
        MenuButtonsTable.appendChild(MenuButtonsRow1);
        if (!DetectMobileBrowser.IsMobile) {
            var MenuButtonsRow2 = document.createElement('tr');
            var MenuButtonsRow2Cell1 = document.createElement('td');
            var MenuButtonsCopy = document.createElement('a');
            MenuButtonsCopy.href = '#';
            MenuButtonsCopy.innerHTML = 'Copy';
            MenuButtonsCopy.addEventListener('click', function (me) { _this.ClipboardCopy(); me.preventDefault(); return false; });
            MenuButtonsRow2Cell1.appendChild(MenuButtonsCopy);
            MenuButtonsRow2.appendChild(MenuButtonsRow2Cell1);
            var MenuButtonsRow2Cell2 = document.createElement('td');
            var MenuButtonsPaste = document.createElement('a');
            MenuButtonsPaste.href = '#';
            MenuButtonsPaste.innerHTML = 'Paste';
            MenuButtonsPaste.addEventListener('click', function (me) { _this.ClipboardPaste(); me.preventDefault(); return false; });
            MenuButtonsRow2Cell2.appendChild(MenuButtonsPaste);
            MenuButtonsRow2.appendChild(MenuButtonsRow2Cell2);
            MenuButtonsTable.appendChild(MenuButtonsRow2);
        }
        if ((typeof YModemReceive !== 'undefined') && (typeof YModemSend !== 'undefined')) {
            var MenuButtonsRow3 = document.createElement('tr');
            var MenuButtonsRow3Cell1 = document.createElement('td');
            var MenuButtonsUpload = document.createElement('a');
            MenuButtonsUpload.href = '#';
            MenuButtonsUpload.innerHTML = 'Upload';
            MenuButtonsUpload.addEventListener('click', function (me) { _this.Upload(); me.preventDefault(); return false; });
            MenuButtonsRow3Cell1.appendChild(MenuButtonsUpload);
            MenuButtonsRow3.appendChild(MenuButtonsRow3Cell1);
            var MenuButtonsRow3Cell2 = document.createElement('td');
            var MenuButtonsDownload = document.createElement('a');
            MenuButtonsDownload.href = '#';
            MenuButtonsDownload.innerHTML = 'Download';
            MenuButtonsDownload.addEventListener('click', function (me) { _this.Download(); me.preventDefault(); return false; });
            MenuButtonsRow3Cell2.appendChild(MenuButtonsDownload);
            MenuButtonsRow3.appendChild(MenuButtonsRow3Cell2);
            MenuButtonsTable.appendChild(MenuButtonsRow3);
        }
        if (!window.cordova) {
            var MenuButtonsRow4 = document.createElement('tr');
            var MenuButtonsRow4Cell1 = document.createElement('td');
            var MenuButtonsKeyboard = document.createElement('a');
            MenuButtonsKeyboard.href = '#';
            MenuButtonsKeyboard.innerHTML = 'Keyboard';
            MenuButtonsKeyboard.addEventListener('click', function (me) { _this.VirtualKeyboardVisible = !_this.VirtualKeyboardVisible; me.preventDefault(); return false; });
            MenuButtonsRow4Cell1.appendChild(MenuButtonsKeyboard);
            MenuButtonsRow4.appendChild(MenuButtonsRow4Cell1);
            var MenuButtonsRow4Cell2 = document.createElement('td');
            var MenuButtonsFullScreen = document.createElement('a');
            MenuButtonsFullScreen.href = '#';
            MenuButtonsFullScreen.innerHTML = 'Full&nbsp;Screen';
            MenuButtonsFullScreen.addEventListener('click', function (me) { _this.FullScreenToggle(); me.preventDefault(); return false; });
            MenuButtonsRow4Cell2.appendChild(MenuButtonsFullScreen);
            MenuButtonsRow4.appendChild(MenuButtonsRow4Cell2);
            MenuButtonsTable.appendChild(MenuButtonsRow4);
        }
        if (!this._UseModernScrollback) {
            var MenuButtonsRow5 = document.createElement('tr');
            var MenuButtonsRow5Cell1 = document.createElement('td');
            MenuButtonsRow5Cell1.colSpan = 2;
            var MenuButtonsScrollback = document.createElement('a');
            MenuButtonsScrollback.href = '#';
            MenuButtonsScrollback.innerHTML = 'View Scrollback Buffer';
            MenuButtonsScrollback.addEventListener('click', function (me) { _this.EnterScrollback(); me.preventDefault(); return false; });
            MenuButtonsRow5Cell1.appendChild(MenuButtonsScrollback);
            MenuButtonsRow5.appendChild(MenuButtonsRow5Cell1);
            MenuButtonsTable.appendChild(MenuButtonsRow5);
        }
        this._MenuButtons.appendChild(MenuButtonsTable);
        this._MenuButtons.style.display = 'none';
        this._MenuButtons.style.zIndex = '150';
        this._fTelnetContainer.appendChild(this._MenuButtons);
        this._VirtualKeyboard = new VirtualKeyboard(this._Crt, this._fTelnetContainer);
        this._VirtualKeyboard.VibrateDurationInMilliseconds = this._Options.VirtualKeyboardVibrateDuration;
        this._VirtualKeyboard.Visible = this._Options.VirtualKeyboardVisible;
        this.OnCrtScreenSizeChanged();
        if (this._Options.Emulation === 'RIP') {
            if (this._Options.SplashScreen === '') {
                this._RIP.Parse(atob('G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bWZUZWxuZXQgLS0gVGVsbmV0IGZvciB0aGUgV2ViICAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm1Db3B5cmlnaHQgKEMpIDIwMDkt'));
                this._RIP.Parse(new Date().getFullYear().toString());
                this._RIP.Parse(atob('IFImTSBTb2Z0d2FyZS4gIEFsbCBSaWdodHMgUmVzZXJ2ZWQNChtbMDszNG3ExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE'));
            }
            else {
                this._RIP.Parse(atob(this._Options.SplashScreen));
            }
        }
        else {
            if (this._Options.SplashScreen === '') {
                this._Ansi.Write(atob('G1swbRtbMkobWzA7MEgbWzE7NDQ7MzRt2sTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEG1swOzQ0OzMwbb8bWzBtDQobWzE7NDQ7MzRtsyAgG1szN21XZWxjb21lISAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzA7NDQ7MzBtsxtbMG0NChtbMTs0NDszNG3AG1swOzQ0OzMwbcTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE2RtbMG0NCg0KG1sxbSAbWzBtIBtbMTs0NDszNG3axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzA7NDQ7MzBtvxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMzBt29vb29vb29vb29vb29vb29vb29vb2xtbMzRt29vb29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29vb29vb29vb29vb29vb29vb29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vb29sbWzFt29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb29vbG1sxbdvb29sbWzBt29sbWzE7MzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29vb2xtbMG3b29vb29vb2xtbMW3b29vbG1swbdvbG1sxbdvbG1szMG3b2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbMG0NCiAgG1sxOzQ0OzM0bbMbWzA7MzRt29vb2xtbMTszMG3b29vbG1swbdvb29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29sbWzMwbdvbG1swOzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1swbQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvb29sbWzBt29vb2xtbMW3b29vbG1swbdvbG1sxbdvb29vb2xtbMzBt29sbWzA7MzBt29sbWzM0bdvb29sbWzQ0OzMwbbMbWzQwOzM3bQ0KICAbWzE7NDQ7MzRtsxtbMDszNG3b29vbG1sxOzMwbdvbG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb2xtbMDszMG3b2xtbMzRt29vb2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1swOzM0bdvb29sbWzE7MzBt29sbWzBt29vb29vb29vb29vb29vb29vb29sbWzMwbdvbG1szNG3b29vbG1s0NDszMG2zG1s0MDszN20NCiAgG1sxOzQ0OzM0bbMbWzA7MzBt29vb29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbNDA7MzdtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN23axMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMQbWzMwbb8bWzBtDQogIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29sbWzA7MzBt29vb29vb29vb2xtbMW3b2xtbMDszMG3b2xtbNDRtsxtbNDA7MzdtIBtbMzRtIBtbMTs0NzszN22zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1s0MDszMG3b2xtbMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szMG3b2xtbNDRtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAbWzM0bWZUZWxuZXQgLS0gVGVsbmV0IGZvciB0aGUgV2ViICAgICAgG1szMG2zG1swbQ0KG1sxbSAbWzBtIBtbMTs0NDszNG2zG1swOzMwbdvbG1sxbdvb29vb29vb29vb29vb29vb29vb29vb2xtbMDszMG3b29vb29sbWzQ0bbMbWzBtIBtbMzRtIBtbMTs0NzszN22zICAgICAbWzA7NDc7MzRtV2ViIGJhc2VkIEJCUyB0ZXJtaW5hbCBjbGllbnQgICAgG1sxOzMwbbMbWzBtDQogIBtbMTs0NDszNG2zG1swOzM0bdvbG1szMG3b29vb29vb29vb29vb29vb29vb29vb29vb29vbG1szNG3b2xtbNDQ7MzBtsxtbMG0gG1szNG0gG1sxOzQ3OzM3bbMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBtbMzBtsxtbMG0NCiAgG1sxOzQ0OzM0bcAbWzA7NDQ7MzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbSAbWzM0bSAbWzE7NDc7MzdtwBtbMzBtxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTZG1swbQ0KDQobWzExQxtbMTszMm0bWzE7MjU1OzE3ODsxMjd0Q29weXJpZ2h0IChDKSAyMDA5LQ=='));
                this._Ansi.Write(new Date().getFullYear().toString());
                this._Ansi.Write(atob('IFImTSBTb2Z0d2FyZS4gIEFsbCBSaWdodHMgUmVzZXJ2ZWQNChtbMDszNG3ExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTE'));
            }
            else {
                this._Ansi.Write(atob(this._Options.SplashScreen));
            }
        }
        this._Timer = setInterval(function () { _this.OnTimer(); }, 250);
        this._UploadInput = document.createElement('input');
        this._UploadInput.type = 'file';
        this._UploadInput.className = 'fTelnetUpload';
        this._UploadInput.onchange = function () { _this.OnUploadFileSelected(); };
        this._UploadInput.style.display = 'none';
        this._fTelnetContainer.appendChild(this._UploadInput);
    }
    fTelnetClient.prototype.ClipboardCopy = function () {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        alert('Click and drag your mouse over the text you want to copy');
    };
    fTelnetClient.prototype.ClipboardPaste = function () {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        var Text = ClipboardHelper.GetData();
        for (var i = 0; i < Text.length; i++) {
            var B = Text.charCodeAt(i);
            if ((B === 13) || (B === 32)) {
                this._Crt.PushKeyDown(0, B, false, false, false);
            }
            else if ((B >= 33) && (B <= 126)) {
                this._Crt.PushKeyPress(B, 0, false, false, false);
            }
        }
    };
    fTelnetClient.prototype.Connect = function () {
        var _this = this;
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) {
            return;
        }
        switch (this._Options.ConnectionType) {
            case 'rlogin':
                this._Connection = new RLoginConnection();
                break;
            case 'tcp':
                this._Connection = new WebSocketConnection();
                break;
            default:
                this._Connection = new TelnetConnection(this._Crt);
                this._Connection.LocalEcho = this._Options.LocalEcho;
                this._Connection.onlocalecho.on(function (value) { _this.OnConnectionLocalEcho(value); });
                this._Connection.SendLocation = this._Options.SendLocation;
                break;
        }
        this._Connection.onclose.on(function () { _this.OnConnectionClose(); });
        this._Connection.onconnect.on(function () { _this.OnConnectionConnect(); });
        this._Connection.ondata.on(function () { _this.OnConnectionData(); });
        this._Connection.onioerror.on(function () { _this.OnConnectionIOError(); });
        this._Connection.onsecurityerror.on(function () { _this.OnConnectionSecurityError(); });
        if (this._Options.Emulation === 'RIP') {
            this._RIP.ResetWindows();
        }
        else {
            this._Crt.NormVideo();
            this._Crt.ClrScr();
        }
        if (this._Options.ProxyHostname === '') {
            this._ConnectButton.style.display = 'none';
            this._StatusBarLabel.innerHTML = 'Connecting to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
            this._Connection.connect(this._Options.Hostname, this._Options.Port, this._Options.WebSocketUrlPath, this._Options.ForceWss);
        }
        else {
            this._ConnectButton.style.display = 'none';
            this._StatusBarLabel.innerHTML = 'Connecting to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
            this._Connection.connect(this._Options.Hostname, this._Options.Port, '', this._Options.ForceWss, this._Options.ProxyHostname, this._Options.ProxyPort, this._Options.ProxyPortSecure);
        }
    };
    Object.defineProperty(fTelnetClient.prototype, "Connected", {
        get: function () {
            if (typeof this._Connection === 'undefined') {
                return false;
            }
            return this._Connection.connected;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(fTelnetClient.prototype, "Connection", {
        get: function () {
            return this._Connection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(fTelnetClient.prototype, "Crt", {
        get: function () {
            return this._Crt;
        },
        enumerable: true,
        configurable: true
    });
    fTelnetClient.prototype.Disconnect = function (prompt) {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (typeof this._Connection === 'undefined') {
            return true;
        }
        if (!this._Connection.connected) {
            return true;
        }
        if (!prompt || confirm('Are you sure you want to disconnect?')) {
            this._Connection.onclose.off();
            this._Connection.onconnect.off();
            this._Connection.ondata.off();
            this._Connection.onioerror.off();
            this._Connection.onlocalecho.off();
            this._Connection.onsecurityerror.off();
            this._Connection.close();
            delete this._Connection;
            this.OnConnectionClose();
            return true;
        }
        return false;
    };
    fTelnetClient.prototype.Download = function () {
        var _this = this;
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._YModemReceive = new YModemReceive(this._Crt, this._Connection);
        if (typeof this._Timer !== 'undefined') {
            clearInterval(this._Timer);
            delete this._Timer;
        }
        this._YModemReceive.ontransfercomplete.on(function () { _this.OnDownloadComplete(); });
        this._YModemReceive.Download();
    };
    fTelnetClient.prototype.EnterScrollback = function () {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (typeof this._ScrollbackBar !== 'undefined') {
            if (this._ScrollbackBar.style.display = 'none') {
                this._Crt.EnterScrollback();
                this._ScrollbackBar.style.display = 'block';
            }
        }
    };
    fTelnetClient.prototype.ExitScrollback = function () {
        if (typeof this._ScrollbackBar !== 'undefined') {
            if (this._ScrollbackBar.style.display = 'block') {
                this._Crt.ExitScrollback();
                this._ScrollbackBar.style.display = 'none';
            }
        }
    };
    fTelnetClient.prototype.FullScreenToggle = function () {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (this._fTelnetContainer.requestFullscreen) {
                this._fTelnetContainer.requestFullscreen();
            }
            else if (this._fTelnetContainer.msRequestFullscreen) {
                this._fTelnetContainer.msRequestFullscreen();
            }
            else if (this._fTelnetContainer.mozRequestFullScreen) {
                this._fTelnetContainer.mozRequestFullScreen();
            }
            else if (this._fTelnetContainer.webkitRequestFullscreen) {
                this._fTelnetContainer.webkitRequestFullscreen();
            }
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };
    fTelnetClient.prototype.OnAnsiESC0c = function () {
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._Connection.writeString('\x1B[?50;86;84;88c');
    };
    fTelnetClient.prototype.OnAnsiESC5n = function () {
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._Connection.writeString('\x1B[0n');
    };
    fTelnetClient.prototype.OnAnsiESC6n = function () {
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._Connection.writeString(this._Ansi.CursorPosition());
    };
    fTelnetClient.prototype.OnAnsiESC255n = function () {
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._Connection.writeString(this._Ansi.CursorPosition(this._Crt.WindCols, this._Crt.WindRows));
    };
    fTelnetClient.prototype.OnAnsiESCQ = function (font) {
        if (this._Options.Emulation !== 'RIP') {
            this._Crt.SetFont(font);
        }
    };
    fTelnetClient.prototype.OnAnsiRIPDetect = function () {
        if (this._Options.Emulation === 'RIP') {
            if (typeof this._Connection === 'undefined') {
                return;
            }
            if (!this._Connection.connected) {
                return;
            }
            this._Connection.writeString('RIPSCRIP015400');
        }
    };
    fTelnetClient.prototype.OnAnsiRIPDisable = function () {
    };
    fTelnetClient.prototype.OnAnsiRIPEnable = function () {
    };
    fTelnetClient.prototype.OnConnectionClose = function () {
        this._ConnectButton.innerHTML = 'Reconnect';
        this._ConnectButton.style.display = 'inline';
        this._StatusBarLabel.innerHTML = 'Disconnected from ' + this._Options.Hostname + ':' + this._Options.Port;
        this._StatusBar.style.backgroundColor = 'red';
        this._ClientContainer.style.opacity = '0.5';
    };
    fTelnetClient.prototype.OnConnectionConnect = function () {
        this._Crt.ClrScr();
        if (this._Options.ProxyHostname === '') {
            this._StatusBarLabel.innerHTML = 'Connected to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
        }
        else {
            this._StatusBarLabel.innerHTML = 'Connected to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'blue';
            this._ClientContainer.style.opacity = '1.0';
        }
        if (this._Options.ConnectionType === 'rlogin') {
            var TerminalType = this._Options.RLoginTerminalType;
            if (TerminalType === '') {
                TerminalType = this._Options.Emulation + '/' + this._Options.BitsPerSecond;
            }
            if (typeof this._Connection === 'undefined') {
                return;
            }
            if (!this._Connection.connected) {
                return;
            }
            this._Connection.writeString(String.fromCharCode(0) + this._Options.RLoginClientUsername + String.fromCharCode(0) + this._Options.RLoginServerUsername + String.fromCharCode(0) + TerminalType + String.fromCharCode(0));
            this._Connection.flush();
        }
    };
    fTelnetClient.prototype.OnConnectionData = function () {
        var _this = this;
        if (typeof this._Timer !== 'undefined') {
            if (typeof this._Connection !== 'undefined') {
                var MSecElapsed = new Date().getTime() - this._LastTimer;
                if (MSecElapsed < 1) {
                    MSecElapsed = 1;
                }
                var BytesToRead = Math.floor(this._Options.BitsPerSecond / 8 / (1000 / MSecElapsed));
                if (BytesToRead < 1) {
                    BytesToRead = 1;
                }
                var Data = this._Connection.readString(BytesToRead);
                if (Data.length > 0) {
                    this.ondata.trigger(Data);
                    if (this._Options.Emulation === 'RIP') {
                        this._RIP.Parse(Data);
                    }
                    else {
                        this._Ansi.Write(Data);
                    }
                }
                if (this._Connection.bytesAvailable > 0) {
                    clearTimeout(this._DataTimer);
                    this._DataTimer = setTimeout(function () { _this.OnConnectionData(); }, 50);
                }
            }
        }
        this._LastTimer = new Date().getTime();
    };
    fTelnetClient.prototype.OnConnectionLocalEcho = function (value) {
        if (this._Options.NegotiateLocalEcho) {
            this._Options.LocalEcho = value;
            this._Crt.LocalEcho = value;
        }
    };
    fTelnetClient.prototype.OnConnectionIOError = function () {
        console.log('fTelnet.OnConnectionIOError');
    };
    fTelnetClient.prototype.OnConnectionSecurityError = function () {
        this._ConnectButton.innerHTML = 'Retry Connection';
        this._ConnectButton.style.display = 'inline';
        if (this._Options.ProxyHostname === '') {
            this._StatusBarLabel.innerHTML = 'Unable to connect to ' + this._Options.Hostname + ':' + this._Options.Port;
            this._StatusBar.style.backgroundColor = 'red';
            this._ClientContainer.style.opacity = '0.5';
        }
        else {
            this._StatusBarLabel.innerHTML = 'Unable to connect to ' + this._Options.Hostname + ':' + this._Options.Port + ' via ' + this._Options.ProxyHostname;
            this._StatusBar.style.backgroundColor = 'red';
            this._ClientContainer.style.opacity = '0.5';
        }
    };
    fTelnetClient.prototype.OnCrtKeyPressed = function () {
        if (typeof this._Timer !== 'undefined') {
            while (this._Crt.KeyPressed()) {
                var KPE = this._Crt.ReadKey();
                if (typeof KPE !== 'undefined') {
                    if (KPE.keyString.length > 0) {
                        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) {
                            if (KPE.keyString === '\r\n') {
                                this._Connection.writeString(this._Options.Enter);
                            }
                            else {
                                this._Connection.writeString(KPE.keyString);
                            }
                        }
                    }
                }
            }
        }
    };
    fTelnetClient.prototype.OnCrtScreenSizeChanged = function () {
        var NewWidth;
        var NewHeight;
        if (this._Options.Emulation === 'RIP') {
            NewWidth = 640;
        }
        else {
            if (this._UseModernScrollback) {
                NewWidth = this._Crt.ScreenCols * this._Crt.Font.Width + GetScrollbarWidth.Width;
                NewHeight = this._Crt.ScreenRows * this._Crt.Font.Height;
                this._ClientContainer.style.width = NewWidth + 'px';
                this._ClientContainer.style.height = NewHeight + 'px';
                this._ClientContainer.scrollTop = this._ClientContainer.scrollHeight;
            }
            else {
                NewWidth = this._Crt.ScreenCols * this._Crt.Font.Width;
            }
        }
        if (typeof this._FocusWarningBar !== 'undefined') {
            this._FocusWarningBar.style.width = NewWidth - 10 + 'px';
        }
        if (typeof this._ScrollbackBar !== 'undefined') {
            this._ScrollbackBar.style.width = NewWidth - 10 + 'px';
        }
        if (typeof this._StatusBar !== 'undefined') {
            this._StatusBar.style.width = NewWidth - 10 + 'px';
        }
        if ((document.getElementById('fTelnetScript') !== null) && (document.getElementById('fTelnetKeyboardCss') !== null)) {
            var KeyboardSizes = [960, 800, 720, 640, 560, 480, 360, 320];
            for (var i = 0; i < KeyboardSizes.length; i++) {
                if (((NewWidth >= KeyboardSizes[i]) && (KeyboardSizes[i] <= screen.width)) || (i === (KeyboardSizes.length - 1))) {
                    document.getElementById('fTelnetKeyboardCss').href = StringUtils.GetUrl('keyboard/keyboard-' + KeyboardSizes[i].toString(10) + '.min.css');
                    break;
                }
            }
        }
    };
    fTelnetClient.prototype.OnDownloadComplete = function () {
        var _this = this;
        this._Timer = setInterval(function () { _this.OnTimer(); }, 250);
    };
    fTelnetClient.prototype.OnMenuButtonClick = function () {
        this._MenuButtons.style.display = (this._MenuButtons.style.display === 'none') ? 'block' : 'none';
        this._MenuButtons.style.left = Offset.getOffset(this._MenuButton).x + this._MenuButton.clientWidth + 'px';
        this._MenuButtons.style.top = Offset.getOffset(this._MenuButton).y - this._MenuButtons.clientHeight + 'px';
    };
    fTelnetClient.prototype.OnTimer = function () {
        if ((typeof this._Connection !== 'undefined') && (this._Connection.connected)) {
            if (document.hasFocus() && !this._HasFocus) {
                this._HasFocus = true;
                this._FocusWarningBar.style.display = 'none';
            }
            else if (!document.hasFocus() && this._HasFocus) {
                this._HasFocus = false;
                this._FocusWarningBar.style.display = 'block';
            }
        }
        else {
            if (this._FocusWarningBar.style.display === 'block') {
                this._FocusWarningBar.style.display = 'none';
            }
        }
        if (this._UseModernScrollback) {
            var ScrolledUp = (this._ClientContainer.scrollHeight - this._ClientContainer.scrollTop - this._ClientContainer.clientHeight > 1);
            if (ScrolledUp && (this._ScrollbackBar.style.display === 'none')) {
                this._ScrollbackBar.style.display = 'block';
            }
            else if (!ScrolledUp && (this._ScrollbackBar.style.display === 'block')) {
                this._ScrollbackBar.style.display = 'none';
            }
        }
    };
    fTelnetClient.prototype.OnUploadComplete = function () {
        var _this = this;
        this._Timer = setInterval(function () { _this.OnTimer(); }, 250);
    };
    fTelnetClient.prototype.OnUploadFileSelected = function () {
        var _this = this;
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._YModemSend = new YModemSend(this._Crt, this._Connection);
        if (typeof this._Timer !== 'undefined') {
            clearInterval(this._Timer);
            delete this._Timer;
        }
        this._YModemSend.ontransfercomplete.on(function () { _this.OnUploadComplete(); });
        if (this._UploadInput.files !== null) {
            for (var i = 0; i < this._UploadInput.files.length; i++) {
                this.UploadFile(this._UploadInput.files[i], this._UploadInput.files.length);
            }
        }
    };
    fTelnetClient.prototype.StuffInputBuffer = function (text) {
        for (var i = 0; i < text.length; i++) {
            this._Crt.PushKeyPress(text.charCodeAt(i), 0, false, false, false);
        }
    };
    fTelnetClient.prototype.Upload = function () {
        if (typeof this._MenuButtons !== 'undefined') {
            this._MenuButtons.style.display = 'none';
        }
        if (typeof this._Connection === 'undefined') {
            return;
        }
        if (!this._Connection.connected) {
            return;
        }
        this._UploadInput.click();
    };
    fTelnetClient.prototype.UploadFile = function (file, fileCount) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function () {
            var FR = new FileRecord(file.name, file.size);
            var Buffer = reader.result;
            var Bytes = new Uint8Array(Buffer);
            for (var i = 0; i < Bytes.length; i++) {
                FR.data.writeByte(Bytes[i]);
            }
            FR.data.position = 0;
            _this._YModemSend.Upload(FR, fileCount);
        };
        reader.readAsArrayBuffer(file);
    };
    Object.defineProperty(fTelnetClient.prototype, "VirtualKeyboardVibrateDuration", {
        get: function () {
            return this._Options.VirtualKeyboardVibrateDuration;
        },
        set: function (value) {
            this._Options.VirtualKeyboardVibrateDuration = value;
            this._VirtualKeyboard.VibrateDurationInMilliseconds = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(fTelnetClient.prototype, "VirtualKeyboardVisible", {
        get: function () {
            return this._Options.VirtualKeyboardVisible;
        },
        set: function (value) {
            if (typeof this._MenuButtons !== 'undefined') {
                this._MenuButtons.style.display = 'none';
            }
            this._Options.VirtualKeyboardVisible = value;
            this._VirtualKeyboard.Visible = value;
        },
        enumerable: true,
        configurable: true
    });
    return fTelnetClient;
}());
var fTelnetOptions = (function () {
    function fTelnetOptions() {
        this.AllowModernScrollback = true;
        this.BareLFtoCRLF = false;
        this.BitsPerSecond = 57600;
        this.ConnectionType = 'telnet';
        this.Emulation = 'ansi-bbs';
        this.Enter = '\r';
        this.Font = 'CP437';
        this.ForceWss = false;
        this.Hostname = 'bbs.ftelnet.ca';
        this.LocalEcho = false;
        this.NegotiateLocalEcho = true;
        this.Port = 1123;
        this.ProxyHostname = '';
        this.ProxyPort = 1123;
        this.ProxyPortSecure = 11235;
        this.RLoginClientUsername = '';
        this.RLoginServerUsername = '';
        this.RLoginTerminalType = '';
        this.ScreenColumns = 80;
        this.ScreenRows = 25;
        this.SendLocation = true;
        this.SkipRedrawWhenSameFontSize = false;
        this.SplashScreen = '';
        this.VirtualKeyboardVibrateDuration = 25;
        this.VirtualKeyboardVisible = DetectMobileBrowser.IsMobile;
        this.WebSocketUrlPath = '';
    }
    return fTelnetOptions;
}());
//# sourceMappingURL=ftelnetclient.js.map