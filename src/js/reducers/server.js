import { LOGOUT, SET_SERVER_INFO, SET_SERVER_POLICY, SET_SERVER_STATUS, SET_SERVER_URL, SETTINGS_DATASTORE_LOADED, SET_DOMAIN_SYNONYMS_CONFIG } from "../actions/action-types";
import helperService from "../services/helper";

const defaultUrl = "";
const defaultApi = "";
const defaultAllowUserSearchByEmail = false;
const defaultAllowUserSearchByUsernamePartial = false;
const defaultAllowedSecondFactors = [];
const defaultAuthenticationMethods = [];
const defaultBuild = "";
const defaultCreditBuyAddress = "";
const defaultCreditCostsUpload = "";
const defaultCreditCostsDownload = "";
const defaultCreditCostsStorage = "";
const defaultComplianceCentralSecurityReportsRecurrenceInterval = 0;
const defaultComplianceDisableApiKeys = false;
const defaultComplianceDisableDeleteAccount = false;
const defaultComplianceDisableEmergencyCodes = false;
const defaultComplianceDisableTotp = false;
const defaultComplianceDisableExport = false;
const defaultComplianceDisableExportOfSharedItems = false;
const defaultComplianceDisableUnmanagedGroups = false;
const defaultComplianceDisableFileRepositories = false;
const defaultComplianceDisableLinkShares = false;
const defaultComplianceDisableOfflineMode = false;
const defaultComplianceMaxOfflineCacheTimeValid = 31536000;
const defaultComplianceDisableShares = false;
const defaultComplianceDisableRecoveryCodes = false;
const defaultComplianceEnforce2fa = false;
const defaultComplianceEnforceCentralSecurityReports = false;
const defaultComplianceEnforceBreachDetection = false;
const defaultComplianceMinMasterPasswordComplexity = 2;
const defaultComplianceMinMasterPasswordLength = 14;
const defaultComplianceClipboardClearDelay = 30;
const defaultComplianceMinClipboardClearDelay = 0;
const defaultComplianceMaxClipboardClearDelay = 600;
const defaultCompliancePasswordGeneratorDefaultPasswordLength = 20;
const defaultCompliancePasswordGeneratorDefaultLettersUppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const defaultCompliancePasswordGeneratorDefaultLettersLowercase = "abcdefghijklmnopqrstuvwxyz";
const defaultCompliancePasswordGeneratorDefaultNumbers = "0123456789";
const defaultCompliancePasswordGeneratorDefaultSpecialChars = ",.-;:_#'+*~!\"$%&/@()=?{[]}\\";
const defaultComplianceServerSecrets = "auto";
const defaultLicenseId = "";
const defaultLicenseMode = "";
const defaultLicenseType = "";
const defaultType = "";
const defaultFiles = false;
const defaultLicenseMaxUsers = undefined;
const defaultLicenseValidFrom = undefined;
const defaultLicenseValidTill = undefined;
const defaultLogAudit = false;
const defaultManagement = false;
const defaultPublicKey = "";
const defaultVersion = "";
const defaultWebClient = "";
const defaultDisableCentralSecurityReports = false;
const defaultDisableCallbacks = true;
const defaultAllowedFileRepositoryTypes = [
    'azure_blob',
    'gcp_cloud_storage',
    'aws_s3',
    'do_spaces',
    'backblaze',
];
const defaultFaviconServiceUrl = '';
const defaultMultifactorEnabled = false;
const defaultSystemWideDuoExists = false;
const defaultVerifyKey = "";
const defaultStatus = { data: {} };
const defaultDomainSynonyms = [];
const defaultCustomDomainSynonyms = [];
const defaultDomainSynonymMap = helperService.buildDomainSynonymMap([], []);

