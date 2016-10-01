# Entities
The four main "entities" and their meaning.


## Datastore

Every user owns one datastore of every type. Currently there are 3 types.
The password datastore, the user datastore and the settings datastore.
Datastores are encrypted with the users secret_key and cannot be shared.

### Datastore Setting
The settings datastore contains the basic settings of the user, like e.g.
his defaults to generate a passwords

### Datastore User
The user datastore contains the user details of other users, that he added
as "trusted" users, especially the public_key of the other user.

### Datastore Password
The password datastore is the main datastore, holding the entryoint for the
user's passwords. It contains a filestructure like described here in the
[Filestructure Documentation](Filestructure.md)

## Secret
Secrets are the containers for anything sensible. A secret is 


## Share
Shares are the base object that is created whenever a user wants to share
anything with another user. They can contain Secret (see below) or
complete filestructures, similar to a datastore.

