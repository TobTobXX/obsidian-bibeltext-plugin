import { Plugin, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import { BehaviorSubject, } from 'rxjs';

const DEFAULTS = {
	removeFormattingSpace: true,
	offlineMode: false,
};

export async function createSettings(plugin: Plugin): Promise<Settings> {
	const { removeFormattingSpace, offlineMode } = await plugin.loadData() ?? DEFAULTS;

	const manager = new SettingsManager(plugin, { removeFormattingSpace, offlineMode });

	return manager;
}

export interface Settings {
	removeFormattingSpace: BehaviorSubject<boolean>;
	offlineMode: BehaviorSubject<boolean>;
}

class SettingsManager implements Settings {
	removeFormattingSpace: BehaviorSubject<boolean>;
	offlineMode: BehaviorSubject<boolean>;

	private plugin: Plugin;

	constructor(plugin: Plugin, initalData: { removeFormattingSpace: boolean, offlineMode: boolean }) {
		this.removeFormattingSpace = new BehaviorSubject(initalData.removeFormattingSpace);
		this.offlineMode = new BehaviorSubject(initalData.offlineMode);

		this.plugin = plugin;

		this.removeFormattingSpace.subscribe(this.saveData.bind(this));
		this.offlineMode.subscribe(this.saveData.bind(this));

		plugin.addSettingTab(new SettingsTab(plugin, this));
	}

	private saveData() {
		this.plugin.saveData({
			removeFormattingSpace: this.removeFormattingSpace.getValue(),
			offlineMode: this.offlineMode.getValue(),
		});
	}
}


class SettingsTab extends PluginSettingTab {
	private settings: Settings;

	constructor(plugin: Plugin, settings: Settings) {
		super(plugin.app, plugin);
		this.settings = settings;
	}

	display(): void {
		this.containerEl.empty();

		new Setting(this.containerEl)
			.setName('Remove formatting space')
			.setDesc('Whether to remove a space between an opening parenthesis and a tag.')
			.addToggle(toggle => toggle
				.setValue(this.settings.removeFormattingSpace.getValue())
				.onChange(value => {
					this.settings.removeFormattingSpace.next(value);
				})
			);

		let offlineSetting = new Setting(this.containerEl)
			.setName('Download the bible for offline use')
			.addToggle(toggle => toggle
				.setValue(this.settings.offlineMode.getValue())
				.onChange(value => {
					this.settings.offlineMode.next(value);
				})
			);

		this.settings.offlineMode.subscribe((value) => {
			let message = value
				? 'Disabling this setting will delete the downloaded Bible to save ~TODO MB storage'
				: 'Enabling will start downloading the bible.';
			offlineSetting.setDesc(message);
		});
	}
}
