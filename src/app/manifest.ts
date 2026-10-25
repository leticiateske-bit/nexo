import type { MetadataRoute } from "next";

/** Permite instalar o NEXO na tela inicial do celular ("Adicionar à tela inicial"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXO — Career Intelligence",
    short_name: "NEXO",
    description: "Centro de inteligência pessoal para LinkedIn, networking e carreira.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F0E8",
    theme_color: "#082F25",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
