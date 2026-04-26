import { requestUrl } from "obsidian";
import { filter, firstValueFrom, Subject } from "rxjs";

const BASE_URL = 'https://www.jw.org/de/bibliothek/bibel/studienbibel/buecher/json/html/';

const COLLECT_DELAY = 80;
const MAX_REFS = 8;
const MAX_CONCURRENT = 4;
const BACKOFF_DELAYS = [500, 1000, 2000];

// Collects API Requests and batches them
// Does not do caching
export class ApiProxy {
	private queue: string[] = [];
	private activeRequests = 0;
	private maxConcurrent = MAX_CONCURRENT;
	private collectionWindowActive = false;
	private resultSubject: Subject<ApiResponse> = new Subject();

	public constructor() {}

	public async request(ref: string): Promise<ApiResponse> {
		this.queue.push(ref);
		if (!this.collectionWindowActive && this.activeRequests === 0) {
			this.collectionWindowActive = true;
			setTimeout(() => {
				this.collectionWindowActive = false;
				this.launchWorkers();
			}, COLLECT_DELAY);
		}
		return firstValueFrom(
			this.resultSubject.pipe(filter((res) => !!res.ranges[ref]))
		);
	}

	private launchWorkers() {
		while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
			this.activeRequests++;
			void this.doRequest();
		}
	}

	private async doRequest(refs?: string[], attempt = 0) {
		if (refs === undefined) {
			refs = this.queue.splice(0, MAX_REFS);
		}

		const path = refs.join(',');
		const url = BASE_URL + path;

		if (attempt > 0) {
			console.log(`[bibeltext] Retrying ${refs.length} ref(s): ${path} (attempt ${attempt + 1}/${BACKOFF_DELAYS.length + 1})`);
		} else {
			console.log(`[bibeltext] Fetching ${refs.length} ref(s): ${path}`);
		}

		let response: ApiResponse;
		try {
			response = await requestUrl(url).json;
		} catch (err) {
			this.maxConcurrent = Math.max(1, Math.floor(this.maxConcurrent / 2));
			console.warn(`[bibeltext] Request failed, reducing maxConcurrent to ${this.maxConcurrent}`, err);

			if (attempt < BACKOFF_DELAYS.length) {
				const delay = BACKOFF_DELAYS[attempt];
				setTimeout(() => void this.doRequest(refs, attempt + 1), delay);
				return;
			}

			console.error(`[bibeltext] All retries exhausted for refs [${path}]`);
			this.activeRequests--;
			this.launchWorkers();
			return;
		}

		console.log(`[bibeltext] Response received — ${Object.keys(response.ranges).length} range(s) returned`);
		this.resultSubject.next(response);

		if (this.queue.length > 0) {
			void this.doRequest();
		} else {
			this.activeRequests--;
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
