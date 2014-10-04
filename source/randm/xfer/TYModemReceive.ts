/*
  HtmlTerm: An HTML5 WebSocket client
  Copyright (C) 2009-2013  Rick Parrish, R&M Software

  This file is part of HtmlTerm.

  HtmlTerm is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.

  HtmlTerm is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with HtmlTerm.  If not, see <http://www.gnu.org/licenses/>.
*/
var TYModemReceive = function (ATelnet) {
    // Public events
    this.ontransfercomplete = function () { }; // Do nothing

    // Private constants
    var SOH = 0x01;
    var STX = 0x02;
    var EOT = 0x04;
    var ACK = 0x06;
    var NAK = 0x15;
    var CAN = 0x18;
    var SUB = 0x1A;
    var CAPG = "G".charCodeAt(0);

    // Private variables
    var that = this;
    var FBlink = false;
    var FLastGTime = 0;
    var FExpectingHeader = true;
    var FFile;
    var FFiles = [];
    var FNextByte = 0;
    var FShouldSendG = true;
    var FTelnet;
    var FTimer;
    var FTotalBytesReceived = 0;
    var lblFileCount;
    var lblFileName;
    var lblFileSize;
    var lblFileReceived;
    var lblTotalReceived;
    var lblStatus;
    var pbFileReceived;
    var pnlMain;

    // Private methods
    var Cancel = function (AReason) { }; // Do nothing
    var CleanUp = function (AMessage) { }; // Do nothing
    var Dispatch = function () { }; // Do nothing
    var HandleIOError = function (ioe) { }; // Do nothing
    var OnTimer = function (e) { }; // Do nothing

    Cancel = function (AReason) {
        // Send the cancel request
        try {
            FTelnet.writeByte(CAN);
            FTelnet.writeByte(CAN);
            FTelnet.writeByte(CAN);
            FTelnet.writeByte(CAN);
            FTelnet.writeByte(CAN);
            FTelnet.writeString("\b\b\b\b\b     \b\b\b\b\b"); // will auto-flush
        } catch (ioe1) {
            HandleIOError(ioe1);
            return;
        }

        // Drain the input buffer
        try {
            FTelnet.readString();
        } catch (ioe2) {
            HandleIOError(ioe2);
            return;
        }

        CleanUp("Cancelling (" + AReason + ")");
    };

    CleanUp = function (AMessage) {
        // Remove the listeners
        clearInterval(FTimer);

        // Update status label
        lblStatus.Text = "Status: " + AMessage;

        // Dispatch the event after 3 seconds
        setTimeout(Dispatch, 3000);
    };

    Dispatch = function () {
        // Remove the panel
        pnlMain.Hide();
        Crt.Blink = FBlink;
        Crt.ShowCursor();

        that.ontransfercomplete();
    };

    this.Download = function () {
        // Create our main timer
        FTimer = setInterval(OnTimer, 50);

        // Create the transfer dialog
        FBlink = Crt.Blink;
        Crt.Blink = false;
        Crt.HideCursor();
        pnlMain = new TCrtPanel(null, 10, 5, 60, 14, BorderStyle.Single, Crt.WHITE, Crt.BLUE, "YModem-G Receive Status (Hit CTRL+X to abort)", ContentAlignment.TopLeft);
        lblFileCount = new TCrtLabel(pnlMain, 2, 2, 56, "Receiving file 1", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        lblFileName = new TCrtLabel(pnlMain, 2, 4, 56, "File Name: ", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        lblFileSize = new TCrtLabel(pnlMain, 2, 5, 56, "File Size: ", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        lblFileReceived = new TCrtLabel(pnlMain, 2, 6, 56, "File Recv: ", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        pbFileReceived = new TCrtProgressBar(pnlMain, 2, 7, 56, ProgressBarStyle.Continuous);
        lblTotalReceived = new TCrtLabel(pnlMain, 2, 9, 56, "Total Recv: ", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        lblStatus = new TCrtLabel(pnlMain, 2, 11, 56, "Status: Transferring file(s)", ContentAlignment.Left, Crt.WHITE, Crt.BLUE);
    };

    this.FileAt = function (AIndex) {
        return FFiles[AIndex];
    };

    this.__defineGetter__("FileCount", function () {
        return FFiles.length;
    });

    HandleIOError = function (ioe) {
        trace("I/O Error: " + ioe);

        if (FTelnet.connected) {
            CleanUp("Unhandled I/O error");
        } else {
            CleanUp("Connection to server lost");
        }
    };

    OnTimer = function (e) {
        // Check for abort
        while (Crt.KeyPressed()) {
            var KPE = Crt.ReadKey();
            if ((KPE !== null) && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === CAN)) {
                Cancel("User requested abort");
            }
        }

        // Keep going until we don't have any more data to read
        while (true) {
            // Check if we've read a byte previously
            if (FNextByte === 0) {
                // Nope, try to read one now
                if (FTelnet.bytesAvailable === 0) {
                    // No data -- check if we should send a G
                    if (FShouldSendG && ((new Date()) - FLastGTime > 3000)) {
                        // Send a G after 3 quiet seconds	
                        try {
                            FTelnet.writeByte(CAPG);
                            FTelnet.flush();
                        } catch (ioe1) {
                            HandleIOError(ioe1);
                            return;
                        }

                        // Reset last G time so we don't spam G's
                        FLastGTime = new Date();
                    }

                    return;
                } else {
                    // Data available, so read the next byte
                    try {
                        FNextByte = FTelnet.readUnsignedByte();
                    } catch (ioe2) {
                        HandleIOError(ioe2);
                        return;
                    }
                }
            }

            // See what to do
            switch (FNextByte) {
                case CAN:
                    // Sender requested cancellation
                    CleanUp("Sender requested abort");

                    break;
                case SOH:
                case STX:
                    // File transfer is happening, don't send a G on timeout
                    FShouldSendG = false;

                    var BlockSize = (FNextByte === STX) ? 1024 : 128;

                    // Make sure we have enough data to read a full block
                    if (FTelnet.bytesAvailable < (1 + 1 + BlockSize + 1 + 1)) {
                        return;
                    }

                    // Reset NextByte variable so we read in a new byte next loop
                    FNextByte = 0;

                    // Get block numbers
                    var InBlock = FTelnet.readUnsignedByte();
                    var InBlockInverse = FTelnet.readUnsignedByte();

                    // Validate block numbers
                    if (InBlockInverse !== (255 - InBlock)) {
                        Cancel("Bad block #: " + InBlockInverse.toString() + " !== 255-" + InBlock.toString());
                        return;
                    }

                    // Read data block
                    var Packet = new ByteArray();
                    FTelnet.readBytes(Packet, 0, BlockSize);

                    // Validate CRC
                    var InCRC = FTelnet.readUnsignedShort();
                    var OurCRC = CRC.Calculate16(Packet);
                    if (InCRC !== OurCRC) {
                        Cancel("Bad CRC: " + InCRC.toString() + " !== " + OurCRC.toString());
                        return;
                    }

                    // Reading the header?
                    if (FExpectingHeader) {
                        // Make sure it's block 0
                        if (InBlock !== 0) {
                            Cancel("Expecting header got block " + InBlock.toString());
                            return;
                        }

                        // It is, so mark that we don't want it next packet 0
                        FExpectingHeader = false;

                        // Get the filename
                        var FileName = "";
                        var B = Packet.readUnsignedByte();
                        while ((B !== 0) && (Packet.bytesAvailable > 0)) {
                            FileName += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }

                        // Get the file size
                        var Temp = "";
                        var FileSize = 0;
                        B = Packet.readUnsignedByte();
                        while ((B >= 48) && (B <= 57) && (Packet.bytesAvailable > 0)) {
                            Temp += String.fromCharCode(B);
                            B = Packet.readUnsignedByte();
                        }
                        FileSize = parseInt(Temp, 10);

                        // Check for blank filename (means batch is complete)
                        if (FileName.length === 0) {
                            CleanUp("File(s) successfully received!");
                            return;
                        }

                        // Check for blank file size (we don't like this case!)
                        if (isNaN(FileSize) || (FileSize === 0)) {
                            Cancel("File Size missing from header block");
                            return;
                        }

                        // Header is good, setup a new file record
                        FFile = new TFileRecord(FileName, FileSize);
                        lblFileCount.Text = "Receiving file " + (FFiles.length + 1).toString();
                        lblFileName.Text = "File Name: " + FileName;
                        lblFileSize.Text = "File Size: " + StringUtils.AddCommas(FileSize) + " bytes";
                        lblFileReceived.Text = "File Recv: 0 bytes";
                        pbFileReceived.Value = 0;
                        pbFileReceived.Maximum = FileSize;

                        // Send a G to request file start
                        try {
                            FTelnet.writeByte(CAPG);
                            FTelnet.flush();
                        } catch (ioe3) {
                            HandleIOError(ioe3);
                            return;
                        }
                    } else {
                        // Add bytes to byte array (don't exceed desired file size though)
                        var BytesToWrite = Math.min(BlockSize, FFile.size - FFile.data.length);
                        FFile.data.writeBytes(Packet, 0, BytesToWrite);
                        FTotalBytesReceived += BytesToWrite;

                        lblFileReceived.Text = "File Recv: " + StringUtils.AddCommas(FFile.data.length) + " bytes";
                        pbFileReceived.Value = FFile.data.length;
                        lblTotalReceived.Text = "Total Recv: " + StringUtils.AddCommas(FTotalBytesReceived) + " bytes";
                    }

                    break;
                case EOT:
                    // File transfer is over, send a G on timeout
                    FShouldSendG = true;

                    // Acknowledge EOT and ask for next file
                    try {
                        FTelnet.writeByte(ACK);
                        FTelnet.writeByte(CAPG);
                        FTelnet.flush();
                    } catch (ioe4) {
                        HandleIOError(ioe4);
                        return;
                    }

                    // Reset NextByte variable so we read in a new byte next loop
                    FNextByte = 0;

                    // Reset variables for next transfer
                    FExpectingHeader = true;
                    FFiles.push(FFile);

                    break;
                default:
                    // Didn't expect this, so abort
                    Cancel("Unexpected byte: " + FNextByte.toString());
                    return;
            }
        }
    };

    // Constructor
    FTelnet = ATelnet;
};