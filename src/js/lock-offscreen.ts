// Keep only the ephemeral keyring alive, independently of the MV3 worker.
import { announceKeyHost } from "./services/vault-lock";
announceKeyHost();
