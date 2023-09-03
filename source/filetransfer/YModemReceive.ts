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
class YModemReceive {
    // Events
    public ontransfercomplete: IEvent = new TypedEvent();

    // Private constants
    private SOH: number = 0x01;
    private STX: number = 0x02;
    private EOT: number = 0x04;
    private ACK: number = 0x06;
    // Unused private NAK: number = 0x15;
    private CAN: number = 0x18;
    // Unused private SUB: number = 0x1A;
    private CAPC: number = 'C'.charCodeAt(0);

    // Private variables
    private _Connection: WebSocketConnection;
    private _Crt: Crt;
    private _Debug: boolean = (window.location.hash.indexOf('ymodemdebug=1') >= 0);
    private _ExpectingHeader: boolean = true;
    private _File: FileRecord;
    private _Files: FileRecord[] = [];
    private _LastCTime: number = 0;
    private _NextByte: number = 0;
    private _ShouldSendC: boolean = true;
    private _Timer: number;
    private _TotalBytesReceived: number = 0;

    // Private dialog elements
    private lblFileCount: CrtLabel;
    private lblFileName: CrtLabel;
    private lblFileSize: CrtLabel;
    private lblFileReceived: CrtLabel;
    private lblTotalReceived: CrtLabel;
    private lblStatus: CrtLabel;
    private pbFileReceived: CrtProgressBar;
    private pnlMain: CrtPanel;

    constructor(crt: Crt, connection: WebSocketConnection) {
        this._Crt = crt;
        this._Connection = connection;
    }

