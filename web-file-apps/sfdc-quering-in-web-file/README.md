# PitchForce API Documentation

## Overview
The PitchForce API provides a JavaScript interface for interacting with Salesforce data through Pitcher's connected services. It handles authentication, token refresh, and provides methods for querying and updating Salesforce records.

## Getting Started

### Prerequisites
- Pitcher NG environment with Salesforce connected service configured
- jsforce library loaded (`https://cdnjs.cloudflare.com/ajax/libs/jsforce/1.9.3/jsforce.min.js`)
- Pitcher JS API loaded (`https://player.pitcher.com/api/NG/js-api.php`)

### Basic Usage
```javascript
// Initialize the API (required before using any other methods)
const connected = await API.initialize();

if (connected) {
  // API is ready to use
  console.log('Connected to Salesforce');
} else {
  console.error('Failed to connect');
}
```

## API Methods

### initialize()
Initializes the API connection to Salesforce using Pitcher's connected services.

**Returns:** `Promise<boolean>` - `true` if connection successful, `false` otherwise

**Example:**
```javascript
const isConnected = await API.initialize();
```

### executeQuery(soql)
Executes a SOQL query against Salesforce.

**Parameters:**
- `soql` (string): The SOQL query to execute

**Returns:** `Promise<Object>` - Query result containing:
- `records`: Array of record objects (with `attributes` property removed)
- `totalSize`: Total number of records
- `done`: Boolean indicating if all records were returned

**Example:**
```javascript
try {
  const result = await API.executeQuery('SELECT Id, Name, Email FROM User LIMIT 10');
  console.log(`Found ${result.totalSize} users`);
  result.records.forEach(user => {
    console.log(`${user.Name} - ${user.Email}`);
  });
} catch (error) {
  console.error('Query failed:', error);
}
```

### updateRecord(objectType, recordId, updateData)
Updates a Salesforce record with new field values.

**Parameters:**
- `objectType` (string): Salesforce object type (e.g., 'Account', 'Contact')
- `recordId` (string): The ID of the record to update
- `updateData` (object): Object containing fields to update

**Returns:** `Promise<Object>` - Update result containing:
- `success`: Boolean indicating if update was successful
- `id`: The ID of the updated record
- `message`: Success message

**Example:**
```javascript
try {
  const result = await API.updateRecord('Account', '001XX000003DHPh', {
    Name: 'Updated Account Name',
    Type: 'Partner',
    Industry: 'Technology'
  });
  console.log(result.message); // "Successfully updated Account record"
} catch (error) {
  console.error('Update failed:', error);
}
```

### getUserInfo()
Gets the current user information from Pitcher environment (no API call required).

**Returns:** `Object|null` - User information containing:
- `display_name`: User's full name
- `email`: User's email address
- `username`: Salesforce username
- `organization`: Salesforce organization name
- `pitcher_user_id`: Pitcher user ID

**Example:**
```javascript
const userInfo = API.getUserInfo();
if (userInfo) {
  console.log(`Logged in as: ${userInfo.display_name} (${userInfo.email})`);
  console.log(`Salesforce Org: ${userInfo.organization}`);
}
```

### describeObject(objectName)
Retrieves metadata about a Salesforce object including its fields and properties.

**Parameters:**
- `objectName` (string): The name of the Salesforce object to describe

**Returns:** `Promise<Object>` - Object metadata including fields, relationships, etc.

**Example:**
```javascript
try {
  const accountMetadata = await API.describeObject('Account');
  console.log('Account fields:');
  accountMetadata.fields.forEach(field => {
    console.log(`${field.name} (${field.type})`);
  });
} catch (error) {
  console.error('Failed to describe object:', error);
}
```

### Helper Methods

#### isConnected()
Checks if the API is currently connected to Salesforce.

**Returns:** `boolean` - Connection status

**Example:**
```javascript
if (API.isConnected()) {
  // Safe to make API calls
}
```

#### getEnv()
Gets the Pitcher environment data.

**Returns:** `Object|null` - Pitcher environment object

#### getSalesforceConnection()
Gets the underlying jsforce connection object for advanced usage.

**Returns:** `Object|null` - jsforce Connection instance

#### getSalesforceDomain()
Gets the Salesforce instance URL.

**Returns:** `string` - Salesforce domain URL

## Error Handling

The API automatically handles authentication errors and attempts to refresh tokens when needed. All methods that make API calls will:

1. Detect `INVALID_SESSION_ID` or 401 errors
2. Attempt to refresh the Salesforce token
3. Retry the operation with the new token
4. Throw an error if refresh fails

**Example:**
```javascript
try {
  const result = await API.executeQuery('SELECT Id FROM Account');
  // Process results
} catch (error) {
  if (error.message.includes('INVALID_SESSION_ID')) {
    console.error('Authentication failed - please reconnect');
  } else {
    console.error('Query error:', error.message);
  }
}
```

## Common SOQL Query Examples

```javascript
// Get recent accounts
const accounts = await API.executeQuery(
  "SELECT Id, Name, Type, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT 20"
);

// Count contacts by account
const counts = await API.executeQuery(
  "SELECT AccountId, COUNT(Id) total FROM Contact GROUP BY AccountId"
);

// Search for records
const results = await API.executeQuery(
  "SELECT Id, Name FROM Account WHERE Name LIKE '%Acme%'"
);

// Get related data
const opportunities = await API.executeQuery(
  "SELECT Id, Name, Account.Name, StageName, Amount FROM Opportunity WHERE IsClosed = false"
);
```

## Best Practices

1. **Always initialize first**: Call `API.initialize()` before using any other methods
2. **Handle errors gracefully**: Wrap API calls in try-catch blocks
3. **Check connection status**: Use `API.isConnected()` before making calls
4. **Limit query results**: Always use LIMIT in SOQL queries to avoid timeouts
5. **Use selective fields**: Only query fields you need to improve performance

## Troubleshooting

### Connection Issues
- Ensure Salesforce is connected in Pitcher's connected services
- Check that the user has proper permissions in Salesforce
- Verify the Salesforce session is still valid

### Query Errors
- Validate SOQL syntax before executing
- Ensure object and field names are correct
- Check field-level security permissions

### Update Errors
- Verify the record ID exists
- Ensure user has edit permissions
- Check validation rules and required fields

## Security Notes

- Never expose tokens or credentials in client-side code
- The API uses Pitcher's secure token management
- All Salesforce access is subject to the connected user's permissions
- Tokens are automatically refreshed when expired