import type { ReconstructionSettings } from '../types';

const FILE_NAME = 'rebind_settings.json';

/**
 * Searches for the settings file in the hidden appDataFolder.
 */
async function findSettingsFile(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${FILE_NAME}'`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to search Drive:', await response.text());
    return null;
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Fetches settings from Google Drive.
 */
export async function fetchSettingsFromDrive(token: string): Promise<ReconstructionSettings | null> {
  try {
    const fileId = await findSettingsFile(token);
    if (!fileId) {
      console.log('No settings file found in Drive.');
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to download settings:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Settings fetched from Drive successfully');
    return data as ReconstructionSettings;
  } catch (err) {
    console.error('Error fetching settings from Drive:', err);
    return null;
  }
}

/**
 * Uploads (creates or overwrites) settings to Google Drive.
 */
export async function uploadSettingsToDrive(token: string, settings: ReconstructionSettings): Promise<boolean> {
  try {
    const fileId = await findSettingsFile(token);
    const fileContent = JSON.stringify(settings, null, 2);
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
      parents: ['appDataFolder']
    };

    let response;
    
    if (fileId) {
      // Update existing file (Media Upload)
      response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );
    } else {
      // Create new file (Multipart Upload)
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );
    }

    if (!response.ok) {
      console.error('Failed to upload settings:', await response.text());
      return false;
    }

    console.log('Settings synced to Drive successfully!');
    return true;
  } catch (err) {
    console.error('Error uploading settings to Drive:', err);
    return false;
  }
}
