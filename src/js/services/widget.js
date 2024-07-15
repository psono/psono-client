/**
 * Service that is something like the base class for adf widgets
 */

import secretService from "./secret";
import secretLinkService from "./secret-link";
import cryptoLibrary from "./crypto-library";
import shareService from "./share";
import shareLinkService from "./share-link";
import datastorePasswordService from "./datastore-password";
import fileLinkService from "./file-link";
import datastoreService from "./datastore";
import datastoreUserService from "./datastore-user";
import helper from "./helper";

/**
 * Adds a new folder to the datastore and saves the structures (secret, datastore, share) if necessary
 *
 * @param {TreeObject} parent The parent of the new folder
 * @param {Array} path The path to the parent of the new folder
 * @param {TreeObject} dataStructure the data structure
 * @param {Object} manager manager responsible for
 * @param {String} name The name of the new folder
 */
function newFolderSave(parent, path, dataStructure, manager, name) {
    let onSuccess, onError;

    if (typeof parent === "undefined") {
        parent = dataStructure;
    }

    if (typeof parent.folders === "undefined") {
        parent.folders = [];
    }

    const datastore_object = {
        id: cryptoLibrary.generateUuid(),
        name: name,
    };

    parent.folders.push(datastore_object);

    parent["expanded"] = true;

    const closest_share_info = shareService.getClosestParentShare(path.slice(), dataStructure, dataStructure, 0);

    const closest_share = closest_share_info["closest_share"];

    if (closest_share.hasOwnProperty("share_id")) {
        datastore_object["parent_share_id"] = closest_share["share_id"];
    } else {
        datastore_object["parent_datastore_id"] = closest_share["datastore_id"];
    }

    if (closest_share.hasOwnProperty("datastore_id")) {
        datastore_object["share_rights"] = {
            read: true,
            write: true,
            grant: true,
            delete: true,
        };
    } else {
        datastore_object["share_rights"] = {
            read: closest_share["share_rights"]["read"],
            write: closest_share["share_rights"]["write"],
            grant: closest_share["share_rights"]["grant"] && closest_share["share_rights"]["write"],
            delete: closest_share["share_rights"]["write"],
        };
    }

    datastorePasswordService.updatePathsRecursive(dataStructure, []);

    if (closest_share.hasOwnProperty("share_id")) {
        // refresh share content before updating the share
        onSuccess = function (content) {
            let parent;
            if (closest_share_info["relative_path"].length === 0) {
                parent = content.data;
            } else {
                const search = datastoreService.findInDatastore(
                    closest_share_info["relative_path"],
                    content.data
                );
                parent = search[0][search[1]];
            }

            if (typeof parent.folders === "undefined") {
                parent.folders = [];
            }
            parent.folders.push(datastore_object);
            shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);

            manager.handleDatastoreContentChanged(dataStructure);
        };

        onError = function (e) {
            // pass
        };
        return shareService
            .readShare(closest_share["share_id"], closest_share["share_secret_key"])
            .then(onSuccess, onError);
    } else {
        // refresh datastore content before updating it
        onError = function (result) {
            // pass
        };

        onSuccess = function (datastore) {
            let parent;
            if (closest_share_info["relative_path"].length === 0) {
                parent = datastore;
            } else {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
                parent = search[0][search[1]];
            }

            if (typeof parent.folders === "undefined") {
                parent.folders = [];
            }
            parent.folders.push(datastore_object);
            manager.saveDatastoreContent(datastore, [path]);

            manager.handleDatastoreContentChanged(dataStructure);
        };

        return manager.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
    }
}

/**
 * Edits a folder and saves the structures (secret, datastore, share) if necessary
 *
 * @param {object} node The node you want to edit
 * @param {Array} path The path to the node
 * @param {TreeObject} dataStructure the data structure
 * @param {Object} manager manager responsible for
 */
function editFolderSave(node, path, dataStructure, manager) {
    let onSuccess, onError;

    const closest_share_info = shareService.getClosestParentShare(path.slice(), dataStructure, dataStructure, 0);
    const closest_share = closest_share_info["closest_share"];

    if (closest_share.hasOwnProperty("share_id")) {
        // refresh share content before updating the share
        onSuccess = function (content) {
            let folder;
            if (closest_share_info["relative_path"].length === 0) {
                folder = content.data;
            } else {
                const search = datastoreService.findInDatastore(
                    closest_share_info["relative_path"],
                    content.data
                );
                folder = search[0][search[1]];
            }
            folder.name = node.name;
            shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
            manager.handleDatastoreContentChanged(dataStructure);
        };

        onError = function (e) {
            // pass
        };
        shareService.readShare(closest_share["share_id"], closest_share["share_secret_key"]).then(onSuccess, onError);
    } else {
        // refresh datastore content before updating it
        onError = function (result) {
            // pass
        };

        onSuccess = function (datastore) {
            let folder;
            if (closest_share_info["relative_path"].length === 0) {
                folder = datastore;
            } else {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
                folder = search[0][search[1]];
            }

            folder.name = node.name;
            manager.saveDatastoreContent(datastore, [path.slice()]);
            manager.handleDatastoreContentChanged(dataStructure);
        };

        return datastoreService.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
    }
}

