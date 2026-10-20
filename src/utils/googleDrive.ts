// Google Drive REST API utilities for Hủ Design Studio

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  thumbnailLink?: string;
  folderId: string;
  folderLink?: string;
}

const ROOT_FOLDER_NAME = 'hudesign-du-an';

/**
 * Tìm hoặc tạo thư mục trên Google Drive
 */
export const findOrCreateFolder = async (
  token: string,
  folderName: string,
  parentId?: string
): Promise<DriveFolderInfo> => {
  // Query existing folder
  let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Lỗi tìm thư mục trên Google Drive: ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      name: searchData.files[0].name,
      webViewLink: searchData.files[0].webViewLink,
    };
  }

  // Create folder if not found
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      }),
    }
  );

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Không thể tạo thư mục '${folderName}' trên Google Drive: ${errorText}`);
  }

  const createData = await createRes.json();
  return {
    id: createData.id,
    name: createData.name,
    webViewLink: createData.webViewLink,
  };
};

/**
 * Tạo & Đảm bảo cấu trúc thư mục:
 * hudesign-du-an / [Tên Khách Hàng - Doanh nghiệp]
 */
export const ensureClientFolderStructure = async (
  token: string,
  clientName: string,
  clientCompany?: string
): Promise<{ rootFolder: DriveFolderInfo; clientFolder: DriveFolderInfo }> => {
  // 1. Thư mục gốc hudesign-du-an
  const rootFolder = await findOrCreateFolder(token, ROOT_FOLDER_NAME);

  // 2. Thư mục riêng của khách hàng
  const cleanCompany = (clientCompany || '').trim();
  const cleanName = (clientName || '').trim();
  const folderTitle = cleanCompany 
    ? (cleanName && cleanName !== cleanCompany ? `${cleanCompany} (${cleanName})` : cleanCompany)
    : (cleanName || 'Khách hàng');

  const clientFolder = await findOrCreateFolder(token, folderTitle, rootFolder.id);

  return { rootFolder, clientFolder };
};

/**
 * Tạo & Đảm bảo cấu trúc thư mục 3 cấp:
 * hudesign-du-an / [Tên Khách Hàng - Doanh nghiệp] / [Tên Bài Thiết Kế]
 */
export const ensureDesignItemFolderStructure = async (
  token: string,
  clientName: string,
  clientCompany?: string,
  designTitle?: string
): Promise<{ 
  rootFolder: DriveFolderInfo; 
  clientFolder: DriveFolderInfo; 
  designFolder: DriveFolderInfo;
}> => {
  // 1 & 2. Đảm bảo thư mục gốc và thư mục khách hàng
  const { rootFolder, clientFolder } = await ensureClientFolderStructure(token, clientName, clientCompany);

  // 3. Thư mục con riêng biệt của từng bài thiết kế
  const cleanTitle = (designTitle || 'Bài thiết kế').trim() || 'Bài thiết kế';
  const designFolder = await findOrCreateFolder(token, cleanTitle, clientFolder.id);

  return { rootFolder, clientFolder, designFolder };
};

/**
 * Tải file ảnh demo lên Google Drive và cấp quyền xem
 */
export const uploadDemoImageToDrive = async (
  token: string,
  folderId: string,
  fileBlob: Blob,
  fileName: string
): Promise<{ fileId: string; fileName: string; webViewLink: string; thumbnailLink?: string }> => {
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: 'Ảnh demo sản phẩm thiết kế - Hủ Design Studio',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const mimeType = fileBlob.type || 'image/png';
  const reader = new FileReader();

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(fileBlob);
  });

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const fileHeaderBuffer = encoder.encode(fileHeader);
  const closeBuffer = encoder.encode(closeDelimiter);

  // Combine into single Uint8Array
  const totalLength = metadataBuffer.length + fileHeaderBuffer.length + arrayBuffer.byteLength + closeBuffer.length;
  const combinedBuffer = new Uint8Array(totalLength);

  let offset = 0;
  combinedBuffer.set(metadataBuffer, offset);
  offset += metadataBuffer.length;
  combinedBuffer.set(fileHeaderBuffer, offset);
  offset += fileHeaderBuffer.length;
  combinedBuffer.set(new Uint8Array(arrayBuffer), offset);
  offset += arrayBuffer.byteLength;
  combinedBuffer.set(closeBuffer, offset);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combinedBuffer,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Tải ảnh lên Google Drive thất bại: ${errorText}`);
  }

  const uploadData = await uploadRes.json();

  // Make the file publicly viewable with link (Reader permission for anyone)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Cấp quyền xem công khai thất bại hoặc đã có quyền:', permErr);
  }

  return {
    fileId: uploadData.id,
    fileName: uploadData.name,
    webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
    thumbnailLink: uploadData.thumbnailLink,
  };
};

/**
 * Chuyển đổi base64 / Data URL sang Blob
 */
export const dataURLToBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
