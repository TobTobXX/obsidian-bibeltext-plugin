import { MarkdownPostProcessorContext, MarkdownView, Plugin } from "obsidian";
import { Settings } from "settings";

export class SpaceRemover {
	private settings: Settings;

	public constructor(plugin: Plugin, settings: Settings) {
		this.settings = settings;

		plugin.registerMarkdownPostProcessor(this.removeFormattingSpace.bind(this));

		this.settings.removeFormattingSpace.subscribe(_ => {
			plugin.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
		});
	}

	// Remove space before tag when in parenthesis
	private removeFormattingSpace(element: Element, _ctx: MarkdownPostProcessorContext): void {
		if (!this.settings.removeFormattingSpace.getValue()) return;

		Array.from(element.querySelectorAll('a.tag'))
			.forEach(t => {
				if (!t.previousSibling) return;
				if (t.previousSibling.nodeName != '#text') return;
				if (!t.previousSibling.textContent?.endsWith('( ')) return;

				t.previousSibling.textContent = t.previousSibling.textContent.trimEnd();
			});
	}
}
