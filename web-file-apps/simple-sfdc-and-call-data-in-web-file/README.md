# Simple Data Display in Web File App

## Overview
The Simple Data Display app demonstrates how to access and display Pitcher environment data and Salesforce information in a web file application. It provides a multi-page interface for viewing user details, call information, and connection status through two distinct pages with different UI themes.

## Features
- **Salesforce User Information Display**: Shows current user details from Pitcher environment
- **Call Data Visualization**: Displays active call information and selected account details
- **Multi-page Navigation**: Two-page interface with consistent navigation
- **Real-time Data Refresh**: Automatic and manual data refresh capabilities
- **Usage Tracking**: Built-in analytics tracking for user interactions
- **Responsive Design**: Modern UI with distinct color themes per page

## Getting Started

### Prerequisites
- Pitcher NG environment with Salesforce connected service configured
- jsforce library (loaded via CDN)
- Pitcher JS API (loaded via CDN)

### File Structure
```
simple-data-in-web-file/
├── index.html          # Main dashboard (blue theme)
├── page2.html          # Secondary dashboard (green theme)
└── README.md           # This documentation
```

### Basic Usage
1. Open `index.html` in the Pitcher environment
2. The app automatically initializes and connects to Salesforce
3. User and call data are loaded and displayed
4. Navigate between pages using the navigation buttons

## Pages Overview

### Page 1 - Main Dashboard (`index.html`)
- **Theme**: Blue color scheme (#1976d2)
- **Focus**: Primary user information and call data display
- **Features**:
  - User information section with Salesforce details
  - Call data section showing selected account information
  - Navigation to Page 2
  - Data refresh functionality

### Page 2 - Secondary Dashboard (`page2.html`)
- **Theme**: Green color scheme (#2e7d32)
- **Focus**: Enhanced data display with additional context
- **Features**:
  - Enhanced user display with handlebars syntax examples
  - Detailed call information with debugging context
  - Back navigation to Page 1
  - Data refresh functionality

## Data Sources

### User Data
The app displays the following user information:
- **Display Name**: User's first and last name or email fallback
- **Email Address**: User's email from Pitcher environment
- **Organization**: Salesforce organization name
- **SF Username**: Salesforce username (if available)

**Source**: Retrieved from `pitcher.useApi().getEnv()` environment data

### Call Data
The app shows active call information:
- **Selected Account**: Name and ID of currently selected account
- **Call State**: Current state of the call
- **Selected Contacts**: Count of selected contacts
- **Selected Users**: Count of selected users

**Source**: Retrieved from localStorage `call` key

## Key Functions

### API Initialization
```javascript
const API = (() => {
  // Initialize connection to Salesforce through Pitcher
  const initialize = async () => {
    // Returns true if successfully connected, false otherwise
  };
  
  const getEnv = () => env;
  const getSalesforceConnection = () => sfConn;
  const isConnected = () => sfConn !== null;
  
  return { initialize, getEnv, getSalesforceConnection, isConnected };
})();
```

### Data Loading Functions
- `loadUserData()`: Fetches user information from Pitcher environment
- `loadCallData()`: Retrieves call data from localStorage
- `refreshData()`: Refreshes both user and call data
- `displayUserData()`: Updates user information UI
- `displayCallData()`: Updates call information UI

### Navigation Functions
- `navigateToPage2()`: Navigates from main page to secondary page
- `backToHome()`: Returns from secondary page to main page

## UI Components

### Navigation Bar
- Consistent across both pages
- Shows current page state
- Quick navigation between pages

### Data Sections
- **User Information Section**: Displays Salesforce user details
- **Call Information Section**: Shows active call and account data
- **Message Area**: Displays status messages and notifications

### Interactive Elements
- **Refresh Data Button**: Manually refreshes all data
- **Navigation Buttons**: Switch between pages
- **Status Messages**: Real-time feedback on operations

## Error Handling
The app includes comprehensive error handling for:
- API initialization failures
- Data loading errors
- localStorage access issues
- Network connectivity problems

Error messages are displayed in the UI with appropriate styling and context.

## Analytics & Tracking
Both pages include automatic usage tracking:
- **Event Names**: 
  - `SimpleDataDisplayPage1Track` (Main page)
  - `SimpleDataDisplayPage2Track` (Secondary page)
- **Tracked Data**:
  - Page duration (updated every 10 seconds)
  - Current page name
  - Timestamp
  - Client type
- **Implementation**: Uses `pitcher.useApi().track()` method

## Styling & Themes

### Page 1 (index.html)
- **Primary Color**: Blue (#1976d2)
- **Background**: Light gray (#f5f5f5)
- **Data Sections**: Light blue-gray theme

### Page 2 (page2.html)
- **Primary Color**: Green (#2e7d32)
- **Background**: Light blue-gray (#f0f4f8)
- **Data Sections**: Light green theme

### Common Styling Features
- Modern system font stack
- Responsive design (max-width: 800px)
- Card-based layout with shadows
- Hover effects on interactive elements
- Consistent spacing and typography

## Data Display Examples

### User Information Display
```html
👤 John Doe
Email: john.doe@company.com
Organization: Company Salesforce Org
SF Username: john.doe@company.com.dev
```

### Call Information Display
```html
🏢 Selected Account: Acme Corporation
Account ID: 001XX000003DHPh
Call State: active
Selected Contacts: 3
Selected Users: 1
```

## Browser Compatibility
- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Works within Pitcher web file environment

## Best Practices
1. **Data Refresh**: The app automatically loads data on initialization
2. **Error Feedback**: All errors are displayed to users with appropriate context
3. **Performance**: Efficient data loading with minimal API calls
4. **User Experience**: Clear navigation and status feedback
5. **Responsive Design**: Works across different screen sizes

## Troubleshooting

### Common Issues
1. **"No user data available"**
   - Check Pitcher environment connection
   - Verify user authentication

2. **"Not in a call"**
   - Ensure a call is active in Pitcher
   - Check localStorage for call data

3. **"Salesforce connection not available"**
   - Verify Salesforce connected service configuration
   - Check user permissions and token validity

### Debug Information
Page 2 includes additional debug context:
- Handlebars syntax examples
- Data access path explanations
- Null/undefined state indicators

## Security Considerations
- All Salesforce access uses Pitcher's secure token management
- No sensitive data is stored in localStorage
- API tokens are managed automatically by Pitcher environment
- User data access is subject to Salesforce permissions

## Development Notes
- Both pages share similar API initialization code
- Data is stored in global variables for easy access
- LocalStorage is used only for call data persistence
- Periodic tracking helps monitor user engagement
- Clean separation between data logic and UI updates 