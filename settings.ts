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
			.setName('Scan for uncached tags')
			.setDesc('Find all Bible tags in your vault and pre-fetch their content.')
			.addButton(btn => {
				btn.setButtonText('Scan').onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText('Scanning…');
					await this.scanAndCache(scanStatusEl);
					btn.setDisabled(false);
					btn.setButtonText('Scan');
					this.display();
				});
			});

		scanStatusEl = scanSetting.descEl.createEl('div');
	}

	private async scanAndCache(statusEl: HTMLElement): Promise<void> {
		const files: TFile[] = this.app.vault.getMarkdownFiles();
		const tagRegex = /#b\/\w+\/\d+(?:\/[\d-]+)?/g;
		const allTags = new Set<string>();

		for (const file of files) {
			const content = await this.app.vault.cachedRead(file);
			const matches = content.match(tagRegex);
			if (matches) matches.forEach(t => allTags.add(t));
		}

		const tags = Array.from(allTags);
		let fetched = 0;
		let failed = 0;

		for (let i = 0; i < tags.length; i++) {
			statusEl.setText(`Fetching ${i + 1}/${tags.length}…`);
			const result = await this.resolver.resolveText(tags[i]);
			if (result.success) fetched++;
			else failed++;
		}

		const summary = failed > 0
			? `Done: ${fetched} fetched, ${failed} failed.`
			: `Done: ${fetched} tags fetched.`;
		statusEl.setText(summary);
	}
}