    private Cancel(reason: string): void {
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

    public Download(): void {
        // Create our main timer
        this._Timer = setInterval((): void => { this.OnTimer(); }, 50);

        // Create the transfer dialog
        this._Crt.HideCursor();
        this.pnlMain = new CrtPanel(this._Crt, undefined, 10, 5, 60, 14, BorderStyle.Single, Crt.WHITE, Crt.BLUE, 'YModem Receive Status (Hit CTRL+X to abort)', ContentAlignment.TopLeft);
        this.lblFileCount = new CrtLabel(this._Crt, this.pnlMain, 2, 2, 56, 'Receiving file 1', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileName = new CrtLabel(this._Crt, this.pnlMain, 2, 4, 56, 'File Name: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileSize = new CrtLabel(this._Crt, this.pnlMain, 2, 5, 56, 'File Size: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblFileReceived = new CrtLabel(this._Crt, this.pnlMain, 2, 6, 56, 'File Recv: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.pbFileReceived = new CrtProgressBar(this._Crt, this.pnlMain, 2, 7, 56, ProgressBarStyle.Continuous);
        this.lblTotalReceived = new CrtLabel(this._Crt, this.pnlMain, 2, 9, 56, 'Total Recv: ', ContentAlignment.Left, Crt.YELLOW, Crt.BLUE);
        this.lblStatus = new CrtLabel(this._Crt, this.pnlMain, 2, 11, 56, 'Status: Transferring file(s)', ContentAlignment.Left, Crt.WHITE, Crt.BLUE);
    }

    public FileAt(index: number): FileRecord {
        return this._Files[index];
    }

    public get FileCount(): number {
        return this._Files.length;
    }

    private HandleIOError(ioe: Error): void {
        console.log('I/O Error: ' + ioe);

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

        // Check if we've read a byte previously
        if (this._NextByte === 0) {
            // Nope, try to read one now
            if (this._Connection.bytesAvailable === 0) {
                // No data -- check if we should send a C
                if (this._ShouldSendC && ((new Date()).getTime() - this._LastCTime > 3000)) {
                    // Send a C after 3 quiet seconds	
                    try {
                        this._Connection.writeByte(this.CAPC);
                        this._Connection.flush();
                    } catch (ioe1) {
                        this.HandleIOError(ioe1);
                        return;
                    }

                    // Reset last C time so we don't spam C's
                    this._LastCTime = new Date().getTime();
                }

                return;
            } else {
                // Data available, so read the next byte
                try {
                    this._NextByte = this._Connection.readUnsignedByte();
                } catch (ioe2) {
                    this.HandleIOError(ioe2);
                    return;
                }
            }
        }

        // See what to do
        this.DebugLog('Next byte is ' + this._NextByte.toString());
        switch (this._NextByte) {
            case this.CAN:
                // Sender requested cancellation
                this.CleanUp('Sender requested abort');

                break;
            case this.SOH:
            case this.STX:
                // File transfer is happening, don't send a C on timeout
                this._ShouldSendC = false;

                var BlockSize: number = (this._NextByte === this.STX) ? 1024 : 128;

                // Make sure we have enough data to read a full block
                var neededBytes: number = 1 + 1 + BlockSize + 1 + 1;
                if (this._Connection.bytesAvailable < neededBytes) {
                    this.DebugLog('Need ' + neededBytes.toString() + ' but only have ' + this._Connection.bytesAvailable.toString() + ' available');
                    return;
                }

                // Reset NextByte variable so we read in a new byte next loop
                this._NextByte = 0;

                // Get block numbers
                var InBlock: number = this._Connection.readUnsignedByte();
                var InBlockInverse: number = this._Connection.readUnsignedByte();

                // Validate block numbers
                if (InBlockInverse !== (255 - InBlock)) {
                    this.Cancel('Bad block #: ' + InBlockInverse.toString() + ' !== 255-' + InBlock.toString());
                    return;
                }

                // Read data block
                var Packet: ByteArray = new ByteArray();
                this._Connection.readBytes(Packet, 0, BlockSize);

                // Validate CRC
                var InCRC: number = this._Connection.readUnsignedShort();
                var OurCRC: number = CRC.Calculate16(Packet);
                if (InCRC !== OurCRC) {
                    this.Cancel('Bad CRC: ' + InCRC.toString() + ' !== ' + OurCRC.toString());
                    return;
                }

                // Reading the header?
                if (this._ExpectingHeader) {
                    // Make sure it's block 0
                    if (InBlock !== 0) {
                        this.Cancel('Expecting header got block ' + InBlock.toString());
                        return;
                    }

                    // It is, so mark that we don't want it next packet 0
                    this._ExpectingHeader = false;

                    // Get the filename
                    var FileName: string = '';
                    var B: number = Packet.readUnsignedByte();
                    while ((B !== 0) && (Packet.bytesAvailable > 0)) {
                        FileName += String.fromCharCode(B);
                        B = Packet.readUnsignedByte();
                    }

                    // Get the file size
                    var Temp: string = '';
                    var FileSize: number = 0;
                    B = Packet.readUnsignedByte();
                    while ((B >= 48) && (B <= 57) && (Packet.bytesAvailable > 0)) {
                        Temp += String.fromCharCode(B);
                        B = Packet.readUnsignedByte();
                    }
                    FileSize = parseInt(Temp, 10);

                    // Check for blank filename (means batch is complete)
                    if (FileName.length === 0) {
                        this.CleanUp('File(s) successfully received!');
                        return;
                    }

                    // Check for blank file size (we don't like this case!)
                    if (isNaN(FileSize) || (FileSize === 0)) {
                        this.Cancel('File Size missing from header block');
                        return;
                    }

                    // Header is good, setup a new file record
                    this._File = new FileRecord(FileName, FileSize);
                    this.lblFileCount.Text = 'Receiving file ' + (this._Files.length + 1).toString();
                    this.lblFileName.Text = 'File Name: ' + FileName;
                    this.lblFileSize.Text = 'File Size: ' + StringUtils.AddCommas(FileSize) + ' bytes';
                    this.lblFileReceived.Text = 'File Recv: 0 bytes';
                    this.pbFileReceived.Value = 0;
                    this.pbFileReceived.Maximum = FileSize;

                    // Send a ACK+C to request file start
                    try {
                        this._Connection.writeByte(this.ACK);
                        this._Connection.writeByte(this.CAPC);
                        this._Connection.flush();
                    } catch (ioe3) {
                        this.HandleIOError(ioe3);
                        return;
                    }
                } else {
                    // Add bytes to byte array (don't exceed desired file size though)
                    var BytesToWrite: number = Math.min(BlockSize, this._File.size - this._File.data.length);
                    this._File.data.writeBytes(Packet, 0, BytesToWrite);
                    this._TotalBytesReceived += BytesToWrite;

                    this.lblFileReceived.Text = 'File Recv: ' + StringUtils.AddCommas(this._File.data.length) + ' bytes';
                    this.pbFileReceived.Value = this._File.data.length;
                    this.lblTotalReceived.Text = 'Total Recv: ' + StringUtils.AddCommas(this._TotalBytesReceived) + ' bytes';

                    // Send a ACK to confirm block
                    try {
                        this._Connection.writeByte(this.ACK);
                        this._Connection.flush();
                    } catch (ioe4) {
                        this.HandleIOError(ioe4);
                        return;
                    }
                }

                break;
            case this.EOT:
                // File transfer is over, send a C on timeout
                this._ShouldSendC = true;

                // Acknowledge EOT and ask for next file
                try {
                    this._Connection.writeByte(this.ACK);
                    this._Connection.writeByte(this.CAPC);
                    this._Connection.flush();
                } catch (ioe5) {
                    this.HandleIOError(ioe5);
                    return;
                }

                // Reset NextByte variable so we read in a new byte next loop
                this._NextByte = 0;

                // Reset variables for next transfer
                this._ExpectingHeader = true;
                this._Files.push(this._File);

                // Save the file
                this.SaveFile(this._Files.length - 1);

                break;
            default:
                // Didn't expect this, so abort
                this.Cancel('Unexpected byte: ' + this._NextByte.toString());
                return;
        }
    }

    private SaveFile(index: number): void {
        var ByteString: string = this._Files[index].data.toString();

        var Buffer: ArrayBuffer = new ArrayBuffer(ByteString.length);
        var View: DataView = new DataView(Buffer);
        for (var i: number = 0; i < ByteString.length; i++) {
            View.setUint8(i, ByteString.charCodeAt(i));
        }

        var FileBlob: Blob = new Blob([Buffer], { type: 'application/octet-binary' });
        saveAs(FileBlob, this._Files[index].name);
    }
}
