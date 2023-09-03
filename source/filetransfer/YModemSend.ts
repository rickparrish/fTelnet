/*
  fTelnet: An HTML5 WebSocket client
  Copyright (C) Rick Parrish, R&M Software

  This file is part of fTelnet.

  fTelnet is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or any later version.

  fTelnet is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with fTelnet.  If not, see <http://www.gnu.org/licenses/>.
*/
class YModemSend {
    // Events
    public ontransfercomplete: IEvent = new TypedEvent();

    // Private constants
    private SOH: number = 0x01;
    private STX: number = 0x02;
    private EOT: number = 0x04;
    private ACK: number = 0x06;
    private NAK: number = 0x15;
    private CAN: number = 0x18;
    private SUB: number = 0x1A;
    private CAPC: number = 'C'.charCodeAt(0);
    private CAPG: number = 'G'.charCodeAt(0);

    // Private variables
    private _Block: number = 0;
    private _Connection: WebSocketConnection;
    private _Crt: Crt;
    private _Debug: boolean = (window.location.hash.indexOf('ymodemdebug=1') >= 0);
    private _EOTCount: number = 0;
    private _File: FileRecord;
    private _FileBytesSent: number = 0;
    private _FileCount: number = 0;
    private _Files: FileRecord[] = [];
    private _State: YModemSendState = YModemSendState.WaitingForHeaderRequest;
    private _Timer: number;
    private _TotalBytes: number = 0;
    private _TotalBytesSent: number = 0;

    // Private dialog elements
    private lblFileCount: CrtLabel;
    private lblFileName: CrtLabel;
    private lblFileSize: CrtLabel;
    private lblFileSent: CrtLabel;
    private lblTotalSize: CrtLabel;
    private lblTotalSent: CrtLabel;
    private lblStatus: CrtLabel;
    private pbFileSent: CrtProgressBar;
    private pbTotalSent: CrtProgressBar;
    private pnlMain: CrtPanel;

    constructor(crt: Crt, connection: WebSocketConnection) {
        this._Crt = crt;
        this._Connection = connection;
    }

    private Cancel(reason: string): void {
        this.DebugLog('Cancel at state ' + this._State + ': ' + reason);

        // Send the cancel request
        try {
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeByte(this.CAN);
            this._Connection.writeString('\b\b\b\b\b     \b\b\b\b\b'); // will auto-flush
        } catch (ioe1) {
            this.HandleIOError(ioe1);
            return;
        }

        // Drain the input buffer
        try {
            this._Connection.readString();
        } catch (ioe2) {
            this.HandleIOError(ioe2);
            return;
        }

        this.CleanUp('Cancelling (' + reason + ')');
    }

    private CleanUp(message: string): void {
        // Remove the listeners
        clearInterval(this._Timer);

        // Update status label
        this.lblStatus.Text = 'Status: ' + message;

        // Dispatch the event after 3 seconds
        setTimeout((): void => { this.Dispatch(); }, 3000);
    }

    private DebugLog(message: string): void {
        if (this._Debug) {
            console.log(message);
        }
    }

    private Dispatch(): void {
        // Remove the panel
        this.pnlMain.Hide();
        this._Crt.ShowCursor();

        this.ontransfercomplete.trigger();
    }

    private HandleIOError(ioe: Error): void {
        this.DebugLog('I/O Error: ' + ioe);

        if (this._Connection.connected) {
            this.CleanUp('Unhandled I/O error');
        } else {
            this.CleanUp('Connection to server lost');
        }
    }

