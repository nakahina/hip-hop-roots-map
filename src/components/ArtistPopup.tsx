import { Box, Text, Heading, useColorModeValue } from "@chakra-ui/react";
import { Artist } from "@/data/artist";

export function ArtistPopup({ artist }: { artist: Artist }) {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  return (
    <Box bg={bgColor} color={textColor} p={2} borderRadius="md">
      <Heading size="sm" mb={1}>
        {artist.name}
      </Heading>
      <Text fontSize="sm" mb={1}>
        {artist.city}
      </Text>
      <Text fontSize="sm" mb={2}>
        {artist.songTitle}
      </Text>
      <iframe
        src={`https://open.spotify.com/embed/track/${artist.spotifyTrackId}`}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: "4px" }}
      ></iframe>
    </Box>
  );
}
