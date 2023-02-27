import { LOGOUT, SET_SERVER_INFO, SET_SERVER_STATUS, SET_SERVER_URL } from "../actions/action-types";

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
const defaultComplianceDisableExport = false;
const defaultComplianceDisableUnmanagedGroups = false;
const defaultComplianceDisableFileRepositories = false;
const defaultComplianceDisableLinkShares = false;
const defaultComplianceDisableOfflineMode = false;
const defaultComplianceDisableShares = false;
const defaultComplianceDisableRecoveryCodes = false;
const defaultComplianceEnforce2fa = false;
const defaultComplianceEnforceCentralSecurityReports = false;
const defaultComplianceMinMasterPasswordComplexity = 0;
const defaultComplianceMinMasterPasswordLength = 12;
const defaultCompliancePasswordGeneratorDefaultPasswordLength = 16;
const defaultCompliancePasswordGeneratorDefaultLettersUppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const defaultCompliancePasswordGeneratorDefaultLettersLowercase = "abcdefghijklmnopqrstuvwxyz";
const defaultCompliancePasswordGeneratorDefaultNumbers = "0123456789";
const defaultCompliancePasswordGeneratorDefaultSpecialChars = ",.-;:_#'+*~!\"§$%&/@()=?{[]}\\";
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
const defaultMultifactorEnabled = false;
const defaultSystemWideDuoExists = false;
const defaultVerifyKey = "";
const defaultStatus = { data: {} };

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
        complianceDisableExport: defaultComplianceDisableExport,
        complianceDisableUnmanagedGroups: defaultComplianceDisableUnmanagedGroups,
        complianceDisableFileRepositories: defaultComplianceDisableFileRepositories,
        complianceDisableLinkShares: defaultComplianceDisableLinkShares,
        complianceDisableOfflineMode: defaultComplianceDisableOfflineMode,
        complianceDisableShares: defaultComplianceDisableShares,
        complianceDisableRecoveryCodes: defaultComplianceDisableRecoveryCodes,
        complianceEnforce2fa: defaultComplianceEnforce2fa,
        complianceEnforceCentralSecurityReports: defaultComplianceEnforceCentralSecurityReports,
        complianceMinMasterPasswordComplexity: defaultComplianceMinMasterPasswordComplexity,
        complianceMinMasterPasswordLength: defaultComplianceMinMasterPasswordLength,
        compliancePasswordGeneratorDefaultPasswordLength: defaultCompliancePasswordGeneratorDefaultPasswordLength,
        compliancePasswordGeneratorDefaultLettersUppercase: defaultCompliancePasswordGeneratorDefaultLettersUppercase,
        compliancePasswordGeneratorDefaultLettersLowercase: defaultCompliancePasswordGeneratorDefaultLettersLowercase,
        compliancePasswordGeneratorDefaultNumbers: defaultCompliancePasswordGeneratorDefaultNumbers,
        compliancePasswordGeneratorDefaultSpecialChars: defaultCompliancePasswordGeneratorDefaultSpecialChars,
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
                complianceDisableExport: defaultComplianceDisableExport,
                complianceDisableUnmanagedGroups: defaultComplianceDisableUnmanagedGroups,
                complianceDisableFileRepositories: defaultComplianceDisableFileRepositories,
                complianceDisableLinkShares: defaultComplianceDisableLinkShares,
                complianceDisableOfflineMode: defaultComplianceDisableOfflineMode,
                complianceDisableShares: defaultComplianceDisableShares,
                complianceDisableRecoveryCodes: defaultComplianceDisableRecoveryCodes,
                complianceEnforce2fa: defaultComplianceEnforce2fa,
                complianceEnforceCentralSecurityReports: defaultComplianceEnforceCentralSecurityReports,
                complianceMinMasterPasswordComplexity: defaultComplianceMinMasterPasswordComplexity,
                complianceMinMasterPasswordLength: defaultComplianceMinMasterPasswordLength,
                compliancePasswordGeneratorDefaultPasswordLength:
                    defaultCompliancePasswordGeneratorDefaultPasswordLength,
                compliancePasswordGeneratorDefaultLettersUppercase:
                    defaultCompliancePasswordGeneratorDefaultLettersUppercase,
                compliancePasswordGeneratorDefaultLettersLowercase:
                    defaultCompliancePasswordGeneratorDefaultLettersLowercase,
                compliancePasswordGeneratorDefaultNumbers: defaultCompliancePasswordGeneratorDefaultNumbers,
                compliancePasswordGeneratorDefaultSpecialChars: defaultCompliancePasswordGeneratorDefaultSpecialChars,
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
                complianceDisableExport: action.info.compliance_disable_export,
                complianceDisableUnmanagedGroups: action.info.compliance_disable_unmanaged_groups,
                complianceDisableFileRepositories: action.info.compliance_disable_file_repositories,
                complianceDisableLinkShares: action.info.compliance_disable_link_shares,
                complianceDisableOfflineMode: action.info.compliance_disable_offline_mode,
                complianceDisableShares: action.info.compliance_disable_shares,
                complianceDisableRecoveryCodes: action.info.compliance_disable_recovery_codes,
                complianceEnforce2fa: action.info.compliance_enforce_2fa,
                complianceEnforceCentralSecurityReports: action.info.compliance_enforce_central_security_reports,
                complianceMinMasterPasswordComplexity: action.info.compliance_min_master_password_complexity,
                complianceMinMasterPasswordLength: action.info.compliance_min_master_password_length,
                compliancePasswordGeneratorDefaultPasswordLength:
                    action.info.compliance_password_generator_default_password_length,
                compliancePasswordGeneratorDefaultLettersUppercase:
                    action.info.compliance_password_generator_default_letters_uppercase,
                compliancePasswordGeneratorDefaultLettersLowercase:
                    action.info.compliance_password_generator_default_letters_lowercase,
                compliancePasswordGeneratorDefaultNumbers: action.info.compliance_password_generator_default_numbers,
                compliancePasswordGeneratorDefaultSpecialChars:
                    action.info.compliance_password_generator_default_special_chars,
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

                disableCallbacks: action.info.disable_callbacks,
                allowedFileRepositoryTypes: action.info.allowed_file_repository_types,
                disableCentralSecurityReports: action.info.disable_central_security_reports,
                multifactorEnabled: action.info.multifactor_enabled,
                systemWideDuoExists: action.info.system_wide_duo_exists,
                verifyKey: action.verifyKey,
            });
        case SET_SERVER_STATUS:
            return Object.assign({}, state, {
                status: action.status,
            });
        case SET_SERVER_URL:
            return Object.assign({}, state, {
                url: action.url,
            });
        default:
            return state;
    }
}

export default server;
