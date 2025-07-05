import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  Image,
  HStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { DeleteIcon, AttachmentIcon } from "@chakra-ui/icons";

interface ImageUploadProps {
  artistName: string;
  currentOriginalUrl?: string;
  currentSmallUrl?: string;
  onUploadSuccess: (originalUrl: string, smallUrl: string) => void;
}

interface UploadResponse {
  success: boolean;
  originalUrl: string;
  smallUrl: string;
  message: string;
  error?: string;
}

export default function ImageUpload({
  artistName,
  currentOriginalUrl,
  currentSmallUrl,
  onUploadSuccess,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB制限)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "ファイルサイズエラー",
        description: "ファイルサイズは5MB以下にしてください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      toast({
        title: "ファイルタイプエラー",
        description: "画像ファイルのみアップロード可能です",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);

    // プレビュー画像を作成
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !artistName) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("artistName", artistName);

      // プログレスバーのアニメーション
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: UploadResponse = await response.json();

      if (result.success) {
        onUploadSuccess(result.originalUrl, result.smallUrl);
        toast({
          title: "成功",
          description: result.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // リセット
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error(result.error || "アップロードに失敗しました");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
      toast({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "アップロードに失敗しました",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* 現在の画像表示 */}
      {currentSmallUrl && !previewUrl && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            現在の画像:
          </Text>
          <Image
            src={currentSmallUrl}
            alt="現在の画像"
            boxSize="100px"
            objectFit="cover"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          />
        </Box>
      )}

      {/* ファイル選択 */}
      <Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <Button
          leftIcon={<AttachmentIcon />}
          onClick={() => fileInputRef.current?.click()}
          isDisabled={isUploading}
          colorScheme="blue"
          variant="outline"
          size="sm"
        >
          画像を選択
        </Button>
      </Box>

      {/* プレビュー画像 */}
      {previewUrl && (
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              プレビュー:
            </Text>
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={handleClear}
              isDisabled={isUploading}
              aria-label="プレビューを削除"
            />
          </HStack>
          <Image
            src={previewUrl}
            alt="プレビュー"
            boxSize="100px"
            objectFit="cover"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          />
        </Box>
      )}

      {/* ファイル情報 */}
      {selectedFile && (
        <Box>
          <Text fontSize="sm" color="gray.600">
            ファイル: {selectedFile.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </Text>
        </Box>
      )}

      {/* アップロードボタン */}
      {selectedFile && (
        <Button
          onClick={handleUpload}
          isLoading={isUploading}
          loadingText="アップロード中..."
          colorScheme="green"
          size="sm"
        >
          S3にアップロード
        </Button>
      )}

      {/* プログレスバー */}
      {isUploading && (
        <Progress value={uploadProgress} colorScheme="green" size="sm" />
      )}

      {/* 注意事項 */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text fontSize="sm">
          画像は自動的にオリジナルサイズと300x300のサムネイルが作成されます。
          ファイルサイズは5MB以下にしてください。
        </Text>
      </Alert>
    </VStack>
  );
}
