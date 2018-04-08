import LineBreaker from "linebreak";
import {CardType} from "../Enums";
import {contextBoundingBox, finishLine} from "../helpers";
import Component from "./Component";

const CTRL_BOLD_START = "\x11";
const CTRL_BOLD_END = "\x12";
const CTRL_ITALIC_START = "\x13";
const CTRL_ITALIC_END = "\x14";

export default class BodyText extends Component {
	public render(context: CanvasRenderingContext2D, ratio: number) {
		this.drawBodyText(context, ratio, false);
	}

	private parseBodyText(text): {text: string; manualBreak: boolean} {
		const manualBreak = text.substr(0, 3) === "[x]";
		if (manualBreak) {
			text = text.substr(3);
		}
		text = text
			.replace(/<b>/g, CTRL_BOLD_START)
			.replace(/<\/b>/g, CTRL_BOLD_END)
			.replace(/<i>/g, CTRL_ITALIC_START)
			.replace(/<\/i>/g, CTRL_ITALIC_END);

		const pluralRegex = /(\d+)(.+?)\|4\((.+?),(.+?)\)/g;
		let plurals: RegExpExecArray;
		while ((plurals = pluralRegex.exec(text)) !== null) {
			text = text.replace(
				plurals[0],
				plurals[1] + plurals[2] + (parseInt(plurals[1], 10) === 1 ? plurals[3] : plurals[4])
			);
		}

		let spellDmg: RegExpExecArray;
		const spellDamageRegex = /\$(\d+)/;
		while ((spellDmg = spellDamageRegex.exec(text)) !== null) {
			text = text.replace(spellDmg[0], spellDmg[1]);
		}

		let spellHeal: RegExpExecArray;
		const spellHealRegex = /#(\d+)/;
		while ((spellHeal = spellHealRegex.exec(text)) !== null) {
			text = text.replace(spellHeal[0], spellHeal[1]);
		}

		return {text: text, manualBreak: manualBreak};
	}

	private drawBodyText(
		context: CanvasRenderingContext2D,
		ratio: number,
		forceSmallerFirstLine: boolean
	): void {
		let xPos = 0;
		let yPos = 0;
		let italic = 0;
		let bold = 0;
		let lineCount = 0;
		let justLineBreak: boolean;
		// size of the description text box
		const bodyWidth = this.parent.bodyTextCoords.dWidth;
		const bodyHeight = this.parent.bodyTextCoords.dHeight;
		// center of description box (x, y)
		const centerLeft = this.parent.bodyTextCoords.dx + bodyWidth / 2;
		const centerTop = this.parent.bodyTextCoords.dy + bodyHeight / 2;

		const body = this.parseBodyText(this.parent.getBodyText());
		const bodyText = body.text;
		this.sunwell.log("Body text", bodyText);

		const words = [];
		const breaker = new LineBreaker(bodyText);
		let last = 0;
		let bk;
		while ((bk = breaker.nextBreak())) {
			words.push(bodyText.slice(last, bk.position).replace("\n", ""));
			last = bk.position;
			if (bk.required) {
				words.push("\n");
			}
		}
		this.sunwell.log("Words", words);

		const bufferText = this.sunwell.getBuffer(bodyWidth, bodyHeight, true);
		const bufferTextCtx = bufferText.getContext("2d");
		bufferTextCtx.fillStyle = this.parent.bodyTextColor;

		let fontSize = this.sunwell.options.bodyFontSize;
		let lineHeight = this.sunwell.options.bodyLineHeight;
		const totalLength = bodyText.length;
		this.sunwell.log("Length of text is " + totalLength);

		const bufferRow = this.sunwell.getBuffer(bufferText.width, lineHeight, true);
		const bufferRowCtx = bufferRow.getContext("2d");
		bufferRowCtx.fillStyle = this.parent.bodyTextColor;
		// bufferRowCtx.textBaseline = this.sunwell.options.bodyBaseline;

		if (body.manualBreak) {
			let maxWidth = 0;
			bufferRowCtx.font = this.getFontMaterial(fontSize, false, false);
			bodyText.split("\n").forEach((line: string) => {
				const width = this.getLineWidth(bufferRowCtx, fontSize, line);
				if (width > maxWidth) {
					maxWidth = width;
				}
			});
			if (maxWidth > bufferText.width) {
				const r = bufferText.width / maxWidth;
				fontSize *= r;
				lineHeight *= r;
			}
		} else {
			if (totalLength >= 65) {
				fontSize = this.sunwell.options.bodyFontSize * 0.95;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.95;
			}

			if (totalLength >= 80) {
				fontSize = this.sunwell.options.bodyFontSize * 0.9;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.9;
			}

			if (totalLength >= 100) {
				fontSize = this.sunwell.options.bodyFontSize * 0.8;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.8;
			}

			if (totalLength >= 120) {
				fontSize = this.sunwell.options.bodyFontSize * 0.62;
				lineHeight = this.sunwell.options.bodyLineHeight * 0.8;
			}
		}

		bufferRowCtx.font = this.getFontMaterial(fontSize, !!bold, !!italic);
		bufferRow.height = lineHeight;

		let smallerFirstLine = false;
		if (
			forceSmallerFirstLine ||
			(totalLength >= 75 && this.parent.cardDef.type === CardType.SPELL)
		) {
			smallerFirstLine = true;
		}

		for (const word of words) {
			const cleanWord = word.trim().replace(/<((?!>).)*>/g, "");

			const width = bufferRowCtx.measureText(cleanWord).width;
			this.sunwell.log("Next word:", word);

			if (
				!body.manualBreak &&
				(xPos + width > bufferRow.width ||
					(smallerFirstLine && xPos + width > bufferRow.width * 0.8)) &&
				!justLineBreak
			) {
				this.sunwell.log(xPos + width, ">", bufferRow.width);
				this.sunwell.log("Calculated line break");
				smallerFirstLine = false;
				justLineBreak = true;
				lineCount++;
				[xPos, yPos] = finishLine(
					bufferTextCtx,
					bufferRow,
					bufferRowCtx,
					xPos,
					yPos,
					bufferText.width
				);
			}

			if (word === "\n") {
				this.sunwell.log("Manual line break");
				lineCount++;
				[xPos, yPos] = finishLine(
					bufferTextCtx,
					bufferRow,
					bufferRowCtx,
					xPos,
					yPos,
					bufferText.width
				);

				justLineBreak = true;
				smallerFirstLine = false;
				continue;
			}

			justLineBreak = false;

			for (const char of word) {
				switch (char) {
					case CTRL_BOLD_START:
						bold += 1;
						continue;
					case CTRL_BOLD_END:
						bold -= 1;
						continue;
					case CTRL_ITALIC_START:
						italic += 1;
						continue;
					case CTRL_ITALIC_END:
						italic -= 1;
						continue;
				}

				// TODO investigate why the following two properites are being reset, for web
				// likely something to do with getLineWidth()
				bufferRowCtx.fillStyle = this.parent.bodyTextColor;
				// move to here from pr.token block above,
				// text without markup ends up being default font otherwise
				bufferRowCtx.font = this.getFontMaterial(fontSize, !!bold, !!italic);

				bufferRowCtx.fillText(
					char,
					xPos + this.sunwell.options.bodyFontOffset.x,
					this.sunwell.options.bodyFontOffset.y
				);

				xPos += bufferRowCtx.measureText(char).width;
			}
			const em = bufferRowCtx.measureText("M").width;
			xPos += 0.275 * em;
		}

		lineCount++;
		finishLine(bufferTextCtx, bufferRow, bufferRowCtx, xPos, yPos, bufferText.width);

		this.sunwell.freeBuffer(bufferRow);

		if (this.parent.cardDef.type === CardType.SPELL && lineCount === 4) {
			if (!smallerFirstLine && !forceSmallerFirstLine) {
				this.drawBodyText(context, ratio, true);
				return;
			}
		}

		const b = contextBoundingBox(bufferTextCtx);

		b.h = Math.ceil(b.h / bufferRow.height) * bufferRow.height;

		context.drawImage(
			bufferText,
			b.x,
			b.y - 2,
			b.w,
			b.h,
			(centerLeft - b.w / 2) * ratio,
			(centerTop - b.h / 2) * ratio,
			b.w * ratio,
			(b.h + 2) * ratio
		);

		this.sunwell.freeBuffer(bufferText);
	}

	private getFontMaterial(size: number, bold: boolean, italic: boolean): string {
		let font: string;
		const weight = bold ? "bold" : "";
		const style = italic ? "italic" : "";
		let fontSize = `${size}px`;

		if (this.sunwell.options.bodyLineStyle !== "") {
			fontSize = `${fontSize}/${this.sunwell.options.bodyLineStyle}`;
		}

		if (bold && italic) {
			font = this.sunwell.options.bodyFontBoldItalic;
		} else if (bold) {
			font = this.sunwell.options.bodyFontBold;
		} else if (italic) {
			font = this.sunwell.options.bodyFontItalic;
		} else {
			font = this.sunwell.options.bodyFontRegular;
		}

		return [weight, style, fontSize, `"${font}", sans-serif`].join(" ");
	}

	private getLineWidth(
		context: CanvasRenderingContext2D,
		fontSize: number,
		line: string
	): number {
		let width = 0;
		let bold = 0;
		let italic = 0;

		for (const word of line.split(" ")) {
			for (const char of word) {
				switch (char) {
					case CTRL_BOLD_START:
						bold += 1;
						context.font = this.getFontMaterial(fontSize, !!bold, !!italic);
						continue;
					case CTRL_BOLD_END:
						bold -= 1;
						context.font = this.getFontMaterial(fontSize, !!bold, !!italic);
						continue;
					case CTRL_ITALIC_START:
						italic += 1;
						context.font = this.getFontMaterial(fontSize, !!bold, !!italic);
						continue;
					case CTRL_ITALIC_END:
						italic -= 1;
						context.font = this.getFontMaterial(fontSize, !!bold, !!italic);
						continue;
				}

				context.fillText(
					char,
					width + this.sunwell.options.bodyFontOffset.x,
					this.sunwell.options.bodyFontOffset.y
				);

				width += context.measureText(char).width;
			}
			width += 0.275 * context.measureText("M").width;
		}

		return width;
	}
}
