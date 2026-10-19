const manifest = require('../src/safari/manifest.json');

describe('Safari manifest compatibility', () => {
  it('uses supported permissions and the shared notification-bar resource path', () => {
    expect(manifest.permissions).toEqual([
      'activeTab', 'storage', 'contextMenus', 'tabs', 'clipboardWrite',
      'http://*/*', 'https://*/*', 'unlimitedStorage',
    ]);
    expect(manifest).not.toHaveProperty('applications');
    expect(manifest).not.toHaveProperty('omnibox');
    expect(manifest.web_accessible_resources).toContain('data/notification-bar.html');
    expect(manifest.web_accessible_resources).not.toContain('data/js/extension/notification-bar.html');
  });
});
