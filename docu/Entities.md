# Entities
The three main "entities" and their meaning:

- Datastores
- Secrets
- Shares


## Datastore

Every user owns one datastore of every type. Currently there are 3 types.
The password datastore, the user datastore and the settings datastore.

Every datastore is encrypted with a unique symmetric key, that is stored
symmetric encrypted by the users secret_key on the server.

##### Datastore Setting
The settings datastore contains the basic settings of the user, like e.g.
his defaults to generate a passwords.

##### Datastore User
The user datastore contains the user details of other users, that he added
as "trusted" users, especially the public_key of the other user.

##### Datastore Password
The password datastore is the main datastore, holding the entryoint for the
user's passwords. It contains a filestructure like described here in the
[Filestructure Documentation](Filestructure.md)

## Secret
Secrets are the containers for anything sensible. A secret is always linked
to in a datastore or a share (see below). The  secret_key to decrypt the
secret is part part of the informations stored in the datastore / share.
The JSON structure of the secret is flexible and depends on the type of the
secret (e.g. note, password, ...)

Every secret is encrytped with a unique symmetric key, that is stored in
plain text in the parent object (either datastore or share) that links to
the secret.

## Share
Shares are the base object that is created whenever a user wants to share
anything with another user. They can contain a complete filestructures,
similar to a datastore (described in the
[Filestructure Documentation](Filestructure.md)) with links to secrets.
The main difference in comparison to datastores is that shares can be
accessed by multiple users, based on their access rights.

Every share is encrytped with a unique symmetric key, that is stored in plain
text in the parent object (either datastore or share) that links to the share.

# Entities as a diagram

A typical entity structure can look like this:

![Entity relation diagram](img/Entity_relation.png)

Two users, each of them owning their three datastores. The password Datastores
can link multiple shares and multiple secrets. One share can link multiple other
shares and multiple other secrets.

