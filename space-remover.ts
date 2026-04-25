import { MarkdownPostProcessorContext, Plugin } from "obsidian";

export class SpaceRemover {
	public constructor(plugin: Plugin) {
		plugin.registerMarkdownPostProcessor(this.removeFormattingSpace.bind(this));
	}

	// Remove space before tag when in parenthesis
	private removeFormattingSpace(element: Element, _ctx: MarkdownPostProcessorContext): void {
		Array.from(element.querySelectorAll('a.tag'))
			.forEach(t => {
				if (!t.previousSibling) return;
				if (t.previousSibling.nodeName != '#text') return;
				if (!t.previousSibling.textContent?.endsWith('( ')) return;

				t.previousSibling.textContent = t.previousSibling.textContent.trimEnd();
			});
	}
}
