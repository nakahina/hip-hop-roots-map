import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      toast({
        title: "Sent",
        description: "Thank you for your message.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box
      p={6}
      borderRadius="xl"
      bg="gray.800"
      border="1px"
      borderColor="gray.700"
      _hover={{ transform: "translateY(-2px)", transition: "all 0.2s" }}
      transition="all 0.2s"
      w="100%"
      mx="auto"
    >
      <HStack spacing={4} mb={6}>
        <Icon as={FaEnvelope} boxSize={6} color="yellow.400" />
        <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
          Contact
        </Text>
      </HStack>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel color="gray.300">Name</FormLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _hover={{ borderColor: "gray.500" }}
              _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color="gray.300">Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _hover={{ borderColor: "gray.500" }}
              _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color="gray.300">Message</FormLabel>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _hover={{ borderColor: "gray.500" }}
              _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="yellow"
            size="lg"
            width="full"
            isLoading={isSubmitting}
            loadingText="Sending..."
            mt={4}
          >
            Submit
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
