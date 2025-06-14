import { Box } from "@chakra-ui/react";

interface SpotifyEmbedProps {
  trackId: string;
}

export const SpotifyEmbed = ({ trackId }: SpotifyEmbedProps) => {
  if (!trackId) return null;

  // trackIdから余分な文字を削除（URLから抽出された場合の対策）
  const cleanTrackId = trackId.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <Box w="100%" h="152px" borderRadius="md" overflow="hidden" boxShadow="md">
      <iframe
        src={`https://open.spotify.com/embed/artist/${cleanTrackId}?utm_source=generator`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{
          borderRadius: "8px",
        }}
      />
    </Box>
  );
};