/**
 * Adds a new item to the datastore and saves the structures (secret, datastore, share) if necessary
 *
 * @param {object} datastoreObject The new entry that needs to be added to the datastore
 * @param {TreeObject} datastore The Datastore object
 * @param {TreeObject} parent The parent
 * @param {Array} path The path to the parent
 * @param {Object} manager manager responsible for
 */
function newItemSave(datastoreObject, datastore, parent, path, manager) {
    if (typeof parent === "undefined") {
        parent = datastore;
    }

    const closestShareInfo = shareService.getClosestParentShare(path.slice(), datastore, datastore, 0);

    const closestShare = closestShareInfo["closest_share"];

    if (closestShare.hasOwnProperty("share_id")) {
        datastoreObject["parent_share_id"] = closestShare["share_id"];
    } else {
        datastoreObject["parent_datastore_id"] = closestShare["datastore_id"];
    }

    if (closestShare.hasOwnProperty("datastore_id")) {
        datastoreObject["share_rights"] = {
            read: true,
            write: true,
            grant: true,
            delete: true,
        };
    } else {
        datastoreObject["share_rights"] = {
            read: closestShare["share_rights"]["read"],
            write: closestShare["share_rights"]["write"],
            grant: closestShare["share_rights"]["grant"] && closestShare["share_rights"]["write"],
            delete: closestShare["share_rights"]["write"],
        };
    }

    let onSuccess, onError;

    // update visual representation
    if (typeof parent.items === "undefined") {
        parent.items = [];
    }
    parent.items.push(datastoreObject);
    parent["expanded"] = true;
    datastorePasswordService.updatePathsRecursive(datastore, []);

    if (closestShare.hasOwnProperty("share_id")) {
        // refresh share content before updating the share
        onSuccess = function (content) {
            let parent;
            if (closestShareInfo["relative_path"].length === 0) {
                parent = content.data;
            } else {
                const search = datastoreService.findInDatastore(
                    closestShareInfo["relative_path"],
                    content.data
                );
                parent = search[0][search[1]];
            }

            if (typeof parent.items === "undefined") {
                parent.items = [];
            }
            parent.items.push(datastoreObject);

            shareService.writeShare(closestShare["share_id"], content.data, closestShare["share_secret_key"]);
            manager.handleDatastoreContentChanged(datastore);
        };

        onError = function (e) {
            // pass
        };
        return shareService
            .readShare(closestShare["share_id"], closestShare["share_secret_key"])
            .then(onSuccess, onError);
    } else {
        // refresh datastore content before updating it
        onError = function (result) {
            // pass
        };

        onSuccess = function (datastore) {
            let parent;
            if (closestShareInfo["relative_path"].length === 0) {
                parent = datastore;
            } else {
                const search = datastoreService.findInDatastore(closestShareInfo["relative_path"], datastore);
                parent = search[0][search[1]];
            }

            if (typeof parent.items === "undefined") {
                parent.items = [];
            }
            parent.items.push(datastoreObject);
            datastorePasswordService.saveDatastoreContent(datastore, [path]);
            manager.handleDatastoreContentChanged(datastore);
        };

        return manager.getDatastoreWithId(closestShare["datastore_id"]).then(onSuccess, onError);
    }
}

/**
 * Edits an item and saves the structures (secret, datastore, share) if necessary
 *
 * @param {TreeObject} datastore The Datastore object
 * @param {object} newContent The new content for the node
 * @param {Array} path The path to the item
 * @param {Object} manager manager responsible for
 */
function editItemSave(datastore, newContent, path, manager) {
    let onSuccess, onError;

    const closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 0);

    const closest_share = closest_share_info["closest_share"];

    if (closest_share.hasOwnProperty("share_id")) {
        // refresh share content before updating the share
        onSuccess = function (content) {
            let node;
            if (closest_share_info["relative_path"].length === 0) {
                // handle special case that we have an entry that is also a share
                node = content.data
            } else {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], content.data);
                node = search[0][search[1]];
            }

            // we delete all keys from the existing object and copy all the new ones
            let keys = Object.keys(node);
            for (let i = 0; i < keys.length; i++) {
                delete node[keys[i]];
            }
            keys = Object.keys(newContent);
            for (let i = 0; i < keys.length; i++) {
                node[keys[i]] = newContent[keys[i]];
            }

            shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
            manager.handleDatastoreContentChanged(datastore);
        };

        onError = function (e) {
            // pass
        };
        return shareService
            .readShare(closest_share["share_id"], closest_share["share_secret_key"])
            .then(onSuccess, onError);
    } else {
        // refresh datastore content before updating it
        onError = function (result) {
            // pass
        };

        onSuccess = function (datastore) {
            const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
            const node = search[0][search[1]];

            // we delete all keys from the existing object and copy all the new ones
            let keys = Object.keys(node);
            for (let i = 0; i < keys.length; i++) {
                delete node[keys[i]];
            }
            keys = Object.keys(newContent);
            for (let i = 0; i < keys.length; i++) {
                node[keys[i]] = newContent[keys[i]];
            }

            datastorePasswordService.saveDatastoreContent(datastore, [path.slice()]);
            manager.handleDatastoreContentChanged(datastore);
        };

        return manager.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
    }

    return datastorePasswordService.saveDatastoreContent(datastore, [path.slice()]);
}

/**
 * our little helper function that actually checks if and item can move
 *
 * @param element The item to move
 * @param target The target where to put it
 *
 * @returns {boolean} Returns weather its ok to move the item or not
 */
function canMoveItem(element, target) {
    if (element.hasOwnProperty("type") && element.type === "user") {
        return true;
    }

    // prevent the move of shares without grant rights into different shares
    if (
        element.share_rights.grant === false &&
        element.hasOwnProperty("parent_share_id") &&
        target.hasOwnProperty("share_id") &&
        target["share_id"] !== element["parent_share_id"]
    ) {
        alert("Sorry, but you cannot move a share without grant rights into another share.");
        return false;
    }

    // prevent the move of shares without grant rights into different shares
    if (
        element.share_rights.grant === false &&
        element.hasOwnProperty("parent_share_id") &&
        !target.hasOwnProperty("share_id") &&
        target.hasOwnProperty("parent_share_id") &&
        target["parent_share_id"] !== element["parent_share_id"]
    ) {
        alert("Sorry, but you cannot move a share without grant rights into another share.");
        return false;
    }

    return true;
}

/**
 * takes any element like shares, folders, items ... and checks if they can be moved
 *
 * @param element The element (shares, folders, items ...) to move
 * @param target The target where to put it
 *
 * @returns {boolean} Returns weather its ok to move the element or not
 */
function canMoveFolder(element, target) {
    let i;

    // Start of the actual rights checking

    // prevent the move of anything into a target without right writes
    if (target.hasOwnProperty("share_rights") && target.share_rights.write === false) {
        alert("Sorry, but you don't have write rights on target");
        return false;
    }

    // we are moving a share, so its unnecessary to check any lower item / folder rights
    if (element.hasOwnProperty("share_id")) {
        return canMoveItem(element, target);
    }

    // checks if we maybe have an item itself
    if (element.hasOwnProperty("type")) {
        if (canMoveItem(element, target) === false) {
            return false;
        }
    }

    // checks if we have a folder with items
    if (element.hasOwnProperty("items") && element.items.length > 0) {
        for (i = element.items.length - 1; i >= 0; i--) {
            if (canMoveItem(element.items[i], target) === false) {
                return false;
            }
        }
    }

    // checks if we have a folder with folders
    if (element.hasOwnProperty("folders") && element.folders.length > 0) {
        for (i = element.folders.length - 1; i >= 0; i--) {
            if (canMoveFolder(element.folders[i], target) === false) {
                return false;
            }
        }
    }

    // Nothing is blocking our move
    return true;
}

/**
 * Tests if a parent changed or stayed the same
 *
 * Returns true if the parent changed
 * Returns false if the parent stayed the same
 *
 * If its unsure what to do this function will return false
 *
 * @param element The element that is changing
 * @param target The new parent
 *
 * @returns {boolean}
 */
function check_if_parent_changed(element, target) {
    const test1 =
        target.hasOwnProperty("share_id") &&
        typeof target["share_id"] !== "undefined" &&
        target["share_id"] !== null &&
        target["share_id"] !== "" &&
        (!element.hasOwnProperty("parent_share_id") ||
            typeof element["parent_share_id"] === "undefined" ||
            element["parent_share_id"] === null ||
            target["share_id"] !== element["parent_share_id"]);

    const test2 =
        target.hasOwnProperty("datastore_id") &&
        typeof target["datastore_id"] !== "undefined" &&
        target["datastore_id"] !== null &&
        target["datastore_id"] !== "" &&
        (!element.hasOwnProperty("parent_datastore_id") ||
            typeof element["parent_datastore_id"] === "undefined" ||
            element["parent_datastore_id"] === null ||
            target["datastore_id"] !== element["parent_datastore_id"]);

    const test3 =
        target.hasOwnProperty("parent_datastore_id") &&
        typeof target["parent_datastore_id"] !== "undefined" &&
        target["parent_datastore_id"] !== null &&
        target["parent_datastore_id"] !== "" &&
        (!element.hasOwnProperty("parent_datastore_id") ||
            typeof element["parent_datastore_id"] === "undefined" ||
            element["parent_datastore_id"] === null ||
            target["parent_datastore_id"] !== element["parent_datastore_id"]);

    const test4 =
        target.hasOwnProperty("parent_share_id") &&
        typeof target["parent_share_id"] !== "undefined" &&
        target["parent_share_id"] !== null &&
        target["parent_share_id"] !== "" &&
        (!element.hasOwnProperty("parent_share_id") ||
            typeof element["parent_share_id"] === "undefined" ||
            element["parent_share_id"] === null ||
            target["parent_share_id"] !== element["parent_share_id"]);

    return test1 || test2 || test3 || test4;
}

