import {
	App,
	HoverParent,
	HoverPopover,
	MarkdownRenderer,
	MarkdownView,
	Plugin,
} from "obsidian";
import { createSettings } from "settings";
import { BibelResolver } from "bibelresolver";
import { SpaceRemover } from "space-remover";
import { platform } from "os";

export default class BibeltextPlugin extends Plugin {
	private resolver: BibelResolver;

	async onload() {
		this.resolver = new BibelResolver();
		await createSettings(this, this.resolver);

		new SpaceRemover(this);

		this.registerPostProcessors();
	}

	onunload(): void {
		this.app.workspace.getLeavesOfType("markdown")
			.map((l) => l.view as MarkdownView)
			.forEach((v) => v.previewMode.rerender(true));
	}

	private registerPostProcessors() {
		// Mark all bibeltext-tags with a class
		let markerPP = this.registerMarkdownPostProcessor((element, _) => {
			Array.from(element.querySelectorAll("a.tag"))
				.filter((t) => t.textContent?.startsWith("#b/"))
				.map((t) => {
					t.setAttribute("tag", t.textContent as string);
					return t;
				})
				.forEach((t) => t.addClass("bibeltext-tag"));
		});
		markerPP.sortOrder = 20; // Just lower than hoverListenerPP.

		// Render human readable text
		let bibeltextRendererPP = this.registerMarkdownPostProcessor(
			(element) => {
				Array.from(element.querySelectorAll("a.bibeltext-tag"))
					.forEach(async (t) => {
						const tagtext = t.getAttribute("tag") as string;
						const bibeltext = await this.resolver.resolveText(tagtext);
						if (!bibeltext.success) {
							console.warn(
								`[bibeltext] Couldn't render "${tagtext}":`,
								bibeltext.error,
							);
							return;
						}
						const abbr = await this.resolver.getDisplayText(tagtext);
						if (typeof abbr != "string") {
							console.warn(
								`[bibeltext] Couldn't render "${tagtext}":`,
								abbr.error,
							);
							return;
						}
						t.innerHTML = abbr; // innerHTML to apply &nbsp;
						if (bibeltext.wolLink) {
							t.setAttribute("data-wol", bibeltext.wolLink);
						}
						// Overwrite the onclick listener so that search still works.
						this.registerDomEvent(
							t as HTMLElement,
							"click",
							(e) => {
								const wolLink = t.getAttribute("data-wol");
								if (wolLink) {
									window.open(wolLink, "_blank");
								} else {
									//@ts-ignore
									this.app.internalPlugins.getEnabledPluginById(
										"global-search",
									)?.openGlobalSearch(
										"tag:" + tagtext,
									);
								}
								e.stopImmediatePropagation();
							},
						);
					});
			},
		);
		bibeltextRendererPP.sortOrder = 24; // Just higher than markerPP.

		// Register Listeners for mouseover events
		let hoverListenerPP = this.registerMarkdownPostProcessor((element) => {
			Array.from(element.querySelectorAll("a.bibeltext-tag"))
				.map((t: Element) => t as HTMLElement)
				.forEach((t) => {
					this.registerDomEvent(t, "mouseover", () => {
						this.showPopup(t);
					});
					registerLongTouch(this, t, () => {
						this.showPopup(t);
					});
				});
		});
		hoverListenerPP.sortOrder = 25; // Just higher than markerPP.
	}

	private async showPopup(tag: HTMLElement) {
		const tagtext = tag.getAttribute("tag");
		if (!tagtext) {
			console.warn("Empty tag??");
			return;
		}

		const bibeltext = await this.resolver.resolveText(tagtext);
		if (!bibeltext.success) {
			console.warn(`[bibeltext] Couldn't fetch "${tagtext}":`, bibeltext.error);
			return;
		}

		const parent = this.app.workspace.getLeavesOfType("markdown")
			.map((l) => l.view)
			.filter((v) => v.containerEl.contains(tag))
			.map((v) => v as MarkdownView)
			.map((v) => v.previewMode);

		if (parent.length == 0) {
			// Maybe inside of a popup
			console.error(`[bibeltext] No parent MarkdownView found for tag "${tagtext}"`);
		} else {
			new BibeltextPopover(this.app, parent[0], tag, bibeltext.markdown);
		}
	}
}

class BibeltextPopover extends HoverPopover {
	constructor(
		app: App,
		parent: HoverParent,
		target: Element,
		content: string,
	) {
		super(parent, target as HTMLElement, 300);
		this.hoverEl.addClass("bibeltext-popover");
		this.hoverEl.empty();
		this.hoverEl.innerHTML = `<div class="markdown-embed is-loaded">
			<div class="markdown-embed-content node-insert-event">
				<div class="markdown-preview-view markdown-rendered node-insert-event show-indentation-guide allow-fold-headings allow-fold-lists">
					<div class="markdown-preview-sizer markdown-preview-section" style="padding-bottom: 0px; min-height: 23px;">
					</div>
				</div>
			</div>
		</div>`;
		const targetEl = this.hoverEl.querySelector(
			"div.markdown-preview-section",
		);
		MarkdownRenderer.render(
			app,
			content,
			targetEl as HTMLElement,
			"",
			this,
		);
	}
}

function registerLongTouch(
	plugin: Plugin,
	element: HTMLElement,
	callback: Function,
) {
	let timer: number | null;

	plugin.registerDomEvent(element, "touchstart", () => {
		timer = window.setTimeout(() => {
			timer = null;
			callback();
		}, 500);
	});

	function cancel() {
		if (timer) clearTimeout(timer);
	}

	plugin.registerDomEvent(element, "touchend", cancel);
	plugin.registerDomEvent(element, "touchmove", cancel);
}
