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
var TYModemSend = function (ATelnet) {
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

    var ssWaitingForHeaderRequest = 0;
    var ssWaitingForHeaderAck = 1;
    var ssWaitingForFileRequest = 2;
    var ssSendingData = 3;
    var ssWaitingForFileAck = 4;

    // Private variables
    var that = this;
    var FBlock = 0;
    var FBlink = false;
    var FEOTCount = 0;
    var FFile;
    var FFileBytesSent = 0;
    var FFileCount = 0;
    var FFiles = [];
    var FState = ssWaitingForHeaderRequest;
    var FTelnet;
    var FTimer;
    var FTotalBytes = 0;
    var FTotalBytesSent = 0;
    var lblFileCount;
    var lblFileName;
    var lblFileSize;
    var lblFileSent;
    var lblTotalSize;
    var lblTotalSent;
    var lblStatus;
    var pbFileSent;
    var pbTotalSent;
    var pnlMain;

    // Private methods
    var Cancel = function (AReason) { }; // Do nothing
    var CleanUp = function (AMessage) { }; // Do nothing
    var Dispatch = function () { }; // Do nothing
    var HandleIOError = function (ioe) { }; // Do nothing
    var OnTimer = function (e) { }; // Do nothing
    var SendDataBlocks = function (ABlocks) { }; // Do nothing
    var SendEmptyHeaderBlock = function () { }; // Do nothing
    var SendEOT = function () { }; // Do nothing
    var SendHeaderBlock = function () { }; // Do nothing

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

        var B = 0;

        // Break if no data is waiting (unless we're in the ssSendingData state)
        if ((FState !== ssSendingData) && (FTelnet.bytesAvailable === 0)) {
            return;
        }

        // Determine what to do
        switch (FState) {
            case ssWaitingForHeaderRequest:
                // Check for G
                try {
                    B = FTelnet.readUnsignedByte();
                } catch (ioe1) {
                    HandleIOError(ioe1);
                    return;
                }

                // Make sure we got the G and not something else
                if (B !== CAPG) {
                    Cancel("Expecting G got " + B.toString() + " (State=" + FState + ")");
                    return;
                }

                // Drain the input buffer so that we're synchronized (Receiver may have sent multiple G's while we were browsing for the file)
                try {
                    FTelnet.readString();
                } catch (ioe2) {
                    HandleIOError(ioe2);
                    return;
                }

                // Do we still have files in the array?
                if (FFiles.length === 0) {
                    // Nope, let the other end know we're done
                    SendEmptyHeaderBlock();
                    CleanUp("File(s) successfully sent!");
                    return;
                }

                // Load the next file
                FFile = FFiles.shift();
                lblFileCount.Text = "Sending file " + (FFileCount - FFiles.length).toString() + " of " + FFileCount.toString();
                lblFileName.Text = "File Name: " + FFile.name;
                lblFileSize.Text = "File Size: " + StringUtils.AddCommas(FFile.size) + " bytes";
                lblFileSent.Text = "File Sent: 0 bytes";
                pbFileSent.Value = 0;
                pbFileSent.Maximum = FFile.size;

                // Send the header block
                SendHeaderBlock();

                // Reset variables for the new file transfer
                FBlock = 1;
                FEOTCount = 0;
                FFileBytesSent = 0;

                // Move to next state
                FState = ssWaitingForHeaderAck;
                return;

            case ssWaitingForHeaderAck:
                // Check for ACK or G
                try {
                    B = FTelnet.readUnsignedByte();
                } catch (ioe3) {
                    HandleIOError(ioe3);
                    return;
                }

                // Make sure we got the ACK or G and not something else
                if ((B !== ACK) && (B !== CAPG)) {
                    Cancel("Expecting ACK/G got " + B.toString() + " (State=" + FState + ")");
                    return;
                }

                if (B === ACK) {
                    // Move to next state
                    FState = ssWaitingForFileRequest;
                } else if (B === CAPG) {
                    // Async PRO doesn't ACK the header packet, so we can only assume this G is a request for the file to start, not for a re-send of the header
                    // Move to next state
                    FState = ssSendingData;
                }
                return;

            case ssWaitingForFileRequest:
                // Check for G
                try {
                    B = FTelnet.readUnsignedByte();
                } catch (ioe4) {
                    HandleIOError(ioe4);
                    return;
                }

                // Make sure we got the G and not something else
                if (B !== CAPG) {
                    Cancel("Expecting G got " + B.toString() + " (State=" + FState + ")");
                    return;
                }

                // Move to next state
                FState = ssSendingData;
                return;

            case ssSendingData:
                if (SendDataBlocks(16)) {
                    // SendDataBlocks returns true when the whole file has been sent
                    FState = ssWaitingForFileAck;
                }
                return;

            case ssWaitingForFileAck:
                // Check for ACK
                try {
                    B = FTelnet.readUnsignedByte();
                } catch (ioe5) {
                    HandleIOError(ioe5);
                    return;
                }

                // Make sure we got the ACK (or NAK) and not something else
                if ((B !== ACK) && (B !== NAK)) {
                    Cancel("Expecting (N)ACK got " + B.toString() + " (State=" + FState + ")");
                    return;
                }

                // Move to next state
                if (B === ACK) {
                    // Waiting for them to request the next header
                    FState = ssWaitingForHeaderRequest;
                }
                else if (B === NAK) {
                    // Re-send the EOT
                    SendEOT();
                }
                return;
        }
    };

    SendDataBlocks = function (ABlocks) {
        // Loop ABlocks times for ABlocks k per timer event
        var loop;
        for (loop = 0; loop < ABlocks; loop++) {
            // Determine how many bytes to read (max 1024 per block)
            var BytesToRead = Math.min(1024, FFile.data.bytesAvailable);

            // Check how many bytes are left
            if (BytesToRead === 0) {
                // No more bytes left, send the EOT
                SendEOT();
                return true;
            }
            else {
                // Read the bytes from the file
                var Packet = new ByteArray();
                FFile.data.readBytes(Packet, 0, BytesToRead);

                // Append SUB bytes to pad to 1024, if necessary
                if (Packet.length < 1024) {
                    Packet.position = Packet.length;
                    while (Packet.length < 1024) {
                        Packet.writeByte(SUB);
                    }
                    Packet.position = 0;
                }

                // Send the block
                try {
                    FTelnet.writeByte(STX);
                    FTelnet.writeByte(FBlock % 256);
                    FTelnet.writeByte(255 - (FBlock % 256));
                    FTelnet.writeBytes(Packet);
                    FTelnet.writeShort(CRC.Calculate16(Packet));
                    FTelnet.flush();
                } catch (ioe) {
                    HandleIOError(ioe);
                    return false;
                }

                // Increment counters
                FBlock++;
                FFileBytesSent += BytesToRead;
                FTotalBytesSent += BytesToRead;

                // Update labels
                lblFileSent.Text = "File Sent: " + StringUtils.AddCommas(FFileBytesSent) + " bytes";
                pbFileSent.StepBy(BytesToRead);
                lblTotalSent.Text = "Total Sent: " + StringUtils.AddCommas(FTotalBytesSent) + " bytes";
                pbTotalSent.StepBy(BytesToRead);
            }
        }

        // Didn't finish the file yet
        return false;
    };

    SendEmptyHeaderBlock = function () {
        var Packet = new ByteArray();

        // Add 128 null bytes
        var i;
        for (i = 0; i < 128; i++) {
            Packet.writeByte(0);
        }

        try {
            FTelnet.writeByte(SOH);
            FTelnet.writeByte(0);
            FTelnet.writeByte(255);
            FTelnet.writeBytes(Packet);
            FTelnet.writeShort(CRC.Calculate16(Packet));
            FTelnet.flush();
        } catch (ioe) {
            HandleIOError(ioe);
            return;
        }
    };

    SendEOT = function () {
        try {
            FTelnet.writeByte(EOT);
            FTelnet.flush();
        } catch (ioe) {
            HandleIOError(ioe);
            return;
        }
        FEOTCount++;
    };

    SendHeaderBlock = function () {
        var i = 0;
        var Packet = new ByteArray();

        // Add filename to packet
        for (i = 0; i < FFile.name.length; i++) {
            Packet.writeByte(FFile.name.charCodeAt(i));
        }

        // Add null separator
        Packet.writeByte(0);

        // Add file size to packet (as string)
        var Size = FFile.size.toString();
        for (i = 0; i < Size.length; i++) {
            Packet.writeByte(Size.charCodeAt(i));
        }

        // Pad out the packet as necessary
        if (Packet.length < 128) {
            // Pad out to 128 bytes
            while (Packet.length < 128) {
                Packet.writeByte(0);
            }
        } else if (Packet.length === 128) {
            // Do nothing, we fit into 128 bytes exactly
            i = 0; // Make JSLint happy
        } else if (Packet.length < 1024) {
            // Pad out to 1024 bytes
            while (Packet.length < 1024) {
                Packet.writeByte(0);
            }
        } else if (Packet.length === 1024) {
            // Do nothing, we fit into 1024 bytes exactly				
            i = 0; // Make JSLint happy
        } else {
            // Shitty, we exceeded 1024 bytes!  What to do now?
            Cancel("Header packet exceeded 1024 bytes!");
            return;
        }

        try {
            FTelnet.writeByte(Packet.length === 128 ? SOH : STX);
            FTelnet.writeByte(0);
            FTelnet.writeByte(255);
            FTelnet.writeBytes(Packet);
            FTelnet.writeShort(CRC.Calculate16(Packet));
            FTelnet.flush();
        } catch (ioe) {
            HandleIOError(ioe);
            return;
        }
    };

    this.Upload = function (AFile, AFileCount) {
        FFileCount = AFileCount;

        // Add the file to the queue
        FFiles.push(AFile);

        // If the queue has just this one item, start the timers and listeners
        if (FFiles.length === AFileCount) {
            // Create our main timer
            FTimer = setInterval(OnTimer, 50);

            // Determine the number of total bytes
            var i;
            for (i = 0; i < FFiles.length; i++) {
                FTotalBytes += FFiles[i].size;
            }

            // Create the transfer dialog
            FBlink = Crt.Blink;
            Crt.Blink = false;
            Crt.HideCursor();
            pnlMain = new TCrtPanel(null, 10, 5, 60, 16, BorderStyle.Single, Crt.WHITE, Crt.BLUE, "YModem-G Send Status (Hit CTRL+X to abort)", ContentAlignment.TopLeft);
            lblFileCount = new TCrtLabel(pnlMain, 2, 2, 56, "Sending file 1 of " + FFileCount.toString(), ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            lblFileName = new TCrtLabel(pnlMain, 2, 4, 56, "File Name: " + FFiles[0].name, ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            lblFileSize = new TCrtLabel(pnlMain, 2, 5, 56, "File Size: " + StringUtils.AddCommas(FFiles[0].size) + " bytes", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            lblFileSent = new TCrtLabel(pnlMain, 2, 6, 56, "File Sent: 0 bytes", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            pbFileSent = new TCrtProgressBar(pnlMain, 2, 7, 56, ProgressBarStyle.Continuous);
            lblTotalSize = new TCrtLabel(pnlMain, 2, 9, 56, "Total Size: " + StringUtils.AddCommas(FTotalBytes) + " bytes", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            lblTotalSent = new TCrtLabel(pnlMain, 2, 10, 56, "Total Sent: 0 bytes", ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
            pbTotalSent = new TCrtProgressBar(pnlMain, 2, 11, 56, ProgressBarStyle.Continuous);
            pbTotalSent.Maximum = FTotalBytes;
            lblStatus = new TCrtLabel(pnlMain, 2, 13, 56, "Status: Transferring file(s)", ContentAlignment.Left, Crt.WHITE, Crt.BLUE);
        }
    };

    // Constructor
    FTelnet = ATelnet;
};