import { ApiProxy, ApiResponse } from "api-proxy";
import { sanitizeHTMLToDom } from "obsidian";
import { GERMAN_BOOK_ABBREVIATIONS, GERMAN_BOOKS } from "books";

const BASE_URL =
	"https://www.jw.org/de/bibliothek/bibel/studienbibel/buecher/json/html/";

export interface ResolveError {
	success: false;
	error: string;
}

export interface Bibeltext {
	success: true;
	ref: RefRange;
	title: string;
	citationVerseRange: string;
	markdown: string;
}

interface BibeltextRef {
	book: number;
	chapter: number;
	verse: number;
}
class RefRange {
	first: BibeltextRef;
	last: BibeltextRef | null;

	private constructor(first: BibeltextRef, last: BibeltextRef | null) {
		this.first = first;
		this.last = last;
	}

	static async fromTag(tag: string): Promise<RefRange | ResolveError> {
		const parts = tag.split("/");
		if (parts.shift() != "#b") return { success: false, error: "Parsing" };

		const bookStr = parts.shift();
		if (!bookStr) return { success: false, error: "Parsing" };
		const book = GERMAN_BOOKS[bookStr];
		if (!book) return { success: false, error: `Unknown Book: ${bookStr}` };

		const chapterStr = parts.shift();
		if (!chapterStr) return { success: false, error: "Parsing" };
		const chapter = parseInt(chapterStr);

		const verseStr = parts.shift();
		let verse1: number, verse2: number | null;
		if (!verseStr) {
			verse1 = 0;
			verse2 = 200;
		} else if (verseStr.contains("-")) {
			verse1 = parseInt(verseStr.split("-")[0]);
			verse2 = parseInt(verseStr.split("-")[1]);
		} else {
			verse1 = parseInt(verseStr);
			verse2 = null;
		}

		if (verse2) {
			return new RefRange({ book, chapter, verse: verse1 }, {
				book,
				chapter,
				verse: verse2,
			});
		} else {
			return new RefRange({ book, chapter, verse: verse1 }, null);
		}
	}

	public toRefNr() {
		let ref = this.first.book.toString() +
			this.first.chapter.toString().padStart(3, "0") +
			this.first.verse.toString().padStart(3, "0");

		if (this.last) {
			ref += "-";
			ref += this.last.book.toString() +
				this.last.chapter.toString().padStart(3, "0") +
				this.last.verse.toString().padStart(3, "0");
		}

		return ref;
	}

	is() {
	}
}

export class BibelResolver {
	private bibeltextCache = new Map<string, Bibeltext>();
	private proxy: ApiProxy = new ApiProxy();

	public async getDisplayText(tag: string): Promise<string | ResolveError> {
		const text = await this.resolveText(tag);
		if (!text.success) return text;

		const abbr = GERMAN_BOOK_ABBREVIATIONS[text.ref.first.book];
		if (!abbr) return { success: false, error: `Unknown Book: ${tag}` };

		return abbr + " " + text.citationVerseRange;
	}

	public async resolveText(tag: string): Promise<Bibeltext | ResolveError> {
		const ref: RefRange = await RefRange.fromTag(tag) as RefRange;
		//@ts-ignore
		if (ref.error) return ref;

		if (this.bibeltextCache.has(ref.toRefNr())) {
			return this.bibeltextCache.get(ref.toRefNr()) as Bibeltext;
		}

		const response: ApiResponse = await this.proxy.request(ref.toRefNr());

		const markdown = this.renterToMarkdown(response.ranges[ref.toRefNr()]);

		const text: Bibeltext = {
			success: true,
			ref,
			title: response.ranges[ref.toRefNr()].citation,
			citationVerseRange:
				response.ranges[ref.toRefNr()].citationVerseRange,
			markdown,
		};

		this.bibeltextCache.set(ref.toRefNr(), text);

		return text;
	}

	private renterToMarkdown(data: ApiResponse["ranges"]["index"]): string {
		let content = "";

		const firstVerse = data.verses[0];
		let wolLink =
			`https://wol.jw.org/de/wol/b/r10/lp-x/nwtsty/${firstVerse.bookNumber}/${firstVerse.chapterNumber}`;
		wolLink +=
			`#v=${firstVerse.bookNumber}:${firstVerse.chapterNumber}:${firstVerse.verseNumber}`;
		if (data.verses.length > 1) {
			const lastVerse = data.verses.at(-1);
			wolLink +=
				`-${lastVerse?.bookNumber}:${lastVerse?.chapterNumber}:${lastVerse?.verseNumber}`;
		}

		// Create title
		content += `### ${data.citation} ([WOL](${wolLink}))`;
		content += "\n";
		content += "---";
		content += "\n";

		// Add verses
		data.verses.forEach((verse) => {
			// Create DOM tree
			const dom = sanitizeHTMLToDom(verse.content);

			Array.from(dom.children)
				.forEach((para) => {
					// Transform verse/chapter numbers
					function checkAndReturnChapterNo(para: Element): string {
						if (para.children.length == 0) return "";
						const firstChild = para.children[0];
						let text = "";
						if (firstChild.classList.contains("verseNum")) {
							text = "&nbsp;&nbsp;**" +
								para.children[0].textContent + "**";
							para.children[0].remove();
						} else if (
							firstChild.classList.contains("chapterNum")
						) {
							text = "&nbsp;&nbsp;**1 **";
							para.children[0].remove();
						}
						return text;
					}

					// Render text
					if (
						para.classList.contains("parabreak") ||
						para.classList.contains("newblock")
					) {
						content += "\n";
					} else if (para.classList.contains("style-b")) {
						content += checkAndReturnChapterNo(para);
						content += para.textContent;
					} else if (para.classList.contains("style-l")) {
						content += `<span class="first indented">${
							checkAndReturnChapterNo(para)
						}${para.textContent}</span>`;
					} else if (para.classList.contains("style-z")) {
						// Paragraph number should never appear?
						content +=
							`<span class="indented">${para.textContent}</span>`;
					} else {
						console.error("Unknown paragraph type");
					}
				});
		});

		// Remove duplicate line breaks (introduced by parabreak followed by
		// newblock).
		content = content.replace(/\n+/g, "\n");

		return content;
	}
}
