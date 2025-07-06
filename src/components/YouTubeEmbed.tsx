import { Box } from "@chakra-ui/react";

interface YouTubeEmbedProps {
  videoUrl: string;
}

export const YouTubeEmbed = ({ videoUrl }: YouTubeEmbedProps) => {
  if (!videoUrl) return null;

  return (
    <Box
      position="relative"
      width="100%"
      paddingTop="56.25%" // 16:9 aspect ratio
      borderRadius="lg"
      overflow="hidden"
    >
      <iframe
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        src={videoUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};