/**
 * Move an item (or folder) from one position to another
 *
 * @param {TreeObject} datastore The datastore
 * @param {Array} itemPath the current path of the item
 * @param {Array} targetPath the path where we want to put the item
 * @param {string} type type of the item ('items' or 'folders')
 * @param {string} datastoreType The type of the datastore (e.g. 'password' or 'user')
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 */
function moveItem(datastore, itemPath, targetPath, type, datastoreType, onOpenRequest, onClosedRequest) {
    let i;
    let closest_parent;
    let closest_share_info;

    const orig_item_path = itemPath.slice();
    orig_item_path.pop();

    let orig_target_path;

    if (type !== "items" && type !== "folders") {
        return;
    }

    const onSuccess = async function (datastore) {
        if (targetPath === null || typeof targetPath === "undefined" || targetPath.length === 0) {
            orig_target_path = [];
        } else {
            orig_target_path = targetPath.slice();
        }

        let target = datastore;
        if (targetPath !== null && typeof targetPath !== "undefined" && targetPath.length !== 0) {
            // find drop zone
            const val1 = datastoreService.findInDatastore(targetPath, datastore);
            target = val1[0][val1[1]];
        }

        let element;
        // find element
        let val2;
        try {
            val2 = datastoreService.findInDatastore(itemPath, datastore);
            element = val2[0][val2[1]];
        } catch (e) {
            return;
        }

        // check if we have folders / items array, otherwise create the array
        if (!target.hasOwnProperty(type)) {
            target[type] = [];
        }

        //prevent the move of shares if rights are not sufficient
        if (!canMoveFolder(element, target)) {
            return;
        }

        // add the element to the other folders / items
        target[type].push(element);

        // delete the array at hte current position
        val2[0].splice(val2[1], 1);

        const target_path_copy = orig_target_path.slice();
        const target_path_copy2 = orig_target_path.slice();
        const target_path_copy3 = orig_target_path.slice();
        const item_path_copy = orig_item_path.slice();
        target_path_copy.push(element.id);
        item_path_copy.push(element.id);

        // lets populate our child shares that we need to handle
        const child_shares = [];
        if (element.hasOwnProperty("share_id")) {
            //we moved a share
            child_shares.push({
                share: element,
                path: [],
            });
        } else {
            datastorePasswordService.getAllChildSharesByPath([], datastore, child_shares, element);
        }
        const secret_links = datastorePasswordService.getAllSecretLinks(element);
        const file_links = datastorePasswordService.getAllFileLinks(element);

        // lets update for every child_share the share_index
        for (i = child_shares.length - 1; i >= 0; i--) {
            datastorePasswordService.onShareMoved(
                child_shares[i].share.share_id,
                item_path_copy.concat(child_shares[i].path),
                target_path_copy.concat(child_shares[i].path),
                datastore,
                1,
                child_shares[i].path.length + 1
            );
        }

        datastorePasswordService.updatePathsRecursive(datastore, []);

        // and save everything (before we update the links and might lose some necessary rights)
        if (datastoreType === "password") {
            datastorePasswordService.handleDatastoreContentChanged(datastore);
            await datastorePasswordService.saveDatastoreContent(datastore, [orig_item_path, orig_target_path]);
        } else {
            await datastoreUserService.saveDatastoreContent(datastore, [orig_item_path, orig_target_path]);
        }

        let timeout = 0;

        // adjust the links for every child_share (and therefore update the rights)
        for (i = child_shares.length - 1; i >= 0; i--) {
            (function (child_share) {
                timeout = timeout + 50;
                setTimeout(function () {
                    closest_share_info = shareService.getClosestParentShare(
                        target_path_copy.concat(child_share.path),
                        datastore,
                        datastore,
                        1
                    );
                    closest_parent = closest_share_info["closest_share"];

                    shareLinkService.onShareMoved(child_share.share.id, closest_parent);
                }, timeout);
            })(child_shares[i]);
        }

        // if parent_share or parent_datastore did not change, then we are done here
        if (!check_if_parent_changed(element, target)) {
            return;
        }

        // adjust the links for every secret link (and therefore update the rights)
        for (i = secret_links.length - 1; i >= 0; i--) {
            (function (secret_link) {
                timeout = timeout + 50;
                if (onOpenRequest) {
                    onOpenRequest();
                }
                setTimeout(function () {
                    closest_share_info = shareService.getClosestParentShare(
                        target_path_copy2.concat(secret_link.path),
                        datastore,
                        datastore,
                        0
                    );
                    closest_parent = closest_share_info["closest_share"];

                    const onError = function (result) {
                        if (onClosedRequest) {
                            onClosedRequest()
                        }
                    };

                    const onSuccess = function (content) {
                        if (onClosedRequest) {
                            onClosedRequest()
                        }
                    };
                    secretLinkService.onSecretMoved(secret_link.id, closest_parent)
                        .then(onSuccess, onError);

                }, timeout);
            })(secret_links[i]);
        }

        // adjust the links for every file link (and therefore update the rights)
        for (i = file_links.length - 1; i >= 0; i--) {
            (function (file_link) {
                timeout = timeout + 50;
                setTimeout(function () {
                    closest_share_info = shareService.getClosestParentShare(
                        target_path_copy2.concat(file_link.path),
                        datastore,
                        datastore,
                        0
                    );
                    closest_parent = closest_share_info["closest_share"];
                    fileLinkService.onFileMoved(file_link.id, closest_parent);
                }, timeout);
            })(file_links[i]);
        }

        // update the parents inside of the new target
        closest_share_info = shareService.getClosestParentShare(target_path_copy3, datastore, datastore, 0);
        closest_parent = closest_share_info["closest_share"];

        let new_parent_datastore_id = undefined;
        let new_parent_share_id = undefined;
        if (closest_parent.hasOwnProperty("datastore_id")) {
            new_parent_datastore_id = closest_parent.datastore_id;
        } else {
            new_parent_share_id = closest_parent.share_id;
        }

        element.parent_datastore_id = new_parent_datastore_id;
        element.parent_share_id = new_parent_share_id;

        datastorePasswordService.updateParents(element, new_parent_share_id, new_parent_datastore_id);
    };

    if (datastoreType === "password") {
        return datastorePasswordService.getPasswordDatastore(datastore.datastore_id).then(onSuccess);
    } else {
        return datastoreService.getDatastoreWithId(datastore.datastore_id).then(onSuccess);
    }
}

