import { App, HoverParent, HoverPopover, MarkdownRenderer, MarkdownView, Plugin } from 'obsidian';
import { createSettings, Settings } from 'settings';
import { BibelResolver } from 'bibelresolver';
import { SpaceRemover } from 'space-remover';


export default class BibeltextPlugin extends Plugin {
	private settings: Settings;
	private resolver: BibelResolver;

	async onload() {
		this.settings = await createSettings(this);
		this.resolver = new BibelResolver();

		new SpaceRemover(this, this.settings);

		this.registerPostProcessors();
	}

	onunload(): void {
		this.app.workspace.getLeavesOfType('markdown')
			.map(l => l.view as MarkdownView)
			.forEach(v => v.previewMode.rerender(true));
	}

	private registerPostProcessors() {
		// Mark all bibeltext-tags with a class
		let markerPP = this.registerMarkdownPostProcessor((element, _) => {
			Array.from(element.querySelectorAll('a.tag'))
				.filter(t => t.textContent?.startsWith('#b/'))
				.map(t => { t.setAttribute('tag', t.textContent as string); return t })
				.forEach(t => t.addClass('bibeltext-tag'));
		});
		markerPP.sortOrder = 20; // Just lower than hoverListenerPP.

		// Render human readable text
		let bibeltextRendererPP = this.registerMarkdownPostProcessor((element) => {
			Array.from(element.querySelectorAll('a.bibeltext-tag'))
				.forEach(async t => {
					const human = await this.resolver.getDisplayText(t.getAttribute('tag') as string);
					if (typeof human != 'string') { console.warn('Couldnt render bibeltext:', human.error); return; }
					t.innerHTML = human; // innerHTML to apply &nbsp;
					// Overwrite the onclick listener so that search still works.
					t.addEventListener('click', (e) => {
						//@ts-ignore
						this.app.internalPlugins.getEnabledPluginById('global-search')?.openGlobalSearch('tag:' + t.getAttribute('tag'));
						e.stopImmediatePropagation();
					});
				});
		});
		bibeltextRendererPP.sortOrder = 24; // Just higher than markerPP.

		// Register Listeners for mouseover events
		let hoverListenerPP = this.registerMarkdownPostProcessor((element) => {
			Array.from(element.querySelectorAll('a.bibeltext-tag'))
				.map((t: Element) => t as HTMLElement)
				.forEach((t) => this.registerDomEvent(t, 'mouseover', () => {
					this.showPopup(t);
				}));
		});
		hoverListenerPP.sortOrder = 25; // Just higher than markerPP.
	}

	private async showPopup(tag: HTMLElement) {
		const tagtext = tag.getAttribute('tag');
		if (!tagtext) { console.warn('Empty tag??'); return; }

		const bibeltext = await this.resolver.resolveText(tagtext);
		if (!bibeltext.success) {
			console.warn('Error fetching Bibeltext:', bibeltext.error);
			return;
		}

		const parent = this.app.workspace.getLeavesOfType('markdown')
			.map(l => l.view)
			.filter(v => v.containerEl.contains(tag))
			.map(v => v as MarkdownView)
			.map(v => v.previewMode);

		if (parent.length == 0) {
			// Maybe inside of a popup
			console.error('No parent');
		} else {
			new BibeltextPopover(this.app, parent[0], tag, bibeltext.markdown);
		}
	}
}

class BibeltextPopover extends HoverPopover {
	constructor(app: App, parent: HoverParent, target: Element, content: string) {
		super(parent, target as HTMLElement, 300);
		this.hoverEl.addClass('bibeltext-popover');
		this.hoverEl.empty();
		this.hoverEl.innerHTML = 
		`<div class="markdown-embed is-loaded">
			<div class="markdown-embed-content node-insert-event">
				<div class="markdown-preview-view markdown-rendered node-insert-event show-indentation-guide allow-fold-headings allow-fold-lists">
					<div class="markdown-preview-sizer markdown-preview-section" style="padding-bottom: 0px; min-height: 23px;">
					</div>
				</div>
			</div>
		</div>`;
		const targetEl = this.hoverEl.querySelector('div.markdown-preview-section');
		MarkdownRenderer.render(app, content, targetEl as HTMLElement, '', this);
	}
}
