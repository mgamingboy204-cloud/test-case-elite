import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VAEL",
    short_name: "VAEL",
    description: "An exclusive, high-end matchmaking platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBFCF8",
    theme_color: "#FBFCF8",
  };
}