/**
 * Marks an item as deleted
 *
 * @param {TreeObject} datastore The datastore
 * @param {Array} path The path to the item
 * @param {string} datastoreType The type of the datastore (e.g. 'password' or 'user')
 */
function markItemAsDeleted(datastore, path, datastoreType) {
    let onSuccess, onError;
    const element_path_that_changed = path.slice();
    element_path_that_changed.pop();

    const search = datastoreService.findInDatastore(path.slice(), datastore);
    let element = search[0][search[1]];

    element["deleted"] = true;

    const closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 1);

    const closest_share = closest_share_info["closest_share"];

    if (datastoreType === "password") {
        if (closest_share.hasOwnProperty("share_id")) {
            // refresh share content before updating the share
            onSuccess = function (content) {
                const search = datastoreService.findInDatastore(
                    closest_share_info["relative_path"],
                    content.data
                );
                element = search[0][search[1]];

                element["deleted"] = true;

                shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            onError = function (e) {
                // pass
            };
            return shareService
                .readShare(closest_share["share_id"], closest_share["share_secret_key"])
                .then(onSuccess, onError);
        } else {
            // refresh datastore content before updating it
            onError = function (result) {
                // pass
            };

            onSuccess = function (datastore) {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
                element = search[0][search[1]];

                element["deleted"] = true;

                datastorePasswordService.saveDatastoreContent(datastore, [element_path_that_changed]);
                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            return datastoreService.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
        }
    } else if (datastoreType === "user") {
        return datastoreUserService.saveDatastoreContent(datastore, [element_path_that_changed]);
    }
}

/**
 * Reverse "Marks an item as deleted"
 *
 * @param {TreeObject} datastore The datastore
 * @param {object} item The item to delete
 * @param {Array} path The path to the item
 * @param {string} datastoreType The type of the datastore (e.g. 'password' or 'user')
 */
function reverseMarkItemAsDeleted(datastore, item, path, datastoreType) {
    let onSuccess, onError;
    const element_path_that_changed = path.slice();
    element_path_that_changed.pop();

    const search = datastoreService.findInDatastore(path.slice(), datastore);
    let element = search[0][search[1]];

    delete element["deleted"];

    const closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 1);

    const closest_share = closest_share_info["closest_share"];

    if (datastoreType === "password") {
        if (closest_share.hasOwnProperty("share_id")) {
            // refresh share content before updating the share
            onSuccess = function (content) {
                const search = datastoreService.findInDatastore(
                    closest_share_info["relative_path"],
                    content.data
                );
                element = search[0][search[1]];

                delete element["deleted"];

                shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            onError = function (e) {
                // pass
            };
            shareService
                .readShare(closest_share["share_id"], closest_share["share_secret_key"])
                .then(onSuccess, onError);
        } else {
            // refresh datastore content before updating it
            onError = function (result) {
                // pass
            };

            onSuccess = function (datastore) {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
                element = search[0][search[1]];

                delete element["deleted"];

                datastorePasswordService.saveDatastoreContent(datastore, [element_path_that_changed]);
                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            datastoreService.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
        }
    } else if (datastoreType === "user") {
        datastoreUserService.saveDatastoreContent(datastore, [element_path_that_changed]);
    }
}

/**
 * Clones an item
 * Takes care that the link structure on the server is updated
 *
 * @param {TreeObject} datastore The datastore
 * @param {object} item The item to clone
 * @param {Array} path The path to the item
 */
function cloneItem(datastore, item, path) {

    let onError = function (result) {
        console.log(result);
        // pass
    };

    const onSuccess = function (secret_object) {
        let closest_share_info;
        if (item.hasOwnProperty('share_id')) {
            // we have an item that is a share on its own
            closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 1);
        } else {
            closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 0);
        }

        const closest_share = closest_share_info["closest_share"];

        let parent_share_id, parent_datastore_id;
        if (closest_share.hasOwnProperty("share_id")) {
            parent_share_id = closest_share["share_id"];
        } else {
            parent_datastore_id = closest_share["datastore_id"];
        }

        const callback_url = secret_object["callback_url"];
        const callback_user = secret_object["callback_user"];
        const callback_pass = secret_object["callback_pass"];

        delete secret_object["callback_url"];
        delete secret_object["callback_user"];
        delete secret_object["callback_pass"];

        if (secret_object.hasOwnProperty('website_password_title')) {
            secret_object['website_password_title'] = 'Copy ' + secret_object['website_password_title'];
        }
        if (secret_object.hasOwnProperty('application_password_title')) {
            secret_object['application_password_title'] = 'Copy ' + secret_object['application_password_title'];
        }
        if (secret_object.hasOwnProperty('bookmark_title')) {
            secret_object['bookmark_title'] = 'Copy ' + secret_object['bookmark_title'];
        }
        if (secret_object.hasOwnProperty('note_title')) {
            secret_object['note_title'] = 'Copy ' + secret_object['note_title'];
        }
        if (secret_object.hasOwnProperty('totp_title')) {
            secret_object['totp_title'] = 'Copy ' + secret_object['totp_title'];
        }
        if (secret_object.hasOwnProperty('environment_variables_title')) {
            secret_object['environment_variables_title'] = 'Copy ' + secret_object['environment_variables_title'];
        }
        if (secret_object.hasOwnProperty('file_title')) {
            secret_object['file_title'] = 'Copy ' + secret_object['file_title'];
        }
        if (secret_object.hasOwnProperty('ssh_own_key_title')) {
            secret_object['ssh_own_key_title'] = 'Copy ' + secret_object['ssh_own_key_title'];
        }
        if (secret_object.hasOwnProperty('credit_card_title')) {
            secret_object['credit_card_title'] = 'Copy ' + secret_object['credit_card_title'];
        }
        if (secret_object.hasOwnProperty('mail_gpg_own_key_title')) {
            secret_object['mail_gpg_own_key_title'] = 'Copy ' + secret_object['mail_gpg_own_key_title'];
        }
        if (secret_object.hasOwnProperty('elster_certificate_title')) {
            secret_object['elster_certificate_title'] = 'Copy ' + secret_object['elster_certificate_title'];
        }

        const link_id = cryptoLibrary.generateUuid();

        let onSuccess = function (e) {
            secret_object["secret_id"] = e.secret_id;
            secret_object["secret_key"] = e.secret_key;

            if (closest_share.hasOwnProperty("share_id")) {
                // refresh share content before updating the share
                onSuccess = async function (content) {
                    let parent;
                    const relative_path_to_parent = closest_share_info["relative_path"].slice();
                    relative_path_to_parent.pop();

                    // search the original item and prepare it
                    let search = datastoreService.findInDatastore(
                        closest_share_info["relative_path"],
                        content.data
                    );
                    const element_copy = helper.duplicateObject(search[0][search[1]]);
                    element_copy["id"] = link_id;
                    element_copy["secret_id"] = e.secret_id;
                    element_copy["secret_key"] = e.secret_key;
                    element_copy["name"] = "Copy " + element_copy["name"];
                    if (element_copy.hasOwnProperty("share_id")) {
                        delete element_copy["share_id"];
                    }
                    if (element_copy.hasOwnProperty("share_secret_key")) {
                        delete element_copy["share_secret_key"];
                    }

                    if (relative_path_to_parent.length === 0) {
                        parent = content.data;
                    } else {
                        search = datastoreService.findInDatastore(relative_path_to_parent, content.data);
                        parent = search[0][search[1]];
                    }

                    if (typeof parent.items === "undefined") {
                        parent.items = [];
                    }
                    parent.items.push(element_copy);

                    if (relative_path_to_parent.length === 0) {
                        parent = closest_share;
                    } else {
                        search = datastoreService.findInDatastore(relative_path_to_parent, closest_share);
                        parent = search[0][search[1]];
                    }

                    if (typeof parent.items === "undefined") {
                        parent.items = [];
                    }
                    parent.items.push(element_copy);

                    await shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);
                    return datastorePasswordService.handleDatastoreContentChanged(datastore);
                };

                onError = function (e) {
                    // pass
                };
                return shareService
                    .readShare(closest_share["share_id"], closest_share["share_secret_key"])
                    .then(onSuccess, onError);
            } else {
                // refresh datastore content before updating it
                onError = function (result) {
                    // pass
                };

                onSuccess = async function (datastore) {
                    let parent;
                    const relative_path_to_parent = closest_share_info["relative_path"].slice();
                    relative_path_to_parent.pop();

                    // search the original item and prepare it
                    let search = datastoreService.findInDatastore(
                        closest_share_info["relative_path"],
                        datastore
                    );
                    const element_copy = helper.duplicateObject(search[0][search[1]]);
                    element_copy["id"] = link_id;
                    element_copy["secret_id"] = e.secret_id;
                    element_copy["secret_key"] = e.secret_key;
                    element_copy["name"] = "Copy " + element_copy["name"];
                    if (element_copy.hasOwnProperty("share_id")) {
                        delete element_copy["share_id"];
                    }
                    if (element_copy.hasOwnProperty("share_secret_key")) {
                        delete element_copy["share_secret_key"];
                    }

                    if (relative_path_to_parent.length === 0) {
                        parent = datastore;
                    } else {
                        search = datastoreService.findInDatastore(relative_path_to_parent, datastore);
                        parent = search[0][search[1]];
                    }

                    if (typeof parent.items === "undefined") {
                        parent.items = [];
                    }
                    parent.items.push(element_copy);

                    const newElementPath = path.slice();
                    newElementPath.pop()
                    newElementPath.push(link_id)

                    await datastorePasswordService.saveDatastoreContent(datastore, [newElementPath]);
                    return datastorePasswordService.handleDatastoreContentChanged(datastore);
                };

                return datastorePasswordService
                    .getDatastoreWithId(closest_share["datastore_id"])
                    .then(onSuccess, onError);
            }
        };

        return secretService
            .createSecret(
                secret_object,
                link_id,
                parent_datastore_id,
                parent_share_id,
                callback_url,
                callback_user,
                callback_pass
            )
            .then(onSuccess, onError);
    };

    return secretService.readSecret(item.secret_id, item.secret_key).then(onSuccess, onError);
}

