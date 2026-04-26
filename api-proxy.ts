import { requestUrl } from "obsidian";
import { filter, tap, firstValueFrom, Subject } from "rxjs";

const BASE_URL = 'https://www.jw.org/de/bibliothek/bibel/studienbibel/buecher/json/html/';

const COLLECT_DELAY = 80;
const MAX_REFS = 8;

// Collects API Requests and batches them
// Does not do caching
export class ApiProxy {
	private queue: string[] = [];
	private pendingRequest: boolean = false;
	private resultSubject: Subject<ApiResponse> = new Subject();

	public constructor() {
	}

	public async request(ref: string): Promise<ApiResponse> {
		this.queue.push(ref);
		if (!this.pendingRequest) {
			this.scheduleRequest();
		}
		return firstValueFrom(
			this.resultSubject.pipe(filter((res) => !!res.ranges[ref]))
		);
	}

	private scheduleRequest() {
		this.pendingRequest = true;
		setTimeout(() => {
			this.doRequest();
		}, COLLECT_DELAY);
	}

	private async doRequest() {
		const refs = this.queue.splice(0, MAX_REFS);
		const path = refs.join(',');
		const url = BASE_URL + path;

		console.log(`[bibeltext] Fetching ${refs.length} ref(s): ${path}`);
		let response: ApiResponse;
		try {
			response = await requestUrl(url).json;
		} catch (err) {
			console.error(`[bibeltext] Network request failed for refs [${path}]:`, err);
			this.pendingRequest = false;
			if (this.queue.length > 0) {
				this.scheduleRequest();
			}
			return;
		}

		console.log(`[bibeltext] Response received — ${Object.keys(response.ranges).length} range(s) returned`);
		this.resultSubject.next(response);
		this.pendingRequest = false;

		if (this.queue.length > 0) {
			this.scheduleRequest();
		}
	}
}

export interface ApiResponse {
	ranges: {
		[index: string]: {
			citation: string;
			html: string;
			citationVerseRange: string;
			crossReferences: {
				id: number,
				source: string,
				targets: {
					vs: string,
					standardCitation: string,
					abbreviatedCitation: string,
				}[];
			}[];
			verses: {
				vsID: string,
				bookNumber: number,
				chapterNumber: number,
				verseNumber: number,
				standardCitation: string,
				abbreviatedCitation: string,
				content: string,
			}[];
		};
	};
	editionData: {
		books: {
			[index: string]: {
				standardName: string;
				standardAbbreviation: string;
				officialAbbreviation: string;
			};
		};
	};
}