    private OnTimer(): void {
        // Check for abort
        while (this._Crt.KeyPressed()) {
            var KPE: KeyPressEvent | undefined = this._Crt.ReadKey();
            if ((typeof KPE !== 'undefined') && (KPE.keyString.length > 0) && (KPE.keyString.charCodeAt(0) === this.CAN)) {
                this.Cancel('User requested abort');
            }
        }

        // Break if no data is waiting
        if (this._Connection.bytesAvailable === 0) {
            return;
        }

        // Determine what to do
        var B: number = 0;
        switch (this._State) {
            case YModemSendState.WaitingForHeaderRequest:
                // Check for C
                try {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe1) {
                    this.HandleIOError(ioe1);
                    return;
                }

                // Make sure we got the C and not something else
                if (B !== this.CAPC) {
                    if (B === this.CAPG) {
                        this.Cancel('Use plain YMODEM, not YMODEM-G');
                    } else {
                        this.Cancel('Expecting C got ' + B.toString() + ' (State=' + this._State + ')');
                    }
                    return;
                }

                // Drain the input buffer so that we're synchronized (Receiver may have sent multiple C's while we were browsing for the file)
                try {
                    this._Connection.readString();
                } catch (ioe2) {
                    this.HandleIOError(ioe2);
                    return;
                }

                // Do we still have files in the array?
                var NextFile = this._Files.shift();
                if (typeof NextFile === 'undefined') {
                    // Nope, let the other end know we're done
                    this.SendEmptyHeaderBlock();
                    this.CleanUp('File(s) successfully sent!');
                    return;
                }

                // Load the next file
                this._File = NextFile;
                this.lblFileCount.Text = 'Sending file ' + (this._FileCount - this._Files.length).toString() + ' of ' + this._FileCount.toString();
                this.lblFileName.Text = 'File Name: ' + this._File.name;
                this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(this._File.size) + ' bytes';
                this.lblFileSent.Text = 'File Sent: 0 bytes';
                this.pbFileSent.Value = 0;
                this.pbFileSent.Maximum = this._File.size;

                // Send the header block
                this.SendHeaderBlock();

                // Reset variables for the new file transfer
                this._Block = 1;
                this._EOTCount = 0;
                this._FileBytesSent = 0;

                // Move to next state
                this.SetState(YModemSendState.WaitingForHeaderAck);
                return;

            case YModemSendState.WaitingForHeaderAck:
                // Check for ACK or C
                try {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe3) {
                    this.HandleIOError(ioe3);
                    return;
                }

                // Make sure we got the ACK or C and not something else
                if ((B !== this.ACK) && (B !== this.CAPC)) {
                    this.Cancel('Expecting ACK or C got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                if (B === this.ACK) {
                    // Move to next state
                    this.SetState(YModemSendState.WaitingForFileRequest)
                } else if (B === this.CAPC) {
                    // Async PRO doesn't ACK the header packet, so we can only assume this C is a request for the file to start, not for a re-send of the header
                    // Move to next state
                    this.DebugLog('Got C, sending a data block');
                    this.SendDataBlock(); // Will set new state within the method
                }
                return;

            case YModemSendState.WaitingForFileRequest:
                // Check for C
                try {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe4) {
                    this.HandleIOError(ioe4);
                    return;
                }

                // Make sure we got the C and not something else
                if (B !== this.CAPC) {
                    this.Cancel('Expecting C got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                // Move to next state
                this.DebugLog('Got C, sending a data block');
                this.SendDataBlock(); // Will set state within the method
                return;

            case YModemSendState.WaitingForBlockAck:
                // Check for ACK
                try {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe4) {
                    this.HandleIOError(ioe4);
                    return;
                }

                // Ignore if we get a C, could have been sent after we started sending the first block
                if (B === this.CAPC) {
                    this.DebugLog('Got unexpected C while waiting for block ack, ignoring');
                    return;
                }

                // Make sure we got the ACK (or NAK) and not something else
                if ((B !== this.ACK) && (B !== this.NAK)) {
                    this.Cancel('Expecting (N)ACK got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                // TODOX Shouldn't we cancel on NAK?

                // Move to next state
                this.DebugLog('Got ACK, sending a data block');
                this.SendDataBlock(); // Will set state within the method
                return;

            case YModemSendState.WaitingForFileAck:
                // Check for ACK
                try {
                    B = this._Connection.readUnsignedByte();
                } catch (ioe5) {
                    this.HandleIOError(ioe5);
                    return;
                }

                // Make sure we got the ACK (or NAK) and not something else
                if ((B !== this.ACK) && (B !== this.NAK)) {
                    this.Cancel('Expecting (N)ACK got ' + B.toString() + ' (State=' + this._State + ')');
                    return;
                }

                // Move to next state
                if (B === this.ACK) {
                    // Waiting for them to request the next header
                    this.SetState(YModemSendState.WaitingForHeaderRequest);
                } else if (B === this.NAK) {
                    // Re-send the EOT
                    this.DebugLog('Got NAK, re-sending EOT');
                    this.SendEOT();
                }
                return;
        }
    }

    private SendDataBlock(): void {
        if (this.SendDataBlocks(1)) {
            this.SetState(YModemSendState.WaitingForFileAck);
        } else {
            this.SetState(YModemSendState.WaitingForBlockAck);
        }
    }

    private SendDataBlocks(blocks: number): boolean {
        this.DebugLog('SendDataBlocks sending ' + blocks.toString() + ' data block(s)');

        // Loop ABlocks times for ABlocks k per timer event
        for (var loop: number = 0; loop < blocks; loop++) {
            // Determine how many bytes to read (max 1024 per block)
            var BytesToRead: number = Math.min(1024, this._File.data.bytesAvailable);

            // Check how many bytes are left
            if (BytesToRead === 0) {
                // No more bytes left, send the EOT
                this.SendEOT();
                return true;
            } else {
                // Read the bytes from the file
                var Packet: ByteArray = new ByteArray();
                this._File.data.readBytes(Packet, 0, BytesToRead);

                // Append SUB bytes to pad to 1024, if necessary
                if (Packet.length < 1024) {
                    Packet.position = Packet.length;
                    while (Packet.length < 1024) {
                        Packet.writeByte(this.SUB);
                    }
                    Packet.position = 0;
                }

                // Send the block
                try {
                    this._Connection.writeByte(this.STX);
                    this._Connection.writeByte(this._Block % 256);
                    this._Connection.writeByte(255 - (this._Block % 256));
                    this._Connection.writeBytes(Packet);
                    this._Connection.writeShort(CRC.Calculate16(Packet));
                    this._Connection.flush();
                } catch (ioe) {
                    this.HandleIOError(ioe);
                    return false;
                }

                // Increment counters
                this._Block++;
                this._FileBytesSent += BytesToRead;
                this._TotalBytesSent += BytesToRead;

                // Update labels
                this.lblFileSent.Text = 'File Sent: ' + StringUtils.AddCommas(this._FileBytesSent) + ' bytes';
                this.pbFileSent.StepBy(BytesToRead);
                this.lblTotalSent.Text = 'Total Sent: ' + StringUtils.AddCommas(this._TotalBytesSent) + ' bytes';
                this.pbTotalSent.StepBy(BytesToRead);
            }
        }

        // Didn't finish the file yet
        return false;
    }

    private SendEmptyHeaderBlock(): void {
        this.DebugLog('SendEmptyHeaderBlock');

        var Packet: ByteArray = new ByteArray();

        // Add 128 null bytes
        for (var i: number = 0; i < 128; i++) {
            Packet.writeByte(0);
        }

        try {
            this._Connection.writeByte(this.SOH);
            this._Connection.writeByte(0);
            this._Connection.writeByte(255);
            this._Connection.writeBytes(Packet);
            this._Connection.writeShort(CRC.Calculate16(Packet));
            this._Connection.flush();
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    }

    private SendEOT(): void {
        this.DebugLog('SendEOT');

        try {
            this._Connection.writeByte(this.EOT);
            this._Connection.flush();
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
        this._EOTCount++;
    }

    private SendHeaderBlock(): void {
        this.DebugLog('SendHeaderBlock');

        var i: number = 0;
        var Packet: ByteArray = new ByteArray();

        // Add filename to packet
        for (i = 0; i < this._File.name.length; i++) {
            Packet.writeByte(this._File.name.charCodeAt(i));
        }

        // Add null separator
        Packet.writeByte(0);

        // Add file size to packet (as string)
        var Size: string = this._File.size.toString();
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
        } catch (ioe) {
            this.HandleIOError(ioe);
            return;
        }
    }

    private SetState(state: YModemSendState) {
        if (state != this._State) {
            this.DebugLog('Moving from state ' + this._State.toString() + ' to ' + state.toString());
            this._State = state;
        }
    }

    public Upload(file: FileRecord, fileCount: number): void {
        this._FileCount = fileCount;

        // Add the file to the queue
        this._Files.push(file);

        // If the queue has just this one item, start the timers and listeners
        if (this._Files.length === fileCount) {
            // Create our main timer
            this._Timer = setInterval((): void => { this.OnTimer(); }, 0);

            // Determine the number of total bytes
            for (var i: number = 0; i < this._Files.length; i++) {
                this._TotalBytes += this._Files[i].size;
            }

            // Create the transfer dialog
            this._Crt.HideCursor();
            this.pnlMain = new CrtPanel(this._Crt, undefined, 10, 5, 60, 16, BorderStyle.Single, Crt.WHITE, Crt.BLUE, 'YModem Send Status (Hit CTRL+X to abort)', ContentAlignment.TopLeft);
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
    }
}