/**
 * Deletes an item (or folder) for real from a datastore
 * Takes care that the link structure on the server is updated
 *
 * @param {TreeObject} datastore The datastore
 * @param {Array} path The path to the item
 * @param {string} datastoreType The type of the datastore (e.g. 'password' or 'user')
 */
function deleteItemPermanent(datastore, path, datastoreType) {
    let i;
    let onSuccess, onError;

    const element_path_that_changed = path.slice();
    element_path_that_changed.pop();

    const search = datastoreService.findInDatastore(path.slice(), datastore);

    const closest_share_info = shareService.getClosestParentShare(path.slice(), datastore, datastore, 1);

    const closest_share = closest_share_info["closest_share"];

    // update visual representation
    if (search) {
        // remove element from element holding structure (folders or items array)
        search[0].splice(search[1], 1);
    }

    // lets populate our child shares that we need to handle, e.g a we deleted a folder that contains some shares
    const child_shares = [];

    // and save everything (before we update the links and might lose some necessary rights)
    if (datastoreType === "password") {
        if (closest_share.hasOwnProperty("share_id")) {
            // refresh share content before updating the share
            onSuccess = function (content) {
                const search = datastoreService.findInDatastore(
                    closest_share_info["relative_path"],
                    content.data
                );
                const element = search[0][search[1]];

                if (element.hasOwnProperty("share_id")) {
                    //we deleted a share
                    child_shares.push({
                        share: element,
                        path: [],
                    });
                } else {
                    datastorePasswordService.getAllChildSharesByPath([], datastore, child_shares, element);
                }

                const secret_links = datastorePasswordService.getAllSecretLinks(element);
                const file_links = datastorePasswordService.getAllFileLinks(element);

                // lets update for every child_share the share_index
                for (i = child_shares.length - 1; i >= 0; i--) {
                    datastorePasswordService.deleteFromShareIndex(
                        content.data,
                        child_shares[i].share.share_id,
                        closest_share_info["relative_path"].concat(child_shares[i].path)
                    );
                }

                if (search) {
                    // remove element from element holding structure (folders or items array)
                    search[0].splice(search[1], 1);
                }

                shareService.writeShare(closest_share["share_id"], content.data, closest_share["share_secret_key"]);

                let timeout = 0;

                // Update all the "links" so the server has the updated link structure
                // adjust the links for every child_share (and therefore update the rights)
                for (i = child_shares.length - 1; i >= 0; i--) {
                    (function (child_share) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            shareLinkService.onShareDeleted(child_share.share.id);
                        }, timeout);
                    })(child_shares[i]);
                }
                // adjust the links for every secret link (and therefore update the rights)
                for (i = secret_links.length - 1; i >= 0; i--) {
                    (function (secret_link) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            secretLinkService.onSecretDeleted(secret_link.id);
                        }, timeout);
                    })(secret_links[i]);
                }

                // adjust the links for every file link (and therefore update the rights)
                for (i = file_links.length - 1; i >= 0; i--) {
                    (function (file_link) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            fileLinkService.onFileDeleted(file_link.id);
                        }, timeout);
                    })(file_links[i]);
                }
                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            onError = function (e) {
                // pass
            };
            return shareService
                .readShare(closest_share["share_id"], closest_share["share_secret_key"])
                .then(onSuccess, onError);
        } else {
            // refresh datastore content before updating it
            onError = function (result) {
                // pass
            };

            onSuccess = function (datastore) {
                const search = datastoreService.findInDatastore(closest_share_info["relative_path"], datastore);
                const element = search[0][search[1]];

                if (element.hasOwnProperty("share_id")) {
                    //we deleted a share
                    child_shares.push({
                        share: element,
                        path: [],
                    });
                } else {
                    datastorePasswordService.getAllChildSharesByPath([], datastore, child_shares, element);
                }

                const secret_links = datastorePasswordService.getAllSecretLinks(element);
                const file_links = datastorePasswordService.getAllFileLinks(element);

                // lets update for every child_share the share_index
                for (i = child_shares.length - 1; i >= 0; i--) {
                    datastorePasswordService.deleteFromShareIndex(
                        datastore,
                        child_shares[i].share.share_id,
                        closest_share_info["relative_path"].concat(child_shares[i].path)
                    );
                }

                if (search) {
                    // remove element from element holding structure (folders or items array)
                    search[0].splice(search[1], 1);
                }

                datastorePasswordService.saveDatastoreContent(datastore, [element_path_that_changed]);

                let timeout = 0;

                // Update all the "links" so the server has the updated link structure
                // adjust the links for every child_share (and therefore update the rights)
                for (i = child_shares.length - 1; i >= 0; i--) {
                    (function (child_share) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            shareLinkService.onShareDeleted(child_share.share.id);
                        }, timeout);
                    })(child_shares[i]);
                }
                // adjust the links for every secret link (and therefore update the rights)
                for (i = secret_links.length - 1; i >= 0; i--) {
                    (function (secret_link) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            secretLinkService.onSecretDeleted(secret_link.id);
                        }, timeout);
                    })(secret_links[i]);
                }

                // adjust the links for every file link (and therefore update the rights)
                for (i = file_links.length - 1; i >= 0; i--) {
                    (function (file_link) {
                        timeout = timeout + 50;
                        setTimeout(function () {
                            fileLinkService.onFileDeleted(file_link.id);
                        }, timeout);
                    })(file_links[i]);
                }

                datastorePasswordService.handleDatastoreContentChanged(datastore);
            };

            return datastoreService.getDatastoreWithId(closest_share["datastore_id"]).then(onSuccess, onError);
        }
    } else if (datastoreType === "user") {
        return datastoreUserService.saveDatastoreContent(datastore, [element_path_that_changed]);
    }
}

