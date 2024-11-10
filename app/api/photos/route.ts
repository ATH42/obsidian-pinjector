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

    // Forward URLs to Obsidian plugin
    const obsidianResponse = await fetch("http://localhost:27123/addImages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photos: uploads }),
    });

    if (!obsidianResponse.ok) {
      throw new Error("Failed to update Obsidian");
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
