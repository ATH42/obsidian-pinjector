"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoUpload {
  filename: string;
  url: string;
}

interface UploadResponse {
  success: boolean;
  photos?: PhotoUpload[];
  error?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoUpload[]>([]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    setFiles(selectedFiles);
    setPreviewUrls(
      Array.from(selectedFiles).map((file) => URL.createObjectURL(file)),
    );
  };

  const removeFile = (index: number) => {
    if (!files) return;

    URL.revokeObjectURL(previewUrls[index]);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newPreviewUrls);

    const dt = new DataTransfer();
    Array.from(files)
      .filter((_, i) => i !== index)
      .forEach((file) => dt.items.add(file));
    setFiles(dt.files);
  };

  const upload = async () => {
    if (!files?.length) return;

    setUploading(true);
    setMessage("");
    setUploadedPhotos([]);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success && result.photos) {
        setMessage("Photos uploaded successfully");
        setUploadedPhotos(result.photos);
        setFiles(null);
        setPreviewUrls([]);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        id="fileInput"
        onChange={handleFiles}
      />

      <label
        htmlFor="fileInput"
        className="block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-blue-500"
      >
        Select Photos
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 my-4">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-square">
              <Image
                src={url}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <button
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6"
                onClick={() => removeFile(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {previewUrls.length > 0 && (
        <button
          className="w-full p-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          onClick={upload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      )}

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            message.includes("failed") ? "bg-red-100" : "bg-green-100"
          }`}
        >
          {message}
        </div>
      )}

      {uploadedPhotos.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Uploaded Photos:</h3>
          <div className="grid grid-cols-2 gap-4">
            {uploadedPhotos.map((photo, i) => (
              <div key={i} className="relative h-48">
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