/**
 * Go through the structure to find the object specified with the path
 *
 * @param {Array} path The path to the object you search as list of ids
 * @param {TreeObject} structure The structure object tree
 * @returns {boolean|Array} False if not present or a list of two objects where the first is the List Object containing the searchable object and the second the index
 */
function findInStructure(path, structure) {
    const to_search = path.shift();
    let n;

    if (path.length === 0) {
        // found the object
        // check if its a folder, if yes return the folder list and the index
        if (structure.hasOwnProperty("folders")) {
            for (n = 0; n < structure.folders.length; n++) {
                if (structure.folders[n].id === to_search) {
                    return [structure.folders, n];
                    // structure.folders.splice(n, 1);
                    // return true;
                }
            }
        }
        // check if its a file, if yes return the file list and the index
        if (structure.hasOwnProperty("items")) {
            for (n = 0; n < structure.items.length; n++) {
                if (structure.items[n].id === to_search) {
                    return [structure.items, n];
                    // structure.items.splice(n, 1);
                    // return true;
                }
            }
        }
        // something went wrong, couldn't find the file / folder here
        return false;
    }

    for (n = 0; n < structure.folders.length; n++) {
        if (structure.folders[n].id === to_search) {
            return findInStructure(path, structure.folders[n]);
        }
    }
    return false;
}

