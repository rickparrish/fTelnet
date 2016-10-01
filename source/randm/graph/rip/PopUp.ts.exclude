// From http://fatal-exception.co.uk/blog/?p=69
package randm.graph.rip {
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.GradientType;
	import flash.display.SimpleButton;
	import flash.display.Sprite;
	import flash.display.Stage;
	import flash.events.MouseEvent;
	import flash.filters.BitmapFilter;
	import flash.filters.BitmapFilterQuality;
	import flash.filters.BlurFilter;
	import flash.filters.DropShadowFilter;
	import flash.filters.GlowFilter;
	import flash.geom.Matrix;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.text.engine.FontPosture;
	
	import randm.crt.Crt;

	public class PopUp {
		private static const BUTTON_WIDTH: int = 300;
		private static const BUTTON_HEIGHT: int = 18;
		
		private static var FButtons: Vector.<TPopUpButton>;
		private static var FCallBack: Function;
		private static var FPrompt: String = "Choose one of the following:";
		private static var FRequired: Boolean = false;
		private static var FStage: Stage;

		public static function init(AStage: Stage): void 
		{
			FStage = AStage;
		}
		
		public static function show(AData: String, ACallBack: Function): void
		{
			if (typeof FStage === 'undefined') {
				trace("PopUp class has not been initialised!");
				return;
			}
			
			// Trim (( and ))
			AData = AData.substr(2, AData.length - 4);
			
			// Split into question and answer portion
			var QuestionAnswers: Array = AData.split("::");
			
			// Get the question, if one exists
			var Question: String = String(QuestionAnswers[0]);
			if (Question.length > 0) {
				// Check if a response is required
				if (Question.substr(0, 1) === "*") {
					// Yep!
					FPrompt = Question.substr(1, Question.length - 1);
					FRequired = true;
				} else {
					// Nope
					FPrompt = Question;
				}
			}
			
			// Get the answers
			FButtons = new Vector.<TPopUpButton>();
			var Answers: Array = String(QuestionAnswers[1]).split(",");
			for (var i: int = 0; i < Answers.length; i++) {
				FButtons.push(new TPopUpButton(String(Answers[i])));
			}

			// Add the callback
			FCallBack = ACallBack;
			
			var ThisPopUp: Sprite = new Sprite();
			ThisPopUp.addChild(createBackground());
			ThisPopUp.addChild(getPrompt());
			assignListeners(ThisPopUp);
			FStage.addChild(ThisPopUp);
		}

		private static function assignListeners(APopUp: Sprite): void 
		{
			var promptBackground: * = APopUp.getChildAt(1);
			var allButtons: Array = new Array();
			for (var n: int; n < FButtons.length; n++) {
				var button: SimpleButton = promptBackground.getChildByName(FButtons[n].Data)
				button.addEventListener(MouseEvent.CLICK, myFunction);
				allButtons.push(button);
			}
			
			//	THIS IS DECLARED HERE SIMPLY SO I HAVE ACCESS TO alertOptions
			function myFunction(event: MouseEvent): void 
			{
				for (var i:int; i < allButtons.length; i++) {
					allButtons[i].removeEventListener(MouseEvent.CLICK, myFunction);
				}
				closeAlert(APopUp);
				if (typeof FCallBack !== 'undefined') FCallBack(event.target.name);
			}
		}

		private static function closeAlert(APopUp: Sprite):void {
			var promptBackground: * = APopUp.getChildAt(1);
			promptBackground.removeEventListener(MouseEvent.MOUSE_DOWN, doStartDrag);
			promptBackground.removeEventListener(MouseEvent.MOUSE_UP, doStopDrag);
			FStage.removeChild(APopUp);
			FStage.focus = Crt.Canvas;
		}
		
		private static function createBackground(): Sprite 
		{
			var myBackground: Sprite = new Sprite();
			var BackgroundBD: BitmapData = new BitmapData(FStage.stageWidth, FStage.stageHeight, true, 0xFF4E7DB1);
			var stageBackground: BitmapData = new BitmapData(FStage.stageWidth, FStage.stageHeight);
			stageBackground.draw(FStage);
			var rect: Rectangle = new Rectangle(0, 0, FStage.stageWidth, FStage.stageHeight);
			var point: Point = new Point(0, 0);
			var multiplier: uint = 120;
			BackgroundBD.merge(stageBackground, rect, point, multiplier, multiplier, multiplier, multiplier);
			BackgroundBD.applyFilter(BackgroundBD, rect, point, new BlurFilter(5, 5));
			var bitmap: Bitmap = new Bitmap(BackgroundBD);
			myBackground.addChild(bitmap);
			return myBackground;
		}

		private static function createButton(AButton: TPopUpButton): SimpleButton {
			var colors:Array = new Array();
			var alphas:Array = new Array(1, 1);
			var ratios:Array = new Array(0, 255);
			var gradientMatrix:Matrix = new Matrix();
			gradientMatrix.createGradientBox(BUTTON_WIDTH, BUTTON_HEIGHT, Math.PI/2, 0, 0);

			var ellipseSize:int = 2;
			var btnUpState:Sprite = new Sprite();
			colors = [0xFFFFFF, 0x4E7DB1];
			btnUpState.graphics.lineStyle(3, brightenColour(0x4E7DB1, -50));
			btnUpState.graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, ratios, gradientMatrix);
			btnUpState.graphics.drawRoundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, ellipseSize, ellipseSize);
			btnUpState.addChild(createButtonTextField(AButton.Label));

			var btnOverState:Sprite = new Sprite();
			colors = [0xFFFFFF, brightenColour(0x4E7DB1, 50)];
			btnOverState.graphics.lineStyle(1, brightenColour(0x4E7DB1, -50));
			btnOverState.graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, ratios, gradientMatrix);
			btnOverState.graphics.drawRoundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, ellipseSize, ellipseSize);
			btnOverState.addChild(createButtonTextField(AButton.Label))

			var btnDownState:Sprite = new Sprite();
			colors = [brightenColour(0x4E7DB1, -15), brightenColour(0x4E7DB1, 50)];
			btnDownState.graphics.lineStyle(1, brightenColour(0x4E7DB1, -50));
			btnDownState.graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, ratios, gradientMatrix);
			btnDownState.graphics.drawRoundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, ellipseSize, ellipseSize);
			btnDownState.addChild(createButtonTextField(AButton.Label))

			var myButton: SimpleButton = new SimpleButton(btnUpState, btnOverState, btnDownState, btnOverState);
			myButton.name = AButton.Data;
			return myButton;
		}

		//	returns a Sprite containing a prompt positioned in the middle of the stage
		private static function getPrompt(): Sprite 
		{
			var actualPrompt: Sprite = createPrompt();
			actualPrompt.name = "actual_prompt";
			actualPrompt.addEventListener(MouseEvent.MOUSE_DOWN, doStartDrag);
			actualPrompt.addEventListener(MouseEvent.MOUSE_UP, doStopDrag);
			actualPrompt.x = (FStage.stageWidth/2)-(actualPrompt.width/2);
			actualPrompt.y = (FStage.stageHeight/2)-(actualPrompt.height/2);
			return actualPrompt;
		}

		private static function getDropShadowFilter(Colour:int):DropShadowFilter {
			var color:Number = 0x000000;
			var angle:Number = 90;
			var alpha:Number = 0.6;
			var blurX:Number = 12;
			var blurY:Number = 4;
			var distance:Number = 1;
			var strength:Number = 1;
			var inner:Boolean = false;
			var knockout:Boolean = false;
			var quality:Number = BitmapFilterQuality.LOW;
			return new DropShadowFilter(distance, angle, color, alpha, blurX, blurY, strength, quality, inner, knockout);
		}	

		private static function getGlowFilter(Colour:int):GlowFilter {
			var color:Number = 0xFFFFFF;
			var alpha:Number = 0.8;
			var blurX:Number = 15;
			var blurY:Number = 15;
			var strength:Number = 0.7;
			var inner:Boolean = true;
			var knockout:Boolean = false;
			var quality:Number = BitmapFilterQuality.HIGH;
			return new GlowFilter(color, alpha, blurX, blurY, strength, quality, inner, knockout);
		}

		//	returns a sprite containing a prompt complete with a background, the specified text and an OK button
		private static function createPrompt(): Sprite 
		{
			var promptBackground: Sprite = new Sprite();
			var textField: TextField = createTextField();
			var myWidth: int = 320;
			var myHeight: int = textField.height + 15 + (BUTTON_HEIGHT * FButtons.length);

			//	Create a background for the prompt
			var ellipseSize:int = 10;
			promptBackground.graphics.lineStyle(1);
			promptBackground.graphics.beginFill(0x4E7DB1);
			promptBackground.graphics.drawRoundRect(0, 0, myWidth, myHeight, ellipseSize, ellipseSize);
			promptBackground.graphics.endFill();
			//	Add the specified text to the prompt
			textField.x = 10;
			textField.y = 5;
			//	ADD SPECIFIED BUTTONS TO THE PROMPT
			var alertButtons:Array = new Array();
			for (var n: int; n < FButtons.length; n++) {
				alertButtons.push(createButton(FButtons[n]));
			}
			promptBackground.filters = [getGlowFilter(0x4E7DB1), getDropShadowFilter(0x4E7DB1)];
			promptBackground.alpha = 1;
			var actualPrompt:Sprite = new Sprite();
			actualPrompt.addChild(promptBackground);
			actualPrompt.addChild(textField);
			for (var i: int; i < alertButtons.length; i++) {
				alertButtons[i].x = 10;
				alertButtons[i].y = textField.height + 10 + (i * BUTTON_HEIGHT);
				actualPrompt.addChild(alertButtons[i]);
			}
			return actualPrompt;
		}

		private static function createButtonTextField(AText:String): TextField 
		{
			var myTextField:TextField = new TextField();
			myTextField.textColor = 0x000000;
			myTextField.selectable = false;
			myTextField.width = BUTTON_WIDTH;
			myTextField.height = BUTTON_HEIGHT;
			var myTextFormat:TextFormat = new TextFormat();
			myTextFormat.align = TextFormatAlign.CENTER;
			myTextField.defaultTextFormat = myTextFormat;
			myTextField.htmlText = '<font face="Verdana"><b>' + AText + '</b></font>';
			myTextField.x = (BUTTON_WIDTH/2)-(myTextField.width/2);
			return myTextField;
		}
		
		private static function createTextField(): TextField 
		{
			var Text:String = FPrompt;
			var myTextField:TextField = new TextField();
			myTextField.textColor = 0x000000;
			myTextField.multiline = true;
			myTextField.selectable = false;
			myTextField.autoSize = TextFieldAutoSize.LEFT;
			myTextField.htmlText = '<font face="Verdana">' + Text + '</font>';
			myTextField.x = 10;
			return myTextField;
		}

		//
		//	Helper functions
		//-----------------------------------------------------------------
		//
		//	returns a brighter version of the specified colour
		private static function brightenColour(colour:int, modifier:int):int {
			var hex:Array = hexToRGB(colour);
			var red:int = keepInBounds(hex[0]+modifier);
			var green:int = keepInBounds(hex[1]+modifier);
			var blue:int = keepInBounds(hex[2]+modifier);
			return RGBToHex(red, green, blue);
		}
		private static function doStartDrag(event:MouseEvent):void {
			if (event.target is Sprite) event.currentTarget.startDrag();
		}
		private static function doStopDrag(event:MouseEvent):void {
			if (event.target is Sprite) event.currentTarget.stopDrag();
		}
		private static function hexToRGB (hex:uint):Array {
			var Colours:Array = new Array(); 
			Colours.push(hex >> 16);
			var temp:uint = hex ^ Colours[0] << 16;
			Colours.push(temp >> 8);
			Colours.push(temp ^ Colours[1] << 8);
			return Colours;
		}
		private static function keepInBounds(number:int):int {
			if (number < 0)	number = 0;
			if (number > 255) number = 255;
			return number;
		}		
		private static function RGBToHex(uR:int, uG:int, uB:int):int {
			var uColor:uint;
			uColor =  (uR & 255) << 16;
			uColor += (uG & 255) << 8;
			uColor += (uB & 255);
			return uColor;
		}
	}
}
	
internal class TPopUpButton
{
	private var FData: String;
	private var FLabel: String;
	private var FHotKey: String;
	
	public function TPopUpButton(AData: String): void
	{
		// Check if there's a custom label
		var DataLabel: Array = AData.split("@");
		if (DataLabel.length === 1) {
			// Nope, so label and data are the same
			FData = DataLabel[0];
			FLabel = DataLabel[0];
		} else {
			// Yep, so label and data are different
			FData = DataLabel[0];
			FLabel = DataLabel[1];
		}
		
		// Check if there's a hotkey
		// TODO For now we don't support hotkeys
		FLabel = FLabel.replace(/[~]/g, "");
		FLabel = FLabel.replace(/[_]/g, "");
	}
	
	public function get Data(): String
	{
		return FData;	
	}
	
	public function get Label(): String
	{
		return FLabel;
	}
}