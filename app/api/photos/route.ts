import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos.length) {
      return NextResponse.json(
        { success: false, error: "No photos uploaded" },
        { status: 400 },
      );
    }

    // Upload all photos to Vercel Blob
    const uploads = await Promise.all(
      photos.map(async (photo) => {
        const filename = `${Date.now()}-${photo.name}`;
        const blob = await put(filename, photo, {
          access: "public",
        });
        return {
          filename,
          url: blob.url,
        };
      }),
    );

    // Try to update Obsidian if running locally
    try {
      const obsidianResponse = await fetch("http://localhost:27123/addImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photos: uploads }),
        signal: AbortSignal.timeout(5000),
      });

      if (!obsidianResponse.ok) {
        console.warn(
          "Failed to update Obsidian, but photos were uploaded successfully",
        );
      }
    } catch (obsidianError) {
      console.warn("Could not connect to Obsidian plugin:", obsidianError);
    }

    return NextResponse.json({
      success: true,
      photos: uploads,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to process photos",
      },
      { status: 500 },
    );
  }
}