function server(
    state = {
        url: defaultUrl,
        allowUserSearchByEmail: defaultAllowUserSearchByEmail,
        allowUserSearchByUsernamePartial: defaultAllowUserSearchByUsernamePartial,
        allowedSecondFactors: defaultAllowedSecondFactors,
        api: defaultApi,
        authenticationMethods: defaultAuthenticationMethods,
        build: defaultBuild,
        creditBuyAddress: defaultCreditBuyAddress,
        creditCostsUpload: defaultCreditCostsUpload,
        creditCostsDownload: defaultCreditCostsDownload,
        creditCostsStorage: defaultCreditCostsStorage,
        complianceCentralSecurityReportsRecurrenceInterval: defaultComplianceCentralSecurityReportsRecurrenceInterval,
        complianceDisableApiKeys: defaultComplianceDisableApiKeys,
        complianceDisableDeleteAccount: defaultComplianceDisableDeleteAccount,
        complianceDisableEmergencyCodes: defaultComplianceDisableEmergencyCodes,
        complianceDisableTotp: defaultComplianceDisableTotp,
        complianceDisableExport: defaultComplianceDisableExport,
        complianceDisableExportOfSharedItems: defaultComplianceDisableExportOfSharedItems,
        complianceDisableUnmanagedGroups: defaultComplianceDisableUnmanagedGroups,
        complianceDisableFileRepositories: defaultComplianceDisableFileRepositories,
        complianceDisableLinkShares: defaultComplianceDisableLinkShares,
        complianceDisableOfflineMode: defaultComplianceDisableOfflineMode,
        complianceMaxOfflineCacheTimeValid: defaultComplianceMaxOfflineCacheTimeValid,
        complianceDisableShares: defaultComplianceDisableShares,
        complianceDisableRecoveryCodes: defaultComplianceDisableRecoveryCodes,
        complianceEnforce2fa: defaultComplianceEnforce2fa,
        complianceEnforceCentralSecurityReports: defaultComplianceEnforceCentralSecurityReports,
        complianceEnforceBreachDetection: defaultComplianceEnforceBreachDetection,
        complianceMinMasterPasswordComplexity: defaultComplianceMinMasterPasswordComplexity,
        complianceMinMasterPasswordLength: defaultComplianceMinMasterPasswordLength,
        complianceClipboardClearDelay: defaultComplianceClipboardClearDelay,
        complianceMinClipboardClearDelay: defaultComplianceMinClipboardClearDelay,
        complianceMaxClipboardClearDelay: defaultComplianceMaxClipboardClearDelay,
        compliancePasswordGeneratorDefaultPasswordLength: defaultCompliancePasswordGeneratorDefaultPasswordLength,
        compliancePasswordGeneratorDefaultLettersUppercase: defaultCompliancePasswordGeneratorDefaultLettersUppercase,
        compliancePasswordGeneratorDefaultLettersLowercase: defaultCompliancePasswordGeneratorDefaultLettersLowercase,
        compliancePasswordGeneratorDefaultNumbers: defaultCompliancePasswordGeneratorDefaultNumbers,
        compliancePasswordGeneratorDefaultSpecialChars: defaultCompliancePasswordGeneratorDefaultSpecialChars,
        complianceServerSecrets: defaultComplianceServerSecrets,
        licenseId: defaultLicenseId,
        licenseMaxUsers: defaultLicenseMaxUsers,
        licenseMode: defaultLicenseMode,
        licenseType: defaultLicenseType,
        type: defaultType,
        files: defaultFiles,
        licenseValidFrom: defaultLicenseValidFrom,
        licenseValidTill: defaultLicenseValidTill,
        logAudit: defaultLogAudit,
        management: defaultManagement,
        publicKey: defaultPublicKey,
        version: defaultVersion,
        webClient: defaultWebClient,
        disableCentralSecurityReports: defaultDisableCentralSecurityReports,
        disableCallbacks: defaultDisableCallbacks,
        allowedFileRepositoryTypes: defaultAllowedFileRepositoryTypes,
        multifactorEnabled: defaultMultifactorEnabled,
        systemWideDuoExists: defaultSystemWideDuoExists,
        verifyKey: defaultVerifyKey,
        status: defaultStatus,
        domainSynonyms: defaultDomainSynonyms,
        customDomainSynonyms: defaultCustomDomainSynonyms,
        domainSynonymMap: defaultDomainSynonymMap,
    },
    action
) {
    switch (action.type) {
        case LOGOUT:
            return Object.assign({}, state, {
                url: action.rememberMe ? state.url : defaultUrl,
                allowUserSearchByEmail: defaultAllowUserSearchByEmail,
                allowUserSearchByUsernamePartial: defaultAllowUserSearchByUsernamePartial,
                allowedSecondFactors: defaultAllowedSecondFactors,
                api: defaultApi,
                authenticationMethods: defaultAuthenticationMethods,
                build: defaultBuild,
                creditBuyAddress: defaultCreditBuyAddress,
                creditCostsUpload: defaultCreditCostsUpload,
                creditCostsDownload: defaultCreditCostsDownload,
                creditCostsStorage: defaultCreditCostsStorage,
                complianceCentralSecurityReportsRecurrenceInterval:
                    defaultComplianceCentralSecurityReportsRecurrenceInterval,
                complianceDisableApiKeys: defaultComplianceDisableApiKeys,
                complianceDisableDeleteAccount: defaultComplianceDisableDeleteAccount,
                complianceDisableEmergencyCodes: defaultComplianceDisableEmergencyCodes,
                complianceDisableTotp: defaultComplianceDisableTotp,
                complianceDisableExport: defaultComplianceDisableExport,
                complianceDisableExportOfSharedItems: defaultComplianceDisableExportOfSharedItems,
                complianceDisableUnmanagedGroups: defaultComplianceDisableUnmanagedGroups,
                complianceDisableFileRepositories: defaultComplianceDisableFileRepositories,
                complianceDisableLinkShares: defaultComplianceDisableLinkShares,
                complianceDisableOfflineMode: defaultComplianceDisableOfflineMode,
                complianceMaxOfflineCacheTimeValid: defaultComplianceMaxOfflineCacheTimeValid,
                complianceDisableShares: defaultComplianceDisableShares,
                complianceDisableRecoveryCodes: defaultComplianceDisableRecoveryCodes,
                complianceEnforce2fa: defaultComplianceEnforce2fa,
                complianceEnforceCentralSecurityReports: defaultComplianceEnforceCentralSecurityReports,
                complianceEnforceBreachDetection: defaultComplianceEnforceBreachDetection,
                complianceMinMasterPasswordComplexity: defaultComplianceMinMasterPasswordComplexity,
                complianceMinMasterPasswordLength: defaultComplianceMinMasterPasswordLength,
                complianceClipboardClearDelay: defaultComplianceClipboardClearDelay,
                complianceMinClipboardClearDelay: defaultComplianceMinClipboardClearDelay,
                complianceMaxClipboardClearDelay: defaultComplianceMaxClipboardClearDelay,
                compliancePasswordGeneratorDefaultPasswordLength:
                    defaultCompliancePasswordGeneratorDefaultPasswordLength,
                compliancePasswordGeneratorDefaultLettersUppercase:
                    defaultCompliancePasswordGeneratorDefaultLettersUppercase,
                compliancePasswordGeneratorDefaultLettersLowercase:
                    defaultCompliancePasswordGeneratorDefaultLettersLowercase,
                compliancePasswordGeneratorDefaultNumbers: defaultCompliancePasswordGeneratorDefaultNumbers,
                compliancePasswordGeneratorDefaultSpecialChars: defaultCompliancePasswordGeneratorDefaultSpecialChars,
                complianceServerSecrets: defaultComplianceServerSecrets,
                licenseId: defaultLicenseId,
                licenseMaxUsers: defaultLicenseMaxUsers,
                licenseMode: defaultLicenseMode,
                licenseType: defaultLicenseType,
                type: defaultType,
                files: defaultFiles,
                licenseValidFrom: defaultLicenseValidFrom,
                licenseValidTill: defaultLicenseValidTill,
                logAudit: defaultLogAudit,
                management: defaultManagement,
                publicKey: defaultPublicKey,
                version: defaultVersion,
                webClient: defaultWebClient,
                disableCentralSecurityReports: defaultDisableCentralSecurityReports,
                disableCallbacks: defaultDisableCallbacks,
                allowedFileRepositoryTypes: defaultAllowedFileRepositoryTypes,
                multifactorEnabled: defaultMultifactorEnabled,
                systemWideDuoExists: defaultSystemWideDuoExists,
                verifyKey: defaultVerifyKey,
                status: defaultStatus,
                domainSynonyms: defaultDomainSynonyms,
                customDomainSynonyms: defaultCustomDomainSynonyms,
                domainSynonymMap: defaultDomainSynonymMap,
            });
        case SET_SERVER_INFO:
            return Object.assign({}, state, {
                allowUserSearchByEmail: action.info.allow_user_search_by_email,
                allowUserSearchByUsernamePartial: action.info.allow_user_search_by_username_partial,
                allowedSecondFactors: action.info.allowed_second_factors,
                api: action.info.api,
                authenticationMethods: action.info.authentication_methods,
                build: action.info.build,
                creditBuyAddress: action.info.credit_buy_address,
                creditCostsUpload: action.info.credit_costs_upload,
                creditCostsDownload: action.info.credit_costs_download,
                creditCostsStorage: action.info.credit_costs_storage,
                complianceCentralSecurityReportsRecurrenceInterval:
                    action.info.compliance_central_security_reports_recurrence_interval,
                complianceDisableApiKeys: action.info.compliance_disable_api_keys,
                complianceDisableDeleteAccount: action.info.compliance_disable_delete_account,
                complianceDisableEmergencyCodes: action.info.compliance_disable_emergency_codes,
                complianceDisableTotp: action.info.compliance_disable_totp,
                complianceDisableExport: action.info.compliance_disable_export,
                complianceDisableExportOfSharedItems: action.info.compliance_disable_export_of_shared_items,
                complianceDisableUnmanagedGroups: action.info.compliance_disable_unmanaged_groups,
                complianceDisableFileRepositories: action.info.compliance_disable_file_repositories,
                complianceDisableLinkShares: action.info.compliance_disable_link_shares,
                complianceDisableOfflineMode: action.info.compliance_disable_offline_mode,
                complianceMaxOfflineCacheTimeValid: typeof(action.info.compliance_max_offline_cache_time_valid) === "undefined" ? defaultComplianceMaxOfflineCacheTimeValid : action.info.compliance_max_offline_cache_time_valid,
                complianceDisableShares: action.info.compliance_disable_shares,
                complianceDisableRecoveryCodes: action.info.compliance_disable_recovery_codes,
                complianceEnforce2fa: action.info.compliance_enforce_2fa,
                complianceEnforceCentralSecurityReports: action.info.compliance_enforce_central_security_reports,
                complianceEnforceBreachDetection: typeof(action.info.compliance_enforce_breach_detection) === "undefined" ? defaultComplianceEnforceBreachDetection : action.info.compliance_enforce_breach_detection,
                complianceMinMasterPasswordComplexity: action.info.compliance_min_master_password_complexity,
                complianceMinMasterPasswordLength: action.info.compliance_min_master_password_length,
                complianceClipboardClearDelay: typeof(action.info.compliance_clipboard_clear_delay) === "undefined" ? defaultComplianceClipboardClearDelay : action.info.compliance_clipboard_clear_delay,
                complianceMinClipboardClearDelay: typeof(action.info.compliance_min_clipboard_clear_delay) === "undefined" ? defaultComplianceMinClipboardClearDelay : action.info.compliance_min_clipboard_clear_delay,
                complianceMaxClipboardClearDelay: typeof(action.info.compliance_max_clipboard_clear_delay) === "undefined" ? defaultComplianceMaxClipboardClearDelay : action.info.compliance_max_clipboard_clear_delay,
                compliancePasswordGeneratorDefaultPasswordLength:
                    action.info.compliance_password_generator_default_password_length,
                compliancePasswordGeneratorDefaultLettersUppercase:
                    action.info.compliance_password_generator_default_letters_uppercase,
                compliancePasswordGeneratorDefaultLettersLowercase:
                    action.info.compliance_password_generator_default_letters_lowercase,
                compliancePasswordGeneratorDefaultNumbers: action.info.compliance_password_generator_default_numbers,
                compliancePasswordGeneratorDefaultSpecialChars:
                    action.info.compliance_password_generator_default_special_chars,
                complianceServerSecrets:
                    action.info.compliance_server_secrets || 'auto',
                licenseId: action.info.license_id,
                licenseMaxUsers: action.info.license_max_users,
                licenseMode: action.info.license_mode,
                licenseType: action.info.license_type,
                type: action.info.type,
                files: action.info.files,
                licenseValidFrom: action.info.license_valid_from,
                licenseValidTill: action.info.license_valid_till,
                logAudit: action.info.log_audit,
                management: action.info.management,
                publicKey: action.info.public_key,
                version: action.info.version,
                webClient: action.info.web_client,

                disableCallbacks: typeof(action.info.disable_callbacks) === "undefined" ? defaultDisableCallbacks : action.info.disable_callbacks,
                allowedFileRepositoryTypes: typeof(action.info.allowed_file_repository_types) === "undefined" ? defaultAllowedFileRepositoryTypes : action.info.allowed_file_repository_types,
                disableCentralSecurityReports: action.info.disable_central_security_reports,
                multifactorEnabled: action.info.multifactor_enabled,
                faviconServiceUrl: action.info.favicon_service_url || defaultFaviconServiceUrl,
                systemWideDuoExists: action.info.system_wide_duo_exists,
                verifyKey: action.verifyKey,
                domainSynonyms: typeof(action.info.domain_synonyms) === "undefined" ? defaultDomainSynonyms : action.info.domain_synonyms,
                domainSynonymMap: helperService.buildDomainSynonymMap(
                    typeof(action.info.domain_synonyms) === "undefined" ? defaultDomainSynonyms : action.info.domain_synonyms,
                    state.customDomainSynonyms
                ),
            });
        case SET_SERVER_POLICY:

            const data = {}

            if (action.policy.hasOwnProperty('allow_user_search_by_email')) {
                data['allowUserSearchByEmail'] = action.policy.allow_user_search_by_email;
            }
            if (action.policy.hasOwnProperty('compliance_enforce_central_security_reports')) {
                data['complianceEnforceCentralSecurityReports'] = action.policy.compliance_enforce_central_security_reports;
            }
            if (action.policy.hasOwnProperty('compliance_enforce_breach_detection')) {
                data['complianceEnforceBreachDetection'] = action.policy.compliance_enforce_breach_detection;
            }
            if (action.policy.hasOwnProperty('compliance_central_security_reports_recurrence_interval')) {
                data['complianceCentralSecurityReportsRecurrenceInterval'] = action.policy.compliance_central_security_reports_recurrence_interval;
            }
            if (action.policy.hasOwnProperty('compliance_enforce_2fa')) {
                data['complianceEnforce2fa'] = action.policy.compliance_enforce_2fa;
            }
            if (action.policy.hasOwnProperty('compliance_disable_totp')) {
                data['complianceDisableTotp'] = action.policy.compliance_disable_totp;
            }
            if (action.policy.hasOwnProperty('compliance_disable_export')) {
                data['complianceDisableExport'] = action.policy.compliance_disable_export;
            }
            if (action.policy.hasOwnProperty('compliance_disable_export_of_shared_items')) {
                data['complianceDisableExportOfSharedItems'] = action.policy.compliance_disable_export_of_shared_items;
            }
            if (action.policy.hasOwnProperty('compliance_disable_unmanaged_groups')) {
                data['complianceDisableUnmanagedGroups'] = action.policy.compliance_disable_unmanaged_groups;
            }
            if (action.policy.hasOwnProperty('compliance_disable_delete_account')) {
                data['complianceDisableDeleteAccount'] = action.policy.compliance_disable_delete_account;
            }
            if (action.policy.hasOwnProperty('compliance_disable_api_keys')) {
                data['complianceDisableApiKeys'] = action.policy.compliance_disable_api_keys;
            }
            if (action.policy.hasOwnProperty('compliance_disable_emergency_codes')) {
                data['complianceDisableEmergencyCodes'] = action.policy.compliance_disable_emergency_codes;
            }
            if (action.policy.hasOwnProperty('compliance_disable_recovery_codes')) {
                data['complianceDisableRecoveryCodes'] = action.policy.compliance_disable_recovery_codes;
            }
            if (action.policy.hasOwnProperty('compliance_disable_file_repositories')) {
                data['complianceDisableFileRepositories'] = action.policy.compliance_disable_file_repositories;
            }
            if (action.policy.hasOwnProperty('compliance_disable_link_shares')) {
                data['complianceDisableLinkShares'] = action.policy.compliance_disable_link_shares;
            }
            if (action.policy.hasOwnProperty('compliance_disable_offline_mode')) {
                data['complianceDisableOfflineMode'] = action.policy.compliance_disable_offline_mode;
            }
            if (action.policy.hasOwnProperty('compliance_max_offline_cache_time_valid')) {
                data['complianceMaxOfflineCacheTimeValid'] = action.policy.compliance_max_offline_cache_time_valid;
            }
            if (action.policy.hasOwnProperty('compliance_disable_shares')) {
                data['complianceDisableShares'] = action.policy.compliance_disable_shares;
            }
            if (action.policy.hasOwnProperty('compliance_clipboard_clear_delay')) {
                data['complianceClipboardClearDelay'] = action.policy.compliance_clipboard_clear_delay;
            }
            if (action.policy.hasOwnProperty('compliance_min_clipboard_clear_delay')) {
                data['complianceMinClipboardClearDelay'] = action.policy.compliance_min_clipboard_clear_delay;
            }
            if (action.policy.hasOwnProperty('compliance_max_clipboard_clear_delay')) {
                data['complianceMaxClipboardClearDelay'] = action.policy.compliance_max_clipboard_clear_delay;
            }
            if (action.policy.hasOwnProperty('compliance_password_generator_default_password_length')) {
                data['compliancePasswordGeneratorDefaultPasswordLength'] = action.policy.compliance_password_generator_default_password_length;
            }
            if (action.policy.hasOwnProperty('compliance_password_generator_default_letters_uppercase')) {
                data['compliancePasswordGeneratorDefaultLettersUppercase'] = action.policy.compliance_password_generator_default_letters_uppercase;
            }
            if (action.policy.hasOwnProperty('compliance_password_generator_default_letters_lowercase')) {
                data['compliancePasswordGeneratorDefaultLettersLowercase'] = action.policy.compliance_password_generator_default_letters_lowercase;
            }
            if (action.policy.hasOwnProperty('compliance_password_generator_default_numbers')) {
                data['compliancePasswordGeneratorDefaultNumbers'] = action.policy.compliance_password_generator_default_numbers;
            }
            if (action.policy.hasOwnProperty('compliance_password_generator_default_special_chars')) {
                data['compliancePasswordGeneratorDefaultSpecialChars'] = action.policy.compliance_password_generator_default_special_chars;
            }
            if (action.policy.hasOwnProperty('compliance_server_secrets')) {
                data['complianceServerSecrets'] = action.policy.compliance_server_secrets;
            }
            if (action.policy.hasOwnProperty('allowed_file_repository_types')) {
                data['allowedFileRepositoryTypes'] = action.policy.allowed_file_repository_types;
            }
            if (action.policy.hasOwnProperty('allowed_second_factors')) {
                data['allowedSecondFactors'] = action.policy.allowed_second_factors;
            }
            if (action.policy.hasOwnProperty('disable_central_security_reports')) {
                data['disableCentralSecurityReports'] = action.policy.disable_central_security_reports;
            }
            if (action.policy.hasOwnProperty('disable_callbacks')) {
                data['disableCallbacks'] = action.policy.disable_callbacks;
            }
            if (action.policy.hasOwnProperty('allow_user_search_by_username_partial')) {
                data['allowUserSearchByUsernamePartial'] = action.policy.allow_user_search_by_username_partial;
            }

            return Object.assign({}, state, data);
        case SET_SERVER_STATUS:
            return Object.assign({}, state, {
                status: action.status,
            });
        case SET_SERVER_URL:
            return Object.assign({}, state, {
                url: action.url,
            });
        case SETTINGS_DATASTORE_LOADED:
            const customSynonyms = action.data.setting_custom_domain_synonyms || [];
            return Object.assign({}, state, {
                customDomainSynonyms: customSynonyms,
                domainSynonymMap: helperService.buildDomainSynonymMap(
                    state.domainSynonyms,
                    customSynonyms
                ),
            });
        case SET_DOMAIN_SYNONYMS_CONFIG:
            return Object.assign({}, state, {
                customDomainSynonyms: action.customDomainSynonyms,
                domainSynonymMap: helperService.buildDomainSynonymMap(
                    state.domainSynonyms,
                    action.customDomainSynonyms
                ),
            });
        default:
            return state;
    }
}

export default server;
