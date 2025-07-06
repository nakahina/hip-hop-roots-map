import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

interface HeaderProps {
  showAbout: boolean;
  showContact: boolean;
  onSetShowAbout: (show: boolean) => void;
  onSetShowContact: (show: boolean) => void;
  onOpen: () => void;
}

export default function Header({
  showAbout,
  showContact,
  onSetShowAbout,
  onSetShowContact,
  onOpen,
}: HeaderProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box
      as="header"
      h="60px"
      w="100%"
      bg="black"
      px={4}
      display="flex"
      alignItems="center"
      boxShadow="sm"
      zIndex={1001}
      position="fixed"
      top={0}
      borderColor="gray.700"
      borderWidth="1px"
    >
      <Flex w="100%" align="center" justify="space-between">
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color="white"
          letterSpacing="wider"
          textTransform="uppercase"
        >
          <span
            style={{
              color: "#FDD835",
              fontWeight: "bold",
              letterSpacing: "wider",
            }}
          >
            HIPHOP ROOTS
          </span>
        </Text>
        <Box>
          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ color: "yellow.400", bg: "gray.700" }}
              onClick={() => {
                onSetShowAbout(false);
                onSetShowContact(false);
              }}
              letterSpacing="wider"
              display={{
                base: "none",
                md: "flex",
              }}
            >
              MAP
            </Button>
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ color: "yellow.400", bg: "gray.700" }}
              onClick={() => {
                onSetShowAbout(true);
                onSetShowContact(false);
              }}
              letterSpacing="wider"
              display={{
                base: "none",
                md: "flex",
              }}
            >
              About
            </Button>
            <Button
              variant="ghost"
              color="gray.400"
              _hover={{ color: "yellow.400", bg: "gray.700" }}
              onClick={() => {
                onSetShowContact(true);
                onSetShowAbout(false);
              }}
              letterSpacing="wider"
              display={{
                base: "none",
                md: "flex",
              }}
            >
              Contact
            </Button>
          </HStack>
          {isMobile && (
            <IconButton
              aria-label="Menu"
              icon={<HamburgerIcon boxSize={6} />}
              variant="ghost"
              color="gray.400"
              _hover={{ color: "yellow.400", bg: "gray.700" }}
              onClick={onOpen}
              ml={2}
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
}
