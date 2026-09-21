import { App, getIcon, ItemView, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

const VIEW_TYPE = 'ticktick-view';
const PARTITION = 'persist:ticktick';
const SIGNIN_URL = 'https://ticktick.com/signin';

interface ElectronSession {
	cookies: { get(filter: { url: string; name: string }): Promise<unknown[]> };
	clearStorageData(): Promise<void>;
}

// remote is Electron-internal and untyped here; absent on some Obsidian builds.
const session = () =>
	(window.require('electron') as { remote: { session: { fromPartition(p: string): ElectronSession } } }).remote.session.fromPartition(PARTITION);

const icon = () => (getIcon('list-checks') ? 'list-checks' : 'check-circle');

class TickTickView extends ItemView {
	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return 'TickTick';
	}

	getIcon() {
		return icon();
	}

	async onOpen() {
		// 'webview' is not in HTMLElementTagNameMap; the cast only satisfies createEl's typing.
		this.contentEl.createEl('webview' as 'div', {
			cls: 'ticktick-webview',
			attr: {
				src: 'https://ticktick.com/webapp/',
				partition: PARTITION,
				allowpopups: '',
			},
		});
	}

	async onClose() {
		this.contentEl.empty();
	}

	navigate(url: string) {
		this.contentEl.querySelector('webview')?.setAttribute('src', url);
	}
}

export default class TickTickPlugin extends Plugin {
	async onload() {
		this.addSettingTab(new TickTickSettingTab(this.app, this));

		this.registerView(VIEW_TYPE, (leaf) => new TickTickView(leaf));

		this.addRibbonIcon(icon(), 'Open TickTick', () => this.activate(() => this.app.workspace.getLeaf('tab')));

		this.addCommand({
			id: 'open-ticktick',
			name: 'Open TickTick',
			callback: () => this.activate(() => this.app.workspace.getLeaf('tab')),
		});

		this.addCommand({
			id: 'open-ticktick-sidebar',
			name: 'Open TickTick in right sidebar',
			callback: () => this.activate(() => this.app.workspace.getRightLeaf(false)),
		});
	}

	// TickTick keeps its login token in the `t` cookie (unofficial; verify if login detection breaks).
	async isLoggedIn() {
		try {
			return (await session().cookies.get({ url: 'https://ticktick.com', name: 't' })).length > 0;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async login() {
		const leaf = await this.activate(() => this.app.workspace.getLeaf('tab'));
		if (leaf?.view instanceof TickTickView) leaf.view.navigate(SIGNIN_URL);
	}

	// Wipe the webview session (cookies, storage), then reload open views so they show the login page.
	async logout() {
		try {
			await session().clearStorageData();
		} catch (e) {
			console.error(e);
			new Notice('Could not log out of TickTick.');
			return;
		}
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			if (leaf.view instanceof TickTickView) {
				await leaf.view.onClose();
				await leaf.view.onOpen();
			}
		}
		new Notice('Logged out of TickTick.');
	}

	// Reveal the existing view, else create one in the leaf from newLeaf().
	async activate(newLeaf: () => WorkspaceLeaf | null) {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
		if (!leaf) {
			const created = newLeaf();
			if (!created) return;
			await created.setViewState({ type: VIEW_TYPE, active: true });
			leaf = created;
		}
		await workspace.revealLeaf(leaf);
		return leaf;
	}
}

class TickTickSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: TickTickPlugin) {
		super(app, plugin);
	}

	// Obsidian 1.13+: declarative definition, so the setting shows up in settings search.
	getSettingDefinitions() {
		return [
			{
				name: 'Account management',
				desc: 'Log in to or out of TickTick.',
				aliases: ['login', 'logout', 'sign in', 'sign out', 'account'],
				render: (setting: Setting) => this.renderAccount(setting),
			},
		];
	}

	// Fallback for Obsidian before 1.13, which ignores getSettingDefinitions().
	display() {
		this.containerEl.empty();
		this.renderAccount(new Setting(this.containerEl));
	}

	private renderAccount(setting: Setting) {
		setting.setName('Account management');
		void this.plugin.isLoggedIn().then((loggedIn) => {
			setting.controlEl.empty();
			setting
				.setDesc(loggedIn ? 'Logged in to TickTick.' : 'Not logged in to TickTick.')
				.addButton((b) =>
					loggedIn
						? b.setButtonText('Logout').setWarning().onClick(async () => {
								await this.plugin.logout();
								this.renderAccount(setting);
							})
						: b.setButtonText('Login').setCta().onClick(() => {
								// Close the settings modal so the new tab is visible.
								(this.app as App & { setting?: { close(): void } }).setting?.close();
								return this.plugin.login();
							}),
				);
		});
	}
}
