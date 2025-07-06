"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Input, VStack, Text, useToast } from "@chakra-ui/react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("🔍 ログイン試行開始");

      // パスワードの検証をAPIエンドポイントで行う
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
        // 認証情報を含める
        credentials: "include",
      });

      console.log("🔍 ログイン認証レスポンス", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 ログイン成功", data);

        toast({
          title: "成功",
          description: "ログインしました",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        // サーバー側でCookieが設定されているので、クライアント側では設定しない
        // 少し待ってからリダイレクト
        setTimeout(() => {
          router.push("/admin/artists");
        }, 1000);
      } else {
        const errorData = await response.json();
        console.log("🔍 ログイン失敗", errorData);

        toast({
          title: "エラー",
          description: "パスワードが正しくありません",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("🔍 ログインエラー:", error);
      toast({
        title: "エラー",
        description: "ログイン処理中にエラーが発生しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
          isDisabled={isLoading}
        />
        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={isLoading}
          loadingText="ログイン中..."
        >
          ログイン
        </Button>
      </VStack>
    </Box>
  );
}
