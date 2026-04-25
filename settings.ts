import { Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { BibelResolver } from 'bibelresolver';

export async function createSettings(plugin: Plugin, resolver: BibelResolver): Promise<void> {
	plugin.addSettingTab(new SettingsTab(plugin, resolver));
}

class SettingsTab extends PluginSettingTab {
	private resolver: BibelResolver;

	constructor(plugin: Plugin, resolver: BibelResolver) {
		super(plugin.app, plugin);
		this.resolver = resolver;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const stats = this.resolver.getCacheStats();
		const mb = (stats.bytes / 1024 / 1024).toFixed(2);

		new Setting(containerEl)
			.setName('Cache')
			.setDesc(`${stats.entries} entries · ~${mb} MB`);

		new Setting(containerEl)
			.setName('Clear cache')
			.setDesc('Remove all cached verse data. It will be re-fetched on next use.')
			.addButton(btn => btn
				.setButtonText('Clear')
				.onClick(() => {
					this.resolver.clearCache();
					this.display();
				})
			);

		let scanStatusEl: HTMLElement;

		const scanSetting = new Setting(containerEl)
			.setName('Build cache')
			.setDesc('Find all Bible tags in your vault and pre-fetch their content.')
			.addButton(btn => {
				btn.setButtonText('Build cache').onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText('Building…');
					await this.buildCache(scanStatusEl);
					btn.setDisabled(false);
					btn.setButtonText('Build cache');
					this.display();
				});
			});

		scanStatusEl = scanSetting.descEl.createEl('div');
	}

	private async buildCache(statusEl: HTMLElement): Promise<void> {
		const files: TFile[] = this.app.vault.getMarkdownFiles();
		const tagRegex = /#b\/\w+\/\d+(?:\/[\d-]+)?/g;
		const allTags = new Set<string>();

		for (const file of files) {
			const content = await this.app.vault.cachedRead(file);
			const matches = content.match(tagRegex);
			if (matches) matches.forEach(t => allTags.add(t));
		}

		const tags = Array.from(allTags);
		statusEl.setText(`Fetching 0/${tags.length}…`);

		let completed = 0;
		let failed = 0;

		// Submit all at once — the proxy collects and batches them automatically.
		await Promise.all(tags.map(async tag => {
			const result = await this.resolver.resolveText(tag);
			completed++;
			if (!result.success) failed++;
			statusEl.setText(`Fetching ${completed}/${tags.length}…`);
		}));

		const summary = failed > 0
			? `Done: ${completed - failed} fetched, ${failed} failed.`
			: `Done: ${completed} tags fetched.`;
		statusEl.setText(summary);
	}
}
