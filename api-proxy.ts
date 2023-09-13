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
			return firstValueFrom(
				this.resultSubject
					.pipe(filter((res) => !!res.ranges[ref]))
			);
		} else {
			return firstValueFrom(
				this.resultSubject
					.pipe(filter((res) => !!res.ranges[ref]))
			);
		}
	}

	private scheduleRequest() {
		this.pendingRequest = true;
		setTimeout(() => {
			this.doRequest();
		}, COLLECT_DELAY);
	}

	private async doRequest() {
		const path = this.queue.splice(0, MAX_REFS).join(',');

		console.debug('Making API request for:', path);
		const response: ApiResponse = await requestUrl(BASE_URL + path).json;

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
