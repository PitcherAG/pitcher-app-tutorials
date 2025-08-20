/**
 * API utility functions for Salesforce authentication and queries
 */
const API = (() => {
    // Private variables
    let authToken = '';
    let env = null;
    let sfConn = null;
    let sfdcToken = '';
    let sfdcDomain = '';
    let pitcherApi = null;

    /**
     * Initialize the API and retrieve authentication token
     */
    const initialize = async () => {
        try {
            // Get Pitcher environment data
            pitcherApi = pitcher.useApi();
            env = await pitcherApi.getEnv();

            if (env && env.pitcher && env.pitcher.access_token) {
                authToken = env.pitcher.access_token;
                
                // Get Salesforce credentials from connected services
                const connectedServices = env.pitcher.user.connected_services;
                if (connectedServices && connectedServices.length > 0) {
                    const sfdc = connectedServices.find(service => 
                        service.type === 'crm' && service.provider === 'salesforce'
                    );
                    
                    if (sfdc) {
                        sfdcDomain = sfdc?.urls?.custom_domain;
                        sfdcToken = sfdc?.access_token;

                        if (sfdcToken && sfdcDomain) {
                            // Initialize jsforce connection
                            sfConn = new jsforce.Connection({
                                instanceUrl: sfdcDomain,
                                accessToken: sfdcToken,
                                version: '57.0'
                            });

                            console.log('Connected to Salesforce successfully');
                            return true;
                        }
                    }
                }

                console.error('No Salesforce credentials found in connected services');
                return false;
            } else {
                console.error('No token found in environment');
                return false;
            }
        } catch (error) {
            console.error('Error initializing API:', error);
            return false;
        }
    };

    /**
     * Execute a SOQL query against Salesforce
     * @param {string} soql - The SOQL query to execute
     * @returns {Promise} - Query result data
     */
    const executeQuery = async (soql) => {
        try {
            if (!sfConn) {
                throw new Error('Not connected to Salesforce');
            }

            // Execute the query
            const result = await sfConn.query(soql);

            // Transform records to remove attributes property for cleaner display
            const records = result.records.map(record => {
                const cleanRecord = { ...record };
                delete cleanRecord.attributes;
                return cleanRecord;
            });

            return {
                records: records,
                totalSize: result.totalSize,
                done: result.done
            };
        } catch (error) {
            console.error('Error executing SOQL query:', error);
            
            // Check if this is an authentication error
            if (error.errorCode === 'INVALID_SESSION_ID' || error.name === 'invalid_session_id' ||
                (error.response && error.response.statusCode === 401)) {
                
                // Try to refresh the token
                const refreshed = await handleTokenRefresh();
                
                if (refreshed) {
                    // Retry the operation with the refreshed token
                    return executeQuery(soql);
                }
            }
            
            throw error;
        }
    };

    /**
     * Handle 401 or INVALID_SESSION_ID errors by refreshing the Salesforce token
     */
    const handleTokenRefresh = async () => {
        try {
            console.log('Attempting to refresh Salesforce token...');
            
            // Try to refresh user's direct token via REST call
            const response = await fetch('/api/v1/users/me/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ connection_id: 'salesforce' })
            });

            const data = await response.json();

            if (data && data.access_token) {
                // Update the token and recreate the connection
                sfdcToken = data.access_token;
                sfConn = new jsforce.Connection({
                    instanceUrl: sfdcDomain,
                    accessToken: sfdcToken,
                    version: '57.0'
                });

                console.log('Salesforce token refreshed successfully');
                return true;
            }

            console.error('Failed to refresh Salesforce token');
            return false;
        } catch (error) {
            console.error('Error refreshing Salesforce token:', error);
            return false;
        }
    };

    /**
     * Get the user information from Pitcher environment
     */
    const getUserInfo = () => {
        if (!env || !env.pitcher || !env.pitcher.user) {
            return null;
        }
        
        const user = env.pitcher.user;
        const sfService = user.connected_services?.find(service => 
            service.type === 'crm' && service.provider === 'salesforce'
        );
        
        return {
            display_name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
            email: user.email,
            username: sfService?.username || user.email,
            organization: sfService?.organization_name || 'Salesforce',
            pitcher_user_id: user.id
        };
    };

    /**
     * Describe a Salesforce object to get its fields
     * @param {string} objectName - The name of the object to describe
     * @returns {Promise} - Object description data
     */
    const describeObject = async (objectName) => {
        try {
            if (!sfConn) {
                throw new Error('Not connected to Salesforce');
            }
            return await sfConn.describe(objectName);
        } catch (error) {
            console.error(`Error describing Salesforce object ${objectName}:`, error);
            throw error;
        }
    };

    /**
     * Update a Salesforce record
     * @param {string} objectType - The Salesforce object type (e.g., 'Account', 'Contact')
     * @param {string} recordId - The ID of the record to update
     * @param {object} updateData - Object containing fields to update
     * @returns {Promise} - Update result
     */
    const updateRecord = async (objectType, recordId, updateData) => {
        try {
            if (!sfConn) {
                throw new Error('Not connected to Salesforce');
            }

            // Create update object with Id
            const recordToUpdate = {
                Id: recordId,
                ...updateData
            };

            // Use jsforce update method
            const result = await sfConn.sobject(objectType).update(recordToUpdate);

            if (result.success) {
                return {
                    success: true,
                    id: result.id,
                    message: `Successfully updated ${objectType} record`
                };
            } else {
                throw new Error(result.errors ? result.errors.join(', ') : 'Update failed');
            }
        } catch (error) {
            console.error(`Error updating ${objectType} record:`, error);
            
            // Check if this is an authentication error
            if (error.errorCode === 'INVALID_SESSION_ID' || error.name === 'invalid_session_id' ||
                (error.response && error.response.statusCode === 401)) {
                
                // Try to refresh the token
                const refreshed = await handleTokenRefresh();
                
                if (refreshed) {
                    // Retry the operation with the refreshed token
                    return updateRecord(objectType, recordId, updateData);
                }
            }
            
            throw error;
        }
    };

    // Public API
    return {
        initialize,
        executeQuery,
        getUserInfo,
        describeObject,
        updateRecord,
        getEnv: () => env,
        getSalesforceConnection: () => sfConn,
        getSalesforceDomain: () => sfdcDomain,
        isConnected: () => sfConn !== null
    };
})();