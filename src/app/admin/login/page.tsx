"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Input, VStack, Text, useToast } from "@chakra-ui/react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // パスワードの検証をAPIエンドポイントで行う
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // セッションクッキーを設定
        document.cookie = "admin_session=true; path=/";
        router.push("/admin/artists");
      } else {
        toast({
          title: "エラー",
          description: "パスワードが正しくありません",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログイン処理中にエラーが発生しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6}>
      <VStack spacing={4} as="form" onSubmit={handleLogin}>
        <Text fontSize="2xl" fontWeight="bold">
          HIPHOP ROOTS 管理者ログイン
        </Text>
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" colorScheme="blue" width="100%">
          ログイン
        </Button>
      </VStack>
    </Box>
  );
}
