"use client";
import dynamic from "next/dynamic";
import { Box } from "@chakra-ui/react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  return (
    <Box w="100vw" h="100vh">
      <MapView />
    </Box>
  );
}