/**
 * Returns the class of the icon used to display a specific item
 *
 * @param {object} item An item from the datastore
 *
 * @returns {string} Returns the css class
 */
function itemIcon(item) {
    const iconClassMap = {
            txt: "fa fa-file-text-o",
            log: "fa fa-file-text-o",
            jpg: "fa fa-file-image-o blue",
            jpeg: "fa fa-file-image-o blue",
            png: "fa fa-file-image-o orange",
            gif: "fa fa-file-image-o",
            pdf: "fa fa-file-pdf-o",
            wav: "fa fa-file-audio-o",
            mp3: "fa fa-file-audio-o",
            wma: "fa fa-file-audio-o",
            avi: "fa fa-file-video-o",
            mov: "fa fa-file-video-o",
            mkv: "fa fa-file-video-o",
            flv: "fa fa-file-video-o",
            mp4: "fa fa-file-video-o",
            mpg: "fa fa-file-video-o",
            doc: "fa fa-file-word-o",
            dot: "fa fa-file-word-o",
            docx: "fa fa-file-word-o",
            docm: "fa fa-file-word-o",
            dotx: "fa fa-file-word-o",
            dotm: "fa fa-file-word-o",
            docb: "fa fa-file-word-o",
            xls: "fa fa-file-excel-o",
            xlt: "fa fa-file-excel-o",
            xlm: "fa fa-file-excel-o",
            xla: "fa fa-file-excel-o",
            xll: "fa fa-file-excel-o",
            xlw: "fa fa-file-excel-o",
            xlsx: "fa fa-file-excel-o",
            xlsm: "fa fa-file-excel-o",
            xlsb: "fa fa-file-excel-o",
            xltx: "fa fa-file-excel-o",
            xltm: "fa fa-file-excel-o",
            xlam: "fa fa-file-excel-o",
            csv: "fa fa-file-excel-o",
            ppt: "fa fa-file-powerpoint-o",
            pptx: "fa fa-file-powerpoint-o",
            zip: "fa fa-file-archive-o",
            tar: "fa fa-file-archive-o",
            gz: "fa fa-file-archive-o",
            "7zip": "fa fa-file-archive-o",
        },
        defaultIconClass = "fa fa-file-o";

    if (item.type === "bookmark") {
        return "fa fa-bookmark-o";
    }
    if (item.type === "passkey") {
        return "fa fa-sticky-note-o";
    }
    if (item.type === "note") {
        return "fa fa-sticky-note-o";
    }

    if (item.type === "application_password") {
        return "fa fa-cube";
    }

    if (item.type === "website_password") {
        return "fa fa-key";
    }

    if (item.type === "totp") {
        return "fa fa-qrcode";
    }

    if (item.type === "user") {
        return "fa fa-user";
    }

    if (item.type === "mail_gpg_own_key") {
        return "fa fa-lock";
    }

    if (item.type === "ssh_own_key") {
        return "fa fa-lock";
    }

    if (item.type === "credit_card") {
        return "fa fa-credit-card";
    }

    if (item.type === "elster_certificate") {
        return "fa fa-id-card-o";
    }

    if (item.type === "environment_variables") {
        return "fa fa-superscript";
    }

    const pattern = /\.(\w+)$/,
        match = pattern.exec(item.name),
        ext = match && match[1];

    return iconClassMap[ext] || defaultIconClass;
}

const widgetService = {
    newFolderSave: newFolderSave,
    editFolderSave: editFolderSave,
    findInStructure: findInStructure,
    newItemSave: newItemSave,
    editItemSave: editItemSave,
    moveItem: moveItem,
    deleteItemPermanent: deleteItemPermanent,
    markItemAsDeleted: markItemAsDeleted,
    cloneItem: cloneItem,
    reverseMarkItemAsDeleted: reverseMarkItemAsDeleted,
    itemIcon: itemIcon,
};

export default widgetService;
