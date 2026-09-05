// OnePay intentionally does not upload files to third-party CDNs.
// Keep this module for compatibility with older plugins.
export async function uploadFile() {
  throw new Error('OnePay uploader eksternal dinonaktifkan.');
}
export async function uploadFile2() {
  throw new Error('OnePay uploader eksternal dinonaktifkan.');
}
