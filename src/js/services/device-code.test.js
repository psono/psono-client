import React from 'react';
import deviceCodeService from './device-code';
import apiClient from './api-client';
import cryptoLibrary from './crypto-library';
import { getStore } from './store';

jest.mock('./api-client');
jest.mock('./crypto-library');
jest.mock('./store');

describe('Service: device-code test suite', function() {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('device-code exists', function() {
        expect(deviceCodeService).toBeDefined();
    });

    it('claimDeviceCode exists', function() {
        expect(deviceCodeService.claimDeviceCode).toBeDefined();
        expect(typeof deviceCodeService.claimDeviceCode).toBe('function');
    });

    it('claimDeviceCode successful claim', async function() {
        const mockState = {
            user: {
                userPrivateKey: 'mock_private_key',
                userSecretKey: 'mock_secret_key', 
                userSauce: 'mock_user_sauce',
                token: 'mock_token',
                sessionSecretKey: 'mock_session_secret'
            }
        };
        
        getStore.mockReturnValue({
            getState: () => mockState
        });

        const mockEncryptedCredentials = {
            text: 'encrypted_credentials_hex',
            nonce: 'encryption_nonce_hex'
        };
        cryptoLibrary.encryptData.mockReturnValue(mockEncryptedCredentials);

        apiClient.claimDeviceCode.mockResolvedValue({ success: true });

        const result = await deviceCodeService.claimDeviceCode('device_code_id', 'secret_box_key');

        expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
            JSON.stringify({
                user_private_key: 'mock_private_key',
                user_secret_key: 'mock_secret_key',
                user_sauce: 'mock_user_sauce'
            }),
            'secret_box_key'
        );

        expect(apiClient.claimDeviceCode).toHaveBeenCalledWith(
            'mock_token',
            'mock_session_secret',
            'device_code_id',
            'encrypted_credentials_hex',
            'encryption_nonce_hex'
        );

        expect(result).toEqual({ success: true });
    });

    test.each([
        {
            description: 'missing userPrivateKey',
            nullField: 'userPrivateKey',
            expectedError: 'MISSING_DEVICE_CODE_INFORMATION',
            expectedLogMessage: 'User secrets not available in store for device code claim.'
        },
        {
            description: 'missing userSecretKey', 
            nullField: 'userSecretKey',
            expectedError: 'MISSING_DEVICE_CODE_INFORMATION',
            expectedLogMessage: 'User secrets not available in store for device code claim.'
        },
        {
            description: 'missing userSauce',
            nullField: 'userSauce', 
            expectedError: 'MISSING_DEVICE_CODE_INFORMATION',
            expectedLogMessage: 'User secrets not available in store for device code claim.'
        },
        {
            description: 'missing authentication token',
            nullField: 'token',
            expectedError: 'USER_AUTHENTICATION_REQUIRED',
            expectedLogMessage: 'Authentication token or session secret key not available for device code claim.'
        },
        {
            description: 'missing session secret key',
            nullField: 'sessionSecretKey',
            expectedError: 'USER_AUTHENTICATION_REQUIRED',
            expectedLogMessage: 'Authentication token or session secret key not available for device code claim.'
        }
    ])('claimDeviceCode fails with $description', async ({ nullField, expectedError, expectedLogMessage }) => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const mockState = {
            user: {
                userPrivateKey: 'mock_private_key',
                userSecretKey: 'mock_secret_key',
                userSauce: 'mock_user_sauce', 
                token: 'mock_token',
                sessionSecretKey: 'mock_session_secret'
            }
        };
        
        // Set the specified field to null
        mockState.user[nullField] = null;
        
        getStore.mockReturnValue({
            getState: () => mockState
        });

        await expect(
            deviceCodeService.claimDeviceCode('device_code_id', 'secret_box_key')
        ).rejects.toEqual({
            data: { detail: expectedError }
        });

        expect(cryptoLibrary.encryptData).not.toHaveBeenCalled();
        expect(apiClient.claimDeviceCode).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expectedLogMessage);
        
        consoleErrorSpy.mockRestore();
    });

    it('claimDeviceCode fails with encryption error', async function() {
        const mockState = {
            user: {
                userPrivateKey: 'mock_private_key',
                userSecretKey: 'mock_secret_key',
                userSauce: 'mock_user_sauce',
                token: 'mock_token',
                sessionSecretKey: 'mock_session_secret'
            }
        };
        
        getStore.mockReturnValue({
            getState: () => mockState
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const encryptionError = new Error('Encryption failed');
        cryptoLibrary.encryptData.mockImplementation(() => {
            throw encryptionError;
        });

        await expect(
            deviceCodeService.claimDeviceCode('device_code_id', 'secret_box_key')
        ).rejects.toEqual({
            data: { detail: "DEVICE_CODE_SECRET_INVALID" }
        });

        expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
            JSON.stringify({
                user_private_key: 'mock_private_key',
                user_secret_key: 'mock_secret_key',
                user_sauce: 'mock_user_sauce'
            }),
            'secret_box_key'
        );

        expect(apiClient.claimDeviceCode).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error encrypting credentials bundle for device code claim:', encryptionError);
        
        consoleErrorSpy.mockRestore();
    });

    it('claimDeviceCode fails with API client error', async function() {
        const mockState = {
            user: {
                userPrivateKey: 'mock_private_key',
                userSecretKey: 'mock_secret_key',
                userSauce: 'mock_user_sauce',
                token: 'mock_token',
                sessionSecretKey: 'mock_session_secret'
            }
        };
        
        getStore.mockReturnValue({
            getState: () => mockState
        });

        const mockEncryptedCredentials = {
            text: 'encrypted_credentials_hex',
            nonce: 'encryption_nonce_hex'
        };
        cryptoLibrary.encryptData.mockReturnValue(mockEncryptedCredentials);

        // Mock API client to reject
        const apiError = {
            data: { detail: "DEVICE_CODE_EXPIRED" }
        };
        apiClient.claimDeviceCode.mockRejectedValue(apiError);

        await expect(
            deviceCodeService.claimDeviceCode('device_code_id', 'secret_box_key')
        ).rejects.toEqual(apiError);

        expect(cryptoLibrary.encryptData).toHaveBeenCalled();
        expect(apiClient.claimDeviceCode).toHaveBeenCalledWith(
            'mock_token',
            'mock_session_secret',
            'device_code_id',
            'encrypted_credentials_hex',
            'encryption_nonce_hex'
        );
    });

});
