// From: http://stackoverflow.com/a/30810322/342378
class Clipboard {
    public static GetData(): string {
        if (document.queryCommandSupported('paste')) {
            var textArea: HTMLTextAreaElement = document.createElement("textarea");
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
            textArea.value = "paste";
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('paste');
            } catch (err) {
                textArea.value = prompt("Enter the text you'd like to paste");
            }

            document.body.removeChild(textArea);
            return textArea.value;
        } else if (window.clipboardData) {
            return window.clipboardData.getData("Text");
        } else {
            return prompt("Enter the text you'd like to paste");
        }
    }

    public static SetData(text: string): void {
        if (document.queryCommandSupported('copy')) {
            var textArea: HTMLTextAreaElement = document.createElement("textarea");
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
            } catch (err) {
                prompt('Press CTRL-C to copy the text to your clipboard', text);
            }

            document.body.removeChild(textArea);
        } else if (window.clipboardData) {
            window.clipboardData.setData("Text", text);
        } else {
            prompt('Press CTRL-C to copy the text to your clipboard', text);
        }
    }
}