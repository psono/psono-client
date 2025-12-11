import widgetService from './widget';

import datastoreService from './datastore';
import datastorePasswordService from './datastore-password';
import datastoreUserService from './datastore-user';
import shareService from './share';

describe('Service: widgetService - moveItem test suite', function() {

    let getPasswordDatastoreSpy;
    let datastoreSaveDatastoreContentSpy;
    let handleDatastoreContentChangedSpy;
    let getDatastoreWithIdSpy;
    let saveUserDatastoreContentSpy;
    let writeShareSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        global.alert = jest.fn();

        // Spy on only the specific methods that make external API calls
        getPasswordDatastoreSpy = jest.spyOn(datastorePasswordService, 'getPasswordDatastore');
        handleDatastoreContentChangedSpy = jest.spyOn(datastorePasswordService, 'handleDatastoreContentChanged').mockImplementation(() => {});

        getDatastoreWithIdSpy = jest.spyOn(datastoreService, 'getDatastoreWithId');

        // Spy on the actual backend calls
        datastoreSaveDatastoreContentSpy = jest.spyOn(datastoreService, 'saveDatastoreContent').mockResolvedValue();
        saveUserDatastoreContentSpy = jest.spyOn(datastoreUserService, 'saveDatastoreContent').mockResolvedValue();

        // Spy on share service API calls
        writeShareSpy = jest.spyOn(shareService, 'writeShare').mockResolvedValue();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('moveItem - basic functionality', () => {

        it('should return early if type is neither items nor folders', async () => {
            const datastore = { datastore_id: 'ds1' };
            const itemPath = ['item1'];
            const targetPath = ['folder1'];

            await widgetService.moveItem(datastore, itemPath, targetPath, 'invalid', 'password');

            expect(getPasswordDatastoreSpy).not.toHaveBeenCalled();
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();
            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should handle moving an item to a new folder in password datastore', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            expect(handleDatastoreContentChangedSpy).toHaveBeenCalled();

            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Target Folder',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should handle moving a folder to a new location', async () => {
            const mockFolder = {
                id: 'folder1',
                name: 'Test Folder',
                folders: [],
                items: [],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder2',
                name: 'Target Folder',
                folders: [],
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget, mockFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1'],
                ['folder2'],
                'folders',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');

            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder2',
                    name: 'Target Folder',
                    folders: [{
                        id: 'folder1',
                        name: 'Test Folder',
                        folders: [],
                        items: []
                    }],
                    items: []
                }],
                items: []
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should handle moving item to root (null targetPath)', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockFolder = {
                id: 'folder1',
                name: 'Folder',
                items: [mockItem],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1', 'item1'],
                null,
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');

            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Folder',
                    items: []
                }],
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should handle moving item to undefined targetPath', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockFolder = {
                id: 'folder1',
                name: 'Folder',
                items: [mockItem],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1', 'item1'],
                undefined,
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');

            // undefined targetPath is treated like null, so item moves to root
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Folder',
                    items: []
                }],
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should handle nested folder moves', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSubFolder = {
                id: 'subfolder1',
                name: 'Sub Folder',
                items: [mockItem],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSourceFolder = {
                id: 'folder1',
                name: 'Source Folder',
                folders: [mockSubFolder],
                items: [],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTargetFolder = {
                id: 'folder2',
                name: 'Target Folder',
                items: [],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockSourceFolder, mockTargetFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1', 'subfolder1', 'item1'],
                ['folder2'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');

            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [
                    {
                        id: 'folder1',
                        name: 'Source Folder',
                        folders: [{
                            id: 'subfolder1',
                            name: 'Sub Folder',
                            items: []
                        }],
                        items: []
                    },
                    {
                        id: 'folder2',
                        name: 'Target Folder',
                        items: [{
                            id: 'item1',
                            name: 'Test Item',
                            type: 'website_password',
                            secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                            secret_key: 'secret_key',
                        }]
                    }
                ],
                items: []
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });
    });

    describe('moveItem - permission checks', () => {

        it('should prevent moving item without write rights on target', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                items: [],
                share_rights: { read: true, write: false, grant: false, delete: false }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            expect(global.alert).toHaveBeenCalledWith("Sorry, but you don't have write rights on target");
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();
            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should prevent moving share without grant rights to different share', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: false, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                share_id: 'share2',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            expect(global.alert).toHaveBeenCalledWith('Sorry, but you cannot move a share without grant rights into another share.');
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();
            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should allow moving item with type "user" even without grant rights', async () => {
            const mockItem = {
                id: 'user1',
                name: 'Test User',
                type: 'user',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: false, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                share_id: 'share2',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['user1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // User type items bypass permission checks
            expect(global.alert).not.toHaveBeenCalled();
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();

            // Since moving to a shared folder, share should be written
            expect(writeShareSpy).toHaveBeenCalled();
        });

        it('should check permissions recursively for folders with items', async () => {
            const mockItemWithoutGrant = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: false, delete: true }
            };

            const mockFolder = {
                id: 'folder1',
                name: 'Test Folder',
                items: [mockItemWithoutGrant],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'target1',
                name: 'Target Folder',
                share_id: 'share2',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockFolder, mockTarget],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1'],
                ['target1'],
                'folders',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Should alert about the nested item without grant rights
            expect(global.alert).toHaveBeenCalledWith('Sorry, but you cannot move a share without grant rights into another share.');
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();
            expect(writeShareSpy).not.toHaveBeenCalled();
        });
    });

    describe('moveItem - user datastore type', () => {

        it('should handle moving item in user datastore', async () => {
            const mockItem = {
                id: 'user1',
                name: 'Test User',
                type: 'user',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockFolder = {
                id: 'folder1',
                name: 'Folder',
                items: [mockItem],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockFolder],
                items: []
            };

            getDatastoreWithIdSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1', 'user1'],
                null,
                'items',
                'user'
            );

            expect(getDatastoreWithIdSpy).toHaveBeenCalledWith('ds1');

            // Verify the datastore is properly updated with correct values
            expect(saveUserDatastoreContentSpy).toHaveBeenCalled();
            const [datastore, paths] = saveUserDatastoreContentSpy.mock.calls[0];

            expect(datastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Folder',
                    items: [],
                    parent_datastore_id: 'ds1',
                    path: ['folder1'],
                    share_rights: { read: true, write: true, grant: true, delete: true }
                }],
                items: [{
                    id: 'user1',
                    name: 'Test User',
                    type: 'user',
                    parent_datastore_id: 'ds1',
                    path: ['user1'],
                    share_rights: { read: true, write: true, grant: true, delete: true }
                }]
            });

            expect(paths).toEqual([['folder1'], []]);
            expect(writeShareSpy).not.toHaveBeenCalled();
        });
    });

    describe('moveItem - error handling', () => {

        it('should handle element not found gracefully', async () => {
            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            // When element is not found, findInDatastore throws RangeError
            // and moveItem catches it gracefully
            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['nonexistent'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();
            expect(writeShareSpy).not.toHaveBeenCalled();
        });
    });

    describe('moveItem - target array creation', () => {

        it('should create items array if target does not have one', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                // Note: no items array initially
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Target Folder',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should create folders array if target does not have one', async () => {
            const mockFolder = {
                id: 'folder1',
                name: 'Test Folder',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder2',
                name: 'Target Folder',
                // Note: no folders array initially
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget, mockFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1'],
                ['folder2'],
                'folders',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder2',
                    name: 'Target Folder',
                    folders: [{
                        id: 'folder1',
                        name: 'Test Folder'
                    }]
                }],
                items: []
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });
    });

    describe('moveItem - parent ID updates', () => {

        it('should update parent_datastore_id when moving from share to datastore', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                null,
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [],
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });

            expect(writeShareSpy).not.toHaveBeenCalled();
        });

        it('should update parent_share_id when moving from datastore to share', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Target Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });

            // Verify the share is written separately
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key');
            expect(shareData).toEqual({
                id: 'folder1',
                name: 'Target Folder',
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });
        });
    });

    describe('moveItem - shared folder operations with share content verification', () => {

        it('should save correct datastore structure when moving item into a shared folder', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSharedFolder = {
                id: 'shared1',
                name: 'Shared Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key_1',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockSharedFolder],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['shared1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is updated (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'shared1',
                    name: 'Shared Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key_1',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });

            // Verify the share is written separately
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key_1');
            expect(shareData).toEqual({
                id: 'shared1',
                name: 'Shared Folder',
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });
        });

        it('should save correct content when moving item between shared folders', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSourceShare = {
                id: 'shared1',
                name: 'Source Share',
                share_id: 'share1',
                share_secret_key: 'secret_key_1',
                items: [mockItem],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTargetShare = {
                id: 'shared2',
                name: 'Target Share',
                share_id: 'share2',
                share_secret_key: 'secret_key_2',
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockSourceShare, mockTargetShare],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['shared1', 'item1'],
                ['shared2'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // When moving between shares, only the shares are written (not the datastore)
            expect(datastoreSaveDatastoreContentSpy).not.toHaveBeenCalled();

            // Verify both shares are written separately
            expect(writeShareSpy).toHaveBeenCalledTimes(2);

            // Check target share (share2) - item added (written first)
            const [shareId1, shareData1, shareSecretKey1] = writeShareSpy.mock.calls[0];
            expect(shareId1).toBe('share2');
            expect(shareSecretKey1).toBe('secret_key_2');
            expect(shareData1).toEqual({
                id: 'shared2',
                name: 'Target Share',
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });

            // Check source share (share1) - item removed (written second)
            const [shareId2, shareData2, shareSecretKey2] = writeShareSpy.mock.calls[1];
            expect(shareId2).toBe('share1');
            expect(shareSecretKey2).toBe('secret_key_1');
            expect(shareData2).toEqual({
                id: 'shared1',
                name: 'Source Share',
                items: []
            });
        });

        it('should save correct content when moving item from shared folder to datastore root', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSharedFolder = {
                id: 'shared1',
                name: 'Shared Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key_1',
                items: [mockItem],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockSharedFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['shared1', 'item1'],
                null,
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is updated (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'shared1',
                    name: 'Shared Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key_1',
                    items: []
                }],
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });

            // Verify the share is written (item removed from share)
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key_1');
            expect(shareData).toEqual({
                id: 'shared1',
                name: 'Shared Folder',
                items: []
            });
        });

        it('should save correct content when moving folder with nested items into shared folder', async () => {
            const mockNestedItem = {
                id: 'item1',
                name: 'Nested Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockFolder = {
                id: 'folder1',
                name: 'Folder with Items',
                items: [mockNestedItem],
                folders: [],
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSharedFolder = {
                id: 'shared1',
                name: 'Shared Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key_1',
                folders: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockFolder, mockSharedFolder],
                items: []
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['folder1'],
                ['shared1'],
                'folders',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is updated (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'shared1',
                    name: 'Shared Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key_1',
                    folders: [{
                        id: 'folder1',
                        name: 'Folder with Items',
                        items: [{
                            id: 'item1',
                            name: 'Nested Item',
                            type: 'website_password',
                            secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                            secret_key: 'secret_key',
                        }],
                        folders: []
                    }]
                }],
                items: []
            });

            // Verify the share is written with nested folder and items
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key_1');
            expect(shareData).toEqual({
                id: 'shared1',
                name: 'Shared Folder',
                folders: [{
                    id: 'folder1',
                    name: 'Folder with Items',
                    items: [{
                        id: 'item1',
                        name: 'Nested Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }],
                    folders: []
                }]
            });
        });

        it('should save correct content for deeply nested shared folder structure', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSubFolder = {
                id: 'subfolder1',
                name: 'Sub Folder',
                items: [],
                parent_share_id: 'share1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockSharedFolder = {
                id: 'shared1',
                name: 'Shared Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key_1',
                folders: [mockSubFolder],
                items: [],
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockSharedFolder],
                items: [mockItem]
            };

            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['shared1', 'subfolder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify the datastore is updated (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'shared1',
                    name: 'Shared Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key_1',
                    folders: [{
                        id: 'subfolder1',
                        name: 'Sub Folder',
                        items: [{
                            id: 'item1',
                            name: 'Test Item',
                            type: 'website_password',
                            secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                            secret_key: 'secret_key',
                        }]
                    }],
                    items: []
                }],
                items: []
            });

            // Verify the share is written with deeply nested structure
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key_1');
            expect(shareData).toEqual({
                id: 'shared1',
                name: 'Shared Folder',
                folders: [{
                    id: 'subfolder1',
                    name: 'Sub Folder',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });
        });
    });

    describe('moveItem - share rights inheritance', () => {

        it('should update datastore with inherited share_rights when moving item to folder with share', async () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                type: 'website_password',
                secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                secret_key: 'secret_key',
                parent_datastore_id: 'ds1',
                share_rights: { read: true, write: true, grant: true, delete: true }
            };

            const mockTarget = {
                id: 'folder1',
                name: 'Target Folder',
                share_id: 'share1',
                share_secret_key: 'secret_key',
                items: [],
                share_rights: { read: true, write: true, grant: false, delete: true }
            };

            const mockDatastore = {
                datastore_id: 'ds1',
                folders: [mockTarget],
                items: [mockItem]
            };

            const updateParentsSpy = jest.spyOn(datastorePasswordService, 'updateParents').mockImplementation(() => {});
            getPasswordDatastoreSpy.mockResolvedValue(mockDatastore);

            await widgetService.moveItem(
                { datastore_id: 'ds1' },
                ['item1'],
                ['folder1'],
                'items',
                'password'
            );

            expect(getPasswordDatastoreSpy).toHaveBeenCalledWith('ds1');
            // Verify updateParents was called to update share rights
            expect(updateParentsSpy).toHaveBeenCalled();

            // Verify the datastore is properly updated with correct values (normalized for backend)
            expect(datastoreSaveDatastoreContentSpy).toHaveBeenCalled();
            const [type, description, savedDatastore] = datastoreSaveDatastoreContentSpy.mock.calls[0];

            expect(type).toBe('password');
            expect(description).toBe('default');
            expect(savedDatastore).toEqual({
                datastore_id: 'ds1',
                folders: [{
                    id: 'folder1',
                    name: 'Target Folder',
                    share_id: 'share1',
                    share_secret_key: 'secret_key',
                    items: [{
                        id: 'item1',
                        name: 'Test Item',
                        type: 'website_password',
                        secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                        secret_key: 'secret_key',
                    }]
                }],
                items: []
            });

            // Verify the share is written with inherited share_rights
            expect(writeShareSpy).toHaveBeenCalled();
            const [shareId, shareData, shareSecretKey] = writeShareSpy.mock.calls[0];

            expect(shareId).toBe('share1');
            expect(shareSecretKey).toBe('secret_key');
            expect(shareData).toEqual({
                id: 'folder1',
                name: 'Target Folder',
                items: [{
                    id: 'item1',
                    name: 'Test Item',
                    type: 'website_password',
                    secret_id: '997a6f40-17b0-4699-a32d-22fca494f295',
                    secret_key: 'secret_key',
                }]
            });
        });
    });
});
