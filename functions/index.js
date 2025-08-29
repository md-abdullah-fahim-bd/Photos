const functions = require("firebase-functions");
const { google } = require("googleapis");

// The ID of your Google Sheet
const SPREADSHEET_ID = '18kItbd7f9kErOfTfjBUjgjjPXW_Fbk_MHciOiJeQh0E';

// Define the admin email address
const ADMIN_EMAIL = 'abdullahfahim01823281@gmail.com';

// Use a service account to authenticate with Google Sheets
const sheetsAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: functions.config().google.service_account.client_email,
    private_key: functions.config().google.service_account.private_key.replace(/\\n/g, '\n')
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

exports.processPhotos = functions.https.onCall(async (data, context) => {
  const accessToken = data.accessToken;
  const userEmail = context.auth.token.email; // Get the user's email from the Firebase auth token
  
  if (!userEmail) {
    throw new functions.https.HttpsError('unauthenticated', 'User email not found in token.');
  }

  // Use the user's accessToken to authenticate with the Google Photos API
  const photosAuth = new google.auth.OAuth2();
  photosAuth.setCredentials({ access_token: accessToken });

  const photosLibrary = google.photoslibrary({ version: 'v1', auth: photosAuth });
  const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

  let photoUrls = [];
  try {
    const response = await photosLibrary.mediaItems.search({
      pageSize: 10, // Get the first 10 photos as an example
      filters: { mediaTypeFilter: { mediaTypes: ['PHOTO'] } },
    });
    
    const mediaItems = response.data.mediaItems;
    if (mediaItems) {
      photoUrls = mediaItems.map(item => [item.baseUrl]);
    }
  } catch (error) {
    console.error('Error fetching photos:', error);
    return { success: false, message: 'Failed to fetch photos.' };
  }

  // Determine the sheet and range based on the user's email
  let range;
  if (userEmail === ADMIN_EMAIL) {
    // If the user is the admin, use a dedicated sheet or range
    range = 'AdminPhotos!A:B'; // Create a sheet named "AdminPhotos" for your links
    // Append the user's email next to the photo link for the admin view
    photoUrls = photoUrls.map(url => [url[0], userEmail]);
  } else {
    // For regular users, append to a general sheet or range
    range = 'UserPhotos!A:B'; // Create a sheet named "UserPhotos" for all other users
    // Append the user's email next to the photo link
    photoUrls = photoUrls.map(url => [url[0], userEmail]);
  }

  // Insert the photo URLs into the Google Sheet
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: photoUrls,
      },
    });
    
    return { success: true, message: 'Photo links added successfully.' };
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    return { success: false, message: 'Failed to write to spreadsheet.' };
  }
});
